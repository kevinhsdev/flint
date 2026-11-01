import type { Food, Goal, Macros, Meal } from './types';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** 4 kcal por g de proteína e carboidrato, 9 por g de gordura. */
export const kcalFrom = (p: number, c: number, f: number) => Math.round(4 * p + 4 * c + 9 * f);

export function totals(foods: Food[]): Macros {
  const sum = (k: keyof Macros) => foods.reduce((n, x) => n + x[k], 0);
  return { kcal: Math.round(sum('kcal')), p: r1(sum('p')), c: r1(sum('c')), f: r1(sum('f')) };
}

/** Refeições do dia na ordem configurada; alimento de refeição que não existe mais cai em "Outros". */
export function mealsOfDay(foods: Food[], day: string, meals: Meal[]) {
  const today = foods.filter(f => f.day === day).sort((a, b) => a.at - b.at);
  const ids = new Set(meals.map(m => m.id));
  const orphans = today.filter(f => !ids.has(f.meal));
  const list = meals.map(meal => ({ meal, foods: today.filter(f => f.meal === meal.id) }));
  if (orphans.length) list.push({ meal: { id: '', name: 'Outros' }, foods: orphans });
  return list.map(m => ({ ...m, total: totals(m.foods) }));
}

/** Atalhos: os alimentos mais anotados, com os valores da última vez. */
export function frequentFoods(foods: Food[], limit = 8): Food[] {
  const by = new Map<string, { last: Food; n: number }>();
  for (const f of foods) {
    const k = f.name.trim().toLowerCase();
    const cur = by.get(k);
    by.set(k, { last: !cur || f.at > cur.last.at ? f : cur.last, n: (cur?.n ?? 0) + 1 });
  }
  return [...by.values()].sort((a, b) => b.n - a.n || b.last.at - a.last.at).slice(0, limit).map(x => ({ ...x.last, name: x.last.name.trim() }));
}

const ADJUST: Record<Goal, number> = { massa: 300, forca: 200, condicionamento: 0, emagrecer: -400 };
const PROTEIN: Record<Goal, number> = { massa: 2, forca: 2, condicionamento: 1.6, emagrecer: 2.2 };

/** Ponto de partida: Mifflin-St Jeor × atividade (dias de treino), ajustado ao objetivo; gordura 0,8 g/kg, carbo completa. */
export function suggestGoal(x: { kg: number; cm: number; age: number; sex: 'm' | 'f'; trainDays: number; goal: Goal }): Macros {
  const bmr = 10 * x.kg + 6.25 * x.cm - 5 * x.age + (x.sex === 'm' ? 5 : -161);
  const kcal = Math.round((bmr * Math.min(1.725, 1.2 + 0.075 * x.trainDays) + ADJUST[x.goal]) / 50) * 50;
  const p = Math.round(PROTEIN[x.goal] * x.kg), f = Math.round(0.8 * x.kg);
  return { kcal, p, c: Math.max(0, Math.round((kcal - 4 * p - 9 * f) / 4)), f };
}

export function kcalDays(foods: Food[], days: string[]): Record<string, number> {
  const out = Object.fromEntries(days.map(d => [d, 0]));
  for (const f of foods) if (f.day in out) out[f.day] += f.kcal;
  return out;
}
