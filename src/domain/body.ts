import { RULES } from './rules';
import type { Settings, WeightLog } from './types';

export type BmiBand = 'abaixo' | 'normal' | 'sobrepeso' | 'obesidade';

/** IMC com as faixas da OMS. */
export function bmi(kg: number, cm: number): { value: number; band: BmiBand } {
  const value = kg / (cm / 100) ** 2;
  const band: BmiBand = value < 18.5 ? 'abaixo' : value < 25 ? 'normal' : value < 30 ? 'sobrepeso' : 'obesidade';
  return { value, band };
}

export function waterGoalMl(settings: Settings, latestKg?: number): number {
  if (settings.waterGoalMl) return settings.waterGoalMl;
  if (!latestKg) return RULES.waterDefaultMl;
  return Math.round((RULES.waterMlPerKg * latestKg) / RULES.waterRoundMl) * RULES.waterRoundMl;
}

/** Último peso registrado até o dia (inclusive). */
export const weightOn = (weights: WeightLog[], day: string): number | undefined =>
  weights.filter(w => w.day <= day).sort((a, b) => a.day.localeCompare(b.day)).at(-1)?.kg;
