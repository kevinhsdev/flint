import { computeXP, dailyMedals, goalWeeksStreak, milestones, missedTrainDays, mood, type GameData } from '../../src/domain/gamification';
import { EXERCISES } from '../../src/domain/exercises';
import { DEFAULT_SETTINGS } from '../../src/db/repo';
import type { WaterLog } from '../../src/domain/types';
import { sess } from './helpers';

const water = (day: string, ml: number): WaterLog => ({ id: day + ml, day, at: new Date(`${day}T12:00`).getTime(), ml });
const data = (over: Partial<GameData> = {}): GameData => ({
  sessions: [], water: [], weights: [], settings: { ...DEFAULT_SETTINGS, waterGoalMl: 2000 }, library: EXERCISES, ...over,
});

// trainDays seg(1) qua(3) sex(5); outubro/2026: dia 5 = segunda
const MWF = [1, 3, 5];

test('descanso não quebra: treinou sexta, hoje é segunda → feliz', () => {
  const s = [sess('a', 9, [])]; // sexta 9/10
  expect(missedTrainDays(s, MWF, new Date(2026, 9, 12))).toBe(0);
  expect(mood(s, MWF, new Date(2026, 9, 12))).toBe('happy');
});
test('2 dias marcados sem treino → triste', () => {
  const s = [sess('a', 5, [])]; // segunda 5/10; faltou qua 7 e sex 9
  expect(missedTrainDays(s, MWF, new Date(2026, 9, 10))).toBe(2);
  expect(mood(s, MWF, new Date(2026, 9, 10))).toBe('sad');
});
test('1 dia marcado perdido ainda é feliz', () => {
  expect(mood([sess('a', 5, [])], MWF, new Date(2026, 9, 8))).toBe('happy');
});

test('medalhas diárias', () => {
  const d = data({ sessions: [sess('a', 5, [['supino-reto-barra', [[60, 10]]]])], water: [water('2026-10-05', 2000)] });
  expect(dailyMedals('2026-10-05', d)).toEqual(['treino', 'hidratado', 'dia-completo']);
  expect(dailyMedals('2026-10-06', d)).toEqual([]);
});
test('medalha recorde no dia do PR', () => {
  const d = data({ sessions: [sess('a', 5, [['x', [[60, 10]]]]), sess('b', 7, [['x', [[65, 10]]]])] });
  expect(dailyMedals('2026-10-07', d)).toEqual(['treino', 'recorde']);
});

test('sequência de semanas com meta batida', () => {
  // semanas que começam 5/10 e 12/10 com 3 treinos cada; semana de 19/10 em andamento com 1
  const days = [5, 7, 9, 12, 14, 16, 19];
  const s = days.map(d => sess('s' + d, d, []));
  expect(goalWeeksStreak(s, MWF, new Date(2026, 9, 20))).toBe(2);
  expect(goalWeeksStreak([...s, sess('x', 20, []), sess('y', 21, [])], MWF, new Date(2026, 9, 21))).toBe(3);
});

test('marcos: 1º treino e 10 treinos', () => {
  const s = Array.from({ length: 10 }, (_, i) => sess('s' + i, i + 1, []));
  expect(milestones(data({ sessions: s }), new Date(2026, 9, 20))).toEqual(expect.arrayContaining(['treinos-1', 'treinos-10']));
});

test('XP é derivado: remover treino reduz', () => {
  const d = data({ sessions: [sess('a', 5, [['x', [[60, 10]]]]), sess('b', 7, [['x', [[65, 10]]]])] });
  const before = computeXP(d, new Date(2026, 9, 10));
  expect(before.stage).toBe('faisca');
  expect(before.next).toBe(1500);
  d.sessions.pop();
  expect(computeXP(d, new Date(2026, 9, 10)).xp).toBeLessThan(before.xp);
});
