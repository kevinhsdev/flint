import { bmiCopy, generatePlan, PLACE_EQUIPMENT, planSummary } from '../../src/domain/plan';
import { EXERCISES } from '../../src/domain/exercises';
import type { Profile } from '../../src/domain/types';

const base: Profile = { goal: 'massa', level: 'intermediario', days: [1, 3, 5], minutes: 60, place: 'completa', age: 30 };
const eqOf = (id: string) => EXERCISES.find(e => e.id === id)!.equipment;

test('3 dias intermediário → ABC com 6 exercícios', () => {
  const t = generatePlan(base, EXERCISES);
  expect(t.map(x => x.name[0])).toEqual(['A', 'B', 'C']);
  t.forEach((x, i) => { expect(x.items).toHaveLength(6); expect(x.order).toBe(i); expect(x.archived).toBe(false); });
  expect(new Set(t.map(x => x.id)).size).toBe(3);
});

test('massa usa 8–12 e 90 s; força 3–6 e 180 s; emagrecer 12–15 e 60 s', () => {
  const item = (g: Profile['goal']) => generatePlan({ ...base, goal: g }, EXERCISES)[0].items[0];
  expect(item('massa')).toMatchObject({ repMin: 8, repMax: 12, restSec: 90 });
  expect(item('forca')).toMatchObject({ repMin: 3, repMax: 6, restSec: 180 });
  expect(item('emagrecer')).toMatchObject({ repMin: 12, repMax: 15, restSec: 60 });
  expect(item('condicionamento')).toMatchObject({ repMin: 12, repMax: 15, restSec: 60 });
});

test('em casa só halteres e peso corporal; academia básica sem polia', () => {
  for (const x of generatePlan({ ...base, place: 'casa', days: [1, 2, 3, 4, 5] }, EXERCISES).flatMap(t => t.items))
    expect(['dumbbell', 'bodyweight']).toContain(eqOf(x.exerciseId));
  for (const x of generatePlan({ ...base, place: 'basica', days: [1, 2, 3, 4, 5, 6] }, EXERCISES).flatMap(t => t.items))
    expect(PLACE_EQUIPMENT.basica).toContain(eqOf(x.exerciseId));
});

test('iniciante não começa com terra nem agachamento livre, e faz 3 séries', () => {
  for (const days of [[1, 3], [1, 3, 5], [1, 2, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]]) {
    for (const t of generatePlan({ ...base, level: 'iniciante', days }, EXERCISES)) {
      expect(['levantamento-terra', 'agachamento-livre', 'good-morning', 'nordic-curl']).not.toContain(t.items[0].exerciseId);
      t.items.forEach(x => expect(x.sets).toBe(3));
    }
  }
});

test('intermediário: 4 séries nos dois primeiros, 3 no resto; 50+ tira uma dos compostos', () => {
  expect(generatePlan(base, EXERCISES)[0].items.map(x => x.sets)).toEqual([4, 4, 3, 3, 3, 3]);
  expect(generatePlan({ ...base, age: 55 }, EXERCISES)[0].items.map(x => x.sets)).toEqual([3, 3, 3, 3, 3, 3]);
});

test('extremos: 2 dias, casa, 30 min, 90 anos → 2 treinos com 4 exercícios', () => {
  const t = generatePlan({ goal: 'emagrecer', level: 'iniciante', days: [2, 5], minutes: 30, place: 'casa', age: 90 }, EXERCISES);
  expect(t).toHaveLength(2);
  t.forEach(x => expect(x.items).toHaveLength(4));
});

test('tempo define o número de exercícios', () => {
  for (const [minutes, n] of [[30, 4], [45, 5], [60, 6], [90, 7]] as const)
    expect(generatePlan({ ...base, minutes }, EXERCISES)[0].items).toHaveLength(n);
});

test('sem repetição de exercício no mesmo treino e só exercícios que existem', () => {
  for (const days of [[1, 3], [1, 3, 5], [1, 2, 4, 5], [1, 2, 3, 4, 5], [1, 2, 3, 4, 5, 6]])
    for (const place of ['completa', 'basica', 'casa'] as const)
      for (const t of generatePlan({ ...base, days, place, minutes: 90 }, EXERCISES)) {
        const ids = t.items.map(x => x.exerciseId);
        expect(new Set(ids).size).toBe(ids.length);
        ids.forEach(id => expect(EXERCISES.some(e => e.id === id)).toBe(true));
        expect(ids.length).toBeGreaterThanOrEqual(4);
      }
});

test('divisão pelos dias: 2 full body, 4 superior/inferior, 5 ABCDE, 6 PPL', () => {
  const n = (days: number[]) => generatePlan({ ...base, days }, EXERCISES);
  expect(n([1, 4])).toHaveLength(2);
  expect(n([1, 2, 4, 5]).map(t => t.name)).toEqual(expect.arrayContaining([expect.stringMatching(/Superior/), expect.stringMatching(/Inferior/)]));
  expect(n([1, 2, 3, 4, 5])).toHaveLength(5);
  expect(n([1, 2, 3, 4, 5, 6]).map(t => t.name[0])).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
});

test('arquivados da biblioteca não entram', () => {
  const lib = EXERCISES.map(e => (e.id === 'supino-reto-barra' ? { ...e, archived: true } : e));
  expect(generatePlan(base, lib).flatMap(t => t.items).some(x => x.exerciseId === 'supino-reto-barra')).toBe(false);
});

test('resumo da estratégia e IMC sem julgamento', () => {
  expect(planSummary(base)).toMatchObject({ reps: [8, 12], restSec: 90 });
  expect(planSummary(base).split).toMatch(/ABC/);
  const b = bmiCopy(80, 180, 30);
  expect(b.value).toBeCloseTo(24.7, 1);
  expect(b.band).toBe('normal');
  expect(b.text.length).toBeGreaterThan(20);
});
