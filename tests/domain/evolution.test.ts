import { db } from '../../src/db/db';
import { addChallenge, getSettings, loadDemo, logMeasures, saveSettings, wipeAll } from '../../src/db/repo';
import { exportBackup, importBackup } from '../../src/domain/backup';
import { challengeProgress, latestMeasures, lifetimeTotals, weightGoal, weeklyTrend } from '../../src/domain/evolution';
import { cardioSession, checkinSession } from '../../src/domain/training';
import type { Challenge, Measure, Session, WaterLog, WeightLog } from '../../src/domain/types';
import { EXERCISES } from '../../src/domain/exercises';

const w = (day: string, kg: number): WeightLog => ({ id: day, day, kg });
const at = (day: string, h = 18) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, h).getTime(); };
const lift = (day: string, sets: number, kg = 100, reps = 10): Session => ({
  id: `s${day}${sets}`, templateId: null, name: 'A', startedAt: at(day), endedAt: at(day) + 3_600_000,
  entries: [{ exerciseId: 'supino-reto-barra', sets: Array.from({ length: sets }, () => ({ kg, reps, done: true })) }],
});

describe('meta de peso', () => {
  test('inicial, atual, meta e quanto do caminho já foi', () => {
    const g = weightGoal([w('2026-10-01', 90), w('2026-10-20', 86), w('2026-10-10', 88)], 80)!;
    expect(g).toEqual({ start: 90, current: 86, goal: 80, done: 0.4, left: 6 });
  });
  test('ganhar peso também conta; passar da meta trava em 100%', () => {
    expect(weightGoal([w('2026-10-01', 60), w('2026-10-20', 66)], 65)).toMatchObject({ done: 1, left: 0 });
  });
  test('sem meta ou sem peso, nada', () => {
    expect(weightGoal([w('2026-10-01', 60)], null)).toBeNull();
    expect(weightGoal([], 70)).toBeNull();
  });
  test('tendência: kg por semana na reta dos últimos 28 dias', () => {
    const ws = [w('2026-10-01', 90), w('2026-10-08', 89.5), w('2026-10-15', 89), w('2026-10-22', 88.5)];
    expect(weeklyTrend(ws, '2026-10-22')).toBeCloseTo(-0.5, 5);
    expect(weeklyTrend([w('2026-10-22', 88)], '2026-10-22')).toBeNull();
    expect(weeklyTrend([w('2026-08-01', 95), w('2026-08-08', 94)], '2026-10-22')).toBeNull(); // velho demais
  });
});

test('medidas: último valor de cada parte e a diferença pro primeiro', () => {
  const m: Measure[] = [
    { id: '1', day: '2026-09-01', part: 'cintura', cm: 90 }, { id: '2', day: '2026-10-01', part: 'cintura', cm: 86.5 },
    { id: '3', day: '2026-10-01', part: 'braco', cm: 38 },
  ];
  expect(latestMeasures(m)).toEqual({ cintura: { cm: 86.5, delta: -3.5, day: '2026-10-01' }, braco: { cm: 38, delta: 0, day: '2026-10-01' } });
});

test('seus números: treinos, séries, toneladas, horas e km de cardio da vida toda', () => {
  const t = lifetimeTotals([lift('2026-10-01', 3), lift('2026-10-02', 2), cardioSession({ type: 'corrida', min: 30, km: 5 }), checkinSession('B', null, 60),
    { ...lift('2026-10-03', 9), endedAt: null }]);
  expect(t).toEqual({ workouts: 4, sets: 5, kg: 5000, min: 210, km: 5 });
});

describe('desafios', () => {
  const ch = (p: Partial<Challenge>): Challenge => ({ id: 'c', kind: 'treinos', target: 3, startDay: '2026-10-01', days: 7, ...p });
  const data = (sessions: Session[], water: WaterLog[] = []) => ({ sessions, water, waterGoalMl: 2000, library: EXERCISES });

  test('conta só o que caiu dentro do prazo', () => {
    const d = data([lift('2026-09-30', 1), lift('2026-10-01', 1), lift('2026-10-03', 1), lift('2026-10-08', 1)]);
    expect(challengeProgress(ch({}), d, '2026-10-05')).toEqual({ value: 2, done: false, over: false, daysLeft: 3 });
  });
  test('bater a meta conclui, mesmo depois do prazo', () => {
    const d = data([lift('2026-10-01', 1), lift('2026-10-02', 1), lift('2026-10-03', 1)]);
    expect(challengeProgress(ch({}), d, '2026-10-20')).toMatchObject({ value: 3, done: true, over: true });
  });
  test('prazo acabou sem bater: não concluído', () => {
    expect(challengeProgress(ch({}), data([lift('2026-10-01', 1)]), '2026-10-08')).toMatchObject({ done: false, over: true, daysLeft: 0 });
  });
  test('séries, km de cardio e dias de água na meta', () => {
    const d = data([lift('2026-10-01', 4), { ...cardioSession({ type: 'corrida', min: 30, km: 5.5 }, new Date(at('2026-10-02'))) }],
      [{ id: 'a', day: '2026-10-01', at: 0, ml: 2000 }, { id: 'b', day: '2026-10-02', at: 0, ml: 1500 }, { id: 'c', day: '2026-10-02', at: 0, ml: 600 }, { id: 'd', day: '2026-10-03', at: 0, ml: 900 }]);
    expect(challengeProgress(ch({ kind: 'series', target: 20 }), d, '2026-10-03').value).toBe(4);
    expect(challengeProgress(ch({ kind: 'cardio', target: 10 }), d, '2026-10-03').value).toBe(5.5);
    expect(challengeProgress(ch({ kind: 'agua', target: 5 }), d, '2026-10-03').value).toBe(2);
  });
});

describe('banco e backup', () => {
  const file = (o: unknown) => new Blob([JSON.stringify(o)]);
  const json = async () => JSON.parse(await (await exportBackup(false)).text());
  beforeEach(async () => { await wipeAll(); await loadDemo(); });

  test('medida do mesmo dia e parte substitui', async () => {
    await logMeasures('2026-10-01', { cintura: 90, braco: 38 });
    await logMeasures('2026-10-01', { cintura: 89 });
    const all = await db.measures.toArray();
    expect(all.map(m => [m.part, m.cm]).sort()).toEqual([['braco', 38], ['cintura', 89]]);
  });

  test('medidas, desafios e meta de peso vão e voltam no backup', async () => {
    await logMeasures('2026-10-01', { cintura: 90 });
    await addChallenge({ kind: 'treinos', target: 12, days: 30 }, '2026-10-01');
    await saveSettings({ weightGoalKg: 80 });
    const back = await json();
    await wipeAll();
    expect(await importBackup(file(back))).toEqual({ ok: true });
    expect(await db.measures.count()).toBe(1);
    expect((await db.challenges.toArray())[0]).toMatchObject({ kind: 'treinos', target: 12, days: 30, startDay: '2026-10-01' });
    expect((await getSettings()).weightGoalKg).toBe(80);
  });

  test('backup antigo, sem as tabelas novas, ainda restaura', async () => {
    const old = await json();
    delete old.data.measures; delete old.data.challenges; old.version = 2;
    expect(await importBackup(file(old))).toEqual({ ok: true });
  });

  test('medida ou desafio quebrado é recusado', async () => {
    const bad = await json();
    bad.data.measures = [{ id: 'x', day: '2026-10-01', part: 'orelha', cm: 3 }];
    expect((await importBackup(file(bad))).ok).toBe(false);
    const bad2 = await json();
    bad2.data.challenges = [{ id: 'x', kind: 'treinos', target: -1, startDay: '2026-10-01', days: 7 }];
    expect((await importBackup(file(bad2))).ok).toBe(false);
  });
});
