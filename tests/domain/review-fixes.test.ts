import { plateau } from '../../src/domain/plateau';
import { forecastWeeks } from '../../src/domain/forecast';
import { generatePlan } from '../../src/domain/plan';
import { waterGoalMl } from '../../src/domain/body';
import { deloadKg } from '../../src/domain/warmup';
import { EXERCISES } from '../../src/domain/exercises';
import { DEFAULT_SETTINGS } from '../../src/db/repo';
import { addDays, localDay } from '../../src/domain/dates';
import type { Session } from '../../src/domain/types';

const today = new Date(2026, 9, 30, 12);
const at = (daysAgo: number, exerciseId: string, kg: number, reps: number): Session => {
  const t = today.getTime() - daysAgo * 864e5;
  return { id: `${exerciseId}${daysAgo}`, templateId: null, name: 'x', startedAt: t, endedAt: t + 3600e3, entries: [{ exerciseId, sets: [{ kg, reps, done: true }] }] };
};

test('peso corporal não vira platô só porque a carga é 0', () => {
  const s = [at(30, 'flexao', 0, 10), at(15, 'flexao', 0, 12), at(8, 'flexao', 0, 14), at(2, 'flexao', 0, 16)];
  expect(plateau('flexao', s, today)).toBe(false);
});

test('quem volta de pausa e está subindo não é platô', () => {
  const s = [at(180, 'supino-reto-barra', 100, 5), at(15, 'supino-reto-barra', 60, 5), at(8, 'supino-reto-barra', 70, 5), at(2, 'supino-reto-barra', 80, 5)];
  expect(plateau('supino-reto-barra', s, today)).toBe(false);
});

test('platô de verdade continua detectado', () => {
  const s = [at(30, 'supino-reto-barra', 100, 5), at(15, 'supino-reto-barra', 100, 5), at(8, 'supino-reto-barra', 100, 5), at(2, 'supino-reto-barra', 95, 5)];
  expect(plateau('supino-reto-barra', s, today)).toBe(true);
});

test('iniciante ou 50+ nunca recebe exercício técnico arriscado em nenhum dia', () => {
  const risky = new Set(['levantamento-terra', 'agachamento-livre', 'good-morning', 'nordic-curl']);
  for (const place of ['casa', 'basica', 'completa'] as const)
    for (const days of [[1, 4], [1, 3, 5], [1, 2, 4, 5]]) {
      const plans = [
        generatePlan({ goal: 'massa', level: 'iniciante', days, minutes: 30, place, age: 25 }, EXERCISES),
        generatePlan({ goal: 'forca', level: 'avancado', days, minutes: 90, place, age: 90 }, EXERCISES),
      ];
      for (const t of plans.flat()) for (const i of t.items) expect(risky.has(i.exerciseId), `${place} ${t.name} ${i.exerciseId}`).toBe(false);
    }
});

test('corpo todo A e B usam a 1ª opção de cada músculo (só dias repetidos variam)', () => {
  const [, b] = generatePlan({ goal: 'massa', level: 'intermediario', days: [1, 4], minutes: 60, place: 'completa', age: 30 }, EXERCISES);
  expect(b.items.map(i => i.exerciseId)).toContain('supino-reto-barra');
});

test('meta de água automática tem teto', () => {
  expect(waterGoalMl(DEFAULT_SETTINGS, 300)).toBeLessThanOrEqual(4500);
  expect(waterGoalMl({ ...DEFAULT_SETTINGS, waterGoalMl: 6000 }, 300)).toBe(6000); // manual fica como a pessoa digitou
});

test('meta já batida é "batida" mesmo com poucos pontos ou dados antigos', () => {
  const t = localDay(today);
  expect(forecastWeeks([{ day: t, maxKg: 130 }], 120, today)).toEqual({ reached: true });
  expect(forecastWeeks([{ day: addDays(t, -100), maxKg: 130 }], 120, today)).toEqual({ reached: true });
});

test('deload nunca desce da barra vazia e respeita o passo do equipamento', () => {
  expect(deloadKg(20, 'barbell')).toBe(20);
  expect(deloadKg(100, 'barbell')).toBe(90);
  expect(deloadKg(30, 'dumbbell')).toBe(28);
  expect(deloadKg(10, 'machine')).toBe(10);
});
