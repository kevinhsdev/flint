import { RULES } from './rules';
import { addDays } from './dates';
import type { Settings, WaterLog, WeightLog } from './types';

export type BmiBand = 'abaixo' | 'normal' | 'sobrepeso' | 'obesidade';

/** IMC com as faixas da OMS. */
export function bmi(kg: number, cm: number): { value: number; band: BmiBand } {
  const value = kg / (cm / 100) ** 2;
  const band: BmiBand = value < 18.5 ? 'abaixo' : value < 25 ? 'normal' : value < 30 ? 'sobrepeso' : 'obesidade';
  return { value, band };
}

export const WATER_MAX_ML = 4500;

export function waterGoalMl(settings: Settings, latestKg?: number): number {
  if (settings.waterGoalMl) return settings.waterGoalMl;
  if (!latestKg) return RULES.waterDefaultMl;
  // teto na meta automática: acima disso é recomendação demais pra um app dar sozinho
  return Math.min(WATER_MAX_ML, Math.round((RULES.waterMlPerKg * latestKg) / RULES.waterRoundMl) * RULES.waterRoundMl);
}

/** Último peso registrado até o dia (inclusive). */
export const weightOn = (weights: WeightLog[], day: string): number | undefined =>
  weights.filter(w => w.day <= day).sort((a, b) => a.day.localeCompare(b.day)).at(-1)?.kg;

const totals = (water: WaterLog[]) => {
  const m = new Map<string, number>();
  for (const w of water) m.set(w.day, (m.get(w.day) ?? 0) + w.ml);
  return m;
};

/** Fração da meta bebida em cada dia (0–1). */
export function waterDays(water: WaterLog[], goal: number, days: string[]): Record<string, number> {
  const t = totals(water);
  return Object.fromEntries(days.map(d => [d, Math.min(1, Math.round(((t.get(d) ?? 0) / goal) * 100) / 100)]));
}

/** Dias seguidos batendo a meta; hoje ainda incompleto não quebra a sequência de ontem. */
export function waterStreak(water: WaterLog[], goal: number, today: string): number {
  const t = totals(water);
  let day = (t.get(today) ?? 0) >= goal ? today : addDays(today, -1), n = 0;
  while ((t.get(day) ?? 0) >= goal) { n++; day = addDays(day, -1); }
  return n;
}
