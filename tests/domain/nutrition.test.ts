import { db } from '../../src/db/db';
import { copyMeal, getSettings, logFood, saveSettings, startFresh } from '../../src/db/repo';
import { exportBackup, importBackup } from '../../src/domain/backup';
import { frequentFoods, kcalDays, kcalFrom, mealsOfDay, suggestGoal, totals } from '../../src/domain/nutrition';
import { DEFAULT_SETTINGS } from '../../src/domain/settings';
import type { Food } from '../../src/domain/types';

const food = (p: Partial<Food>): Food => ({ id: Math.random().toString(), day: '2026-10-01', at: 0, meal: 'almoco', name: 'Arroz', qty: '', kcal: 100, p: 2, c: 20, f: 1, ...p });

test('kcal sai dos macros: 4 por g de proteína e carbo, 9 por g de gordura', () => {
  expect(kcalFrom(4, 42, 0.5)).toBe(189);
  expect(kcalFrom(0, 0, 0)).toBe(0);
});

test('totais do dia somam kcal e macros', () => {
  expect(totals([food({ kcal: 189, p: 4, c: 42, f: 0.5 }), food({ kcal: 250, p: 31.2, c: 0, f: 13.1 })]))
    .toEqual({ kcal: 439, p: 35.2, c: 42, f: 13.6 });
  expect(totals([])).toEqual({ kcal: 0, p: 0, c: 0, f: 0 });
});

test('refeições do dia seguem a ordem configurada; refeição apagada vira "Outros"', () => {
  const meals = DEFAULT_SETTINGS.meals;
  const foods = [food({ meal: 'jantar', kcal: 300 }), food({ meal: 'cafe', kcal: 200 }), food({ meal: 'sumiu', kcal: 50 }), food({ meal: 'cafe', kcal: 100, day: '2026-10-02' })];
  const out = mealsOfDay(foods, '2026-10-01', meals);
  expect(out.map(m => [m.meal.name, m.total.kcal])).toEqual([['Café da manhã', 200], ['Almoço', 0], ['Lanche', 0], ['Jantar', 300], ['Outros', 50]]);
  expect(mealsOfDay([], '2026-10-01', meals).map(m => m.meal.name)).toEqual(['Café da manhã', 'Almoço', 'Lanche', 'Jantar']);
});

test('frequentes: mais registrados primeiro, com os valores mais recentes, sem repetir nome', () => {
  const foods = [
    food({ name: 'Ovo', at: 1, kcal: 70 }), food({ name: 'ovo ', at: 5, kcal: 78 }), food({ name: 'Ovo', at: 3, kcal: 72 }),
    food({ name: 'Banana', at: 9 }), food({ name: 'Whey', at: 2 }), food({ name: 'Whey', at: 4 }),
  ];
  const f = frequentFoods(foods);
  expect(f.map(x => x.name)).toEqual(['ovo', 'Whey', 'Banana']);
  expect(f[0].kcal).toBe(78);
  expect(frequentFoods(foods, 1)).toHaveLength(1);
});

test('meta sugerida: Mifflin-St Jeor × atividade pelos dias de treino, ajustada ao objetivo', () => {
  // 10·80 + 6,25·180 − 5·30 + 5 = 1780 × (1,2 + 4·0,075) = 2670 + 300 (massa) → 2950 (múltiplo de 50)
  expect(suggestGoal({ kg: 80, cm: 180, age: 30, sex: 'm', trainDays: 4, goal: 'massa' })).toEqual({ kcal: 2950, p: 160, c: 434, f: 64 });
  // 10·60 + 6,25·165 − 5·25 − 161 = 1345,25 × 1,425 = 1917 − 400 (emagrecer) → 1500
  expect(suggestGoal({ kg: 60, cm: 165, age: 25, sex: 'f', trainDays: 3, goal: 'emagrecer' })).toEqual({ kcal: 1500, p: 132, c: 135, f: 48 });
});

test('kcal por dia para o gráfico da semana', () => {
  expect(kcalDays([food({ kcal: 100 }), food({ kcal: 50 }), food({ day: '2026-10-03', kcal: 10 })], ['2026-10-01', '2026-10-02']))
    .toEqual({ '2026-10-01': 150, '2026-10-02': 0 });
});

describe('banco', () => {
  beforeEach(() => startFresh());

  test('copiar refeição de ontem pra hoje', async () => {
    await logFood({ day: '2026-10-01', meal: 'jantar', name: 'Frango', qty: '150 g', kcal: 250, p: 46, c: 0, f: 6 });
    await logFood({ day: '2026-10-01', meal: 'almoco', name: 'Arroz', qty: '', kcal: 189, p: 4, c: 42, f: 0.5 });
    await copyMeal('2026-10-01', '2026-10-02', 'jantar');
    const today = await db.foods.where('day').equals('2026-10-02').toArray();
    expect(today.map(f => [f.name, f.meal, f.kcal])).toEqual([['Frango', 'jantar', 250]]);
  });

  test('backup leva alimentos, refeições e meta; backup antigo sem alimentos ainda importa', async () => {
    await logFood({ day: '2026-10-01', meal: 'cafe', name: 'Ovo', qty: '2 un', kcal: 156, p: 12.6, c: 1.2, f: 10.6 });
    await saveSettings({ nutritionGoal: { kcal: 2000, p: 150, c: 200, f: 60 }, meals: [{ id: 'cafe', name: 'Café' }] });
    const file = await exportBackup(false);
    const json = JSON.parse(await file.text());
    expect(json.version).toBe(4);
    await startFresh();
    expect((await importBackup(file)).ok).toBe(true);
    expect((await db.foods.toArray()).map(f => f.name)).toEqual(['Ovo']);
    expect((await getSettings()).nutritionGoal).toEqual({ kcal: 2000, p: 150, c: 200, f: 60 });

    delete json.data.foods; json.version = 3;
    expect((await importBackup(new Blob([JSON.stringify(json)]))).ok).toBe(true);
    expect(await db.foods.count()).toBe(0);
  });

  test('backup com alimento inválido é recusado', async () => {
    const json = JSON.parse(await (await exportBackup(false)).text());
    json.data.foods = [{ id: 'x', day: '2026-10-01', meal: 'cafe', name: 'Ovo', kcal: -5, p: 0, c: 0, f: 0 }];
    expect((await importBackup(new Blob([JSON.stringify(json)]))).ok).toBe(false);
  });
});

test('evolução semanal: média de kcal e proteína nos dias anotados', async () => {
  const { weeklyNutrition } = await import('../../src/domain/nutrition');
  // 2026-10-26 é segunda
  const foods = [food({ day: '2026-10-27', kcal: 2000, p: 150 }), food({ day: '2026-10-28', kcal: 1000, p: 50 }), food({ day: '2026-10-20', kcal: 1500, p: 100 })];
  const w = weeklyNutrition(foods, '2026-10-29', 3);
  expect(w).toEqual([
    { week: '2026-10-12', kcal: 0, p: 0, days: 0 },
    { week: '2026-10-19', kcal: 1500, p: 100, days: 1 },
    { week: '2026-10-26', kcal: 1500, p: 100, days: 2 },
  ]);
});
