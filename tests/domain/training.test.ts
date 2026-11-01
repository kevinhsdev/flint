import { db } from '../../src/db/db';
import { loadDemo, wipeAll } from '../../src/db/repo';
import { exportBackup, importBackup } from '../../src/domain/backup';
import { cardioSession, checkinSession, pace, restAfter, rpe, supersetRound, toggleGroup } from '../../src/domain/training';
import type { Entry } from '../../src/domain/types';

const set = (done: boolean, warmup = false) => ({ kg: 50, reps: 10, done, ...(warmup ? { warmup } : {}) });
const e = (group: string | undefined, ...done: boolean[]): Entry => ({ exerciseId: 'x', sets: done.map(d => set(d)), ...(group ? { group } : {}) });

describe('supersets', () => {
  test('juntar liga o item ao próximo; juntar de novo desfaz', () => {
    const items: { n: number; group?: string }[] = [{ n: 1 }, { n: 2 }, { n: 3 }];
    const linked = toggleGroup(items, 0, () => 'g1');
    expect(linked.map(i => i.group)).toEqual(['g1', 'g1', undefined]);
    // ligar o 2º ao 3º estende o mesmo grupo (tri-set)
    expect(toggleGroup(linked, 1, () => 'novo').map(i => i.group)).toEqual(['g1', 'g1', 'g1']);
    // desfazer no meio separa dali pra baixo
    expect(toggleGroup(toggleGroup(linked, 1, () => 'novo'), 1, () => 'z').map(i => i.group)).toEqual(['g1', 'g1', undefined]);
    // desfazer um par deixa os dois soltos
    expect(toggleGroup(linked, 0, () => 'z').map(i => i.group)).toEqual([undefined, undefined, undefined]);
  });

  test('o último item não tem com quem juntar', () => {
    const one: { n: number; group?: string }[] = [{ n: 1 }];
    expect(toggleGroup(one, 0, () => 'g')).toEqual([{ n: 1 }]);
  });

  test('rodada = menor nº de séries feitas no grupo + 1, sem passar do total', () => {
    const entries = [e('g', true, true, false), e('g', true, false, false), e(undefined, false)];
    expect(supersetRound(entries, 0)).toEqual({ round: 2, of: 3, first: 0, last: 1 });
    expect(supersetRound(entries, 2)).toBeNull();
    expect(supersetRound([e('g', true), e('g', true)], 1)).toEqual({ round: 1, of: 1, first: 0, last: 1 });
  });

  test('aquecimento não conta na rodada', () => {
    const entries: Entry[] = [{ exerciseId: 'a', group: 'g', sets: [set(true, true), set(false)] }, e('g', false)];
    expect(supersetRound(entries, 0)?.round).toBe(1);
  });

  test('descanso só depois do último exercício do superset', () => {
    const entries = [e('g', true), e('g', false), e(undefined, false)];
    expect(restAfter(entries, 0, 90)).toBe(0);
    expect(restAfter(entries, 1, 90)).toBe(90);
    expect(restAfter(entries, 2, 60)).toBe(60);
  });
});

test('RPE é 10 menos as reps que sobraram', () => {
  expect(rpe(0)).toBe(10);
  expect(rpe(2)).toBe(8);
  expect(rpe(5)).toBe(5);
});

describe('cardio e check-in', () => {
  test('ritmo: corrida e caminhada em min/km, bike em km/h', () => {
    expect(pace({ type: 'corrida', min: 30, km: 5 })).toBe('6:00 /km');
    expect(pace({ type: 'caminhada', min: 45.5, km: 4 })).toBe('11:23 /km');
    expect(pace({ type: 'bike', min: 60, km: 24.5 })).toBe('24,5 km/h');
    expect(pace({ type: 'corrida', min: 30, km: null })).toBeNull();
    expect(pace({ type: 'outro', min: 30, km: 3 })).toBeNull();
  });

  test('registro rápido vira um treino já terminado, com a duração informada', () => {
    const now = new Date(2026, 10, 1, 19, 0);
    const c = cardioSession({ type: 'corrida', min: 30, km: 5 }, now);
    expect(c).toMatchObject({ kind: 'cardio', name: 'Corrida', entries: [], templateId: null, endedAt: now.getTime(), startedAt: now.getTime() - 30 * 60_000 });
    const k = checkinSession('A — Peito', 'tA', 50, now);
    expect(k).toMatchObject({ kind: 'checkin', name: 'A — Peito', templateId: 'tA', entries: [], endedAt: now.getTime(), startedAt: now.getTime() - 50 * 60_000 });
    expect(c.id).not.toBe(k.id);
  });
});

describe('backup com os registros novos', () => {
  const file = (o: unknown) => new Blob([JSON.stringify(o)]);
  const json = async () => JSON.parse(await (await exportBackup(false)).text());
  beforeEach(async () => { await wipeAll(); await loadDemo(); });

  test('cardio, check-in, RIR e superset vão e voltam', async () => {
    await db.sessions.bulkAdd([cardioSession({ type: 'corrida', min: 30, km: 5 }), checkinSession('A', null, 40)]);
    const s = (await db.sessions.toArray()).find(x => x.entries.length)!;
    s.entries[0].group = 'g'; s.entries[1].group = 'g'; s.entries[0].sets[0].rir = 2;
    await db.sessions.put(s);
    const before = await db.sessions.toArray();
    expect(await importBackup(file(await json()))).toEqual({ ok: true });
    expect(await db.sessions.toArray()).toEqual(before);
  });

  test('cardio quebrado ou RIR fora da escala é recusado', async () => {
    const bad1 = await json();
    bad1.data.sessions.push({ ...cardioSession({ type: 'corrida', min: 30, km: 5 }), cardio: { type: 'nado', min: 30, km: 1 } });
    expect((await importBackup(file(bad1))).ok).toBe(false);
    const bad2 = await json();
    bad2.data.sessions[0].entries[0].sets[0].rir = 11;
    expect((await importBackup(file(bad2))).ok).toBe(false);
  });
});
