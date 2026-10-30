import type { Equipment, SetLog } from './types';

const BAR = 20;
const STEP: Record<Equipment, number> = { barbell: 2.5, dumbbell: 2, machine: 2.5, cable: 2.5, bodyweight: 0 };

/**
 * Séries de aquecimento pela carga de trabalho: barra vazia ×10 (só barra), 50% ×8, 75% ×3,
 * arredondadas para baixo no passo do equipamento. Descarta o que repete ou passa da carga.
 */
/** Deload: −10% na carga, arredondado no passo do equipamento, nunca abaixo da barra vazia. */
export function deloadKg(kg: number, eq: Equipment): number {
  const step = STEP[eq] || 1;
  const v = Math.round((kg * 0.9) / step) * step;
  return eq === 'barbell' ? Math.max(BAR, v) : Math.max(step, v);
}

export function warmupSets(workKg: number, eq: Equipment): SetLog[] {
  const step = STEP[eq];
  if (!step || (eq === 'barbell' && workKg <= BAR)) return [];
  const plan: [number, number][] = eq === 'barbell' ? [[BAR, 10]] : [];
  plan.push([Math.floor((workKg * 0.5) / step) * step, 8], [Math.floor((workKg * 0.75) / step) * step, 3]);
  const out: SetLog[] = [];
  for (const [kg, reps] of plan) {
    if (kg <= 0 || kg >= workKg || (out.length && kg <= out[out.length - 1].kg)) continue;
    out.push({ kg, reps, done: false, warmup: true });
  }
  return out;
}
