import { monthWrapped } from '../../src/domain/wrapped';
import { EXERCISES } from '../../src/domain/exercises';
import { DEFAULT_SETTINGS } from '../../src/db/repo';
import type { GameData } from '../../src/domain/gamification';
import type { WaterLog } from '../../src/domain/types';
import { sess } from './helpers';

const water = (day: string, ml: number): WaterLog => ({ id: day + ml, day, at: new Date(`${day}T12:00`).getTime(), ml });
const data = (over: Partial<GameData> = {}): GameData => ({
  sessions: [], water: [], weights: [], settings: { ...DEFAULT_SETTINGS, waterGoalMl: 2000, trainDays: [1, 3, 5] }, library: EXERCISES, ...over,
});

test('retrospectiva de outubro soma treinos, volume e recordes do mês', () => {
  const sessions = [
    sess('set', 0, [['supino-reto-barra', [[100, 5]]]]), // 30/09: fica de fora
    sess('a', 5, [['supino-reto-barra', [[100, 5]]]]),
    sess('b', 7, [['supino-reto-barra', [[100, 5]]]]),
    sess('c', 9, [['supino-reto-barra', [[100, 5]]]]),
    sess('d', 12, [['supino-reto-barra', [[105, 5]]]]),
  ];
  const w = monthWrapped('2026-10', data({ sessions, water: [water('2026-10-05', 2000), water('2026-10-06', 2500), water('2026-10-07', 900)] }))!;
  expect(w.workouts).toBe(4);
  expect(w.volumeKg).toBe(3 * 500 + 525);
  expect(w.minutes).toBe(240);
  expect(w.prs.length).toBeGreaterThan(0);
  expect(w.prs.every(p => new Date(p.at).getMonth() === 9)).toBe(true);
  expect(w.bestStreakDays).toBe(4); // seg, qua, sex, seg sem faltar
  expect(w.waterGoalDays).toBe(2);
  expect(w.topMuscle).toBe('peito');
});

test('faltar num dia marcado quebra a sequência do mês', () => {
  const sessions = [sess('a', 5, []), sess('b', 7, []), sess('c', 12, []), sess('d', 14, []), sess('e', 16, [])]; // faltou sex 9
  expect(monthWrapped('2026-10', data({ sessions }))!.bestStreakDays).toBe(3);
});

test('mês sem treino → null', () => {
  expect(monthWrapped('2026-11', data({ sessions: [sess('a', 5, [])] }))).toBeNull();
});

test('aquecimento fora do volume da retrospectiva', () => {
  const s = sess('a', 5, [['supino-reto-barra', [[100, 5]]]]);
  s.entries[0].sets.unshift({ kg: 50, reps: 8, done: true, warmup: true });
  expect(monthWrapped('2026-10', data({ sessions: [s] }))!.volumeKg).toBe(500);
});
