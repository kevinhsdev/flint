import { daysBetween, localDay } from './dates';

const LOOKBACK_DAYS = 56;
const MIN_POINTS = 3;
const MAX_WEEKS = 104;

/** Quantas semanas até a carga-alvo, pela reta (mínimos quadrados) das últimas 8 semanas. */
export function forecastWeeks(series: { day: string; maxKg: number }[], targetKg: number, today: Date): { weeks: number } | { reached: true } | null {
  const t = localDay(today);
  if (series.length && series[series.length - 1].maxKg >= targetKg) return { reached: true };
  const pts = series.filter(p => daysBetween(p.day, t) <= LOOKBACK_DAYS).map(p => [-daysBetween(p.day, t), p.maxKg]);
  if (pts.length < MIN_POINTS) return null;
  const last = pts[pts.length - 1][1];
  const n = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  const slope = pts.reduce((a, p) => a + (p[0] - mx) * (p[1] - my), 0) / pts.reduce((a, p) => a + (p[0] - mx) ** 2, 0);
  if (!(slope > 0)) return null;
  const weeks = Math.ceil((targetKg - last) / (slope * 7) - 1e-9);
  return weeks > MAX_WEEKS ? null : { weeks };
}
