import { db } from '../../src/db/db';
import { discardSession, finishSession, getActiveSession, startFresh, startSession, updateSession, upsertTemplate } from '../../src/db/repo';
import { parseKg } from '../../src/ui/NumberField';
import type { Template } from '../../src/domain/types';

const tplA: Template = {
  id: 'tA', name: 'A — Peito', order: 0, archived: false,
  items: [{ exerciseId: 'supino-reto-barra', sets: 3, repMin: 8, repMax: 12, restSec: 90 }],
};

beforeEach(async () => { await startFresh(); await upsertTemplate(tplA); });

test('parseKg', () => {
  expect(parseKg('22,5')).toBe(22.5); expect(parseKg('22.5')).toBe(22.5);
  expect(parseKg('')).toBeNull(); expect(parseKg('abc')).toBeNull();
  expect(parseKg(' 60 ')).toBe(60); expect(parseKg('-5')).toBeNull();
});

test('startSession preenche as séries do template', async () => {
  const id = await startSession(tplA.id);
  const s = (await getActiveSession())!;
  expect(s.id).toBe(id);
  expect(s.name).toBe('A — Peito');
  expect(s.entries).toHaveLength(1);
  expect(s.entries[0].sets).toHaveLength(3);
  expect(s.entries[0].sets.every(x => !x.done)).toBe(true);
});

test('startSession pré-preenche a carga sugerida pela última vez', async () => {
  await db.sessions.add({ id: 'old', templateId: 'tA', name: 'A', startedAt: 1, endedAt: 2,
    entries: [{ exerciseId: 'supino-reto-barra', sets: [12, 12, 12].map(reps => ({ kg: 60, reps, done: true })) }] });
  await startSession(tplA.id);
  expect((await getActiveSession())!.entries[0].sets[0].kg).toBe(62.5);
});

test('sessão ativa sobrevive a reabrir (novo Dexie)', async () => {
  await startSession(tplA.id);
  const s = (await getActiveSession())!; s.entries[0].sets[0] = { kg: 60, reps: 10, done: true };
  await updateSession(s); db.close(); await db.open();
  expect((await getActiveSession())!.entries[0].sets[0].done).toBe(true);
});

test('finalizar grava endedAt e encerra; descartar apaga', async () => {
  const id = await startSession(tplA.id);
  await finishSession(id);
  expect((await db.sessions.get(id))!.endedAt).toBeGreaterThan(0);
  expect(await getActiveSession()).toBeUndefined();
  const id2 = await startSession(null);
  await discardSession(id2);
  expect(await db.sessions.get(id2)).toBeUndefined();
  expect(await getActiveSession()).toBeUndefined();
});
