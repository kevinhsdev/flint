import { addDays, daysBetween, localDay } from './dates';
import { isWork } from './strength';
import type { Challenge, Exercise, Measure, MeasurePart, Session, WaterLog, WeightLog } from './types';

const byDay = <T extends { day: string }>(xs: T[]) => [...xs].sort((a, b) => a.day.localeCompare(b.day));
const dayOf = (s: Session) => localDay(new Date(s.startedAt));
const finished = (ss: Session[]) => ss.filter(s => s.endedAt !== null);
const workSets = (s: Session) => s.entries.flatMap(e => e.sets.filter(isWork));

/* ---------- peso e medidas ---------- */

/** Do primeiro peso até a meta: quanto já andou (0–1) e quantos kg faltam. Serve pra perder ou ganhar. */
export function weightGoal(weights: WeightLog[], goal: number | null) {
  const w = byDay(weights);
  if (goal === null || !w.length) return null;
  const start = w[0].kg, current = w.at(-1)!.kg, dir = Math.sign(goal - start) || 1;
  const done = start === goal ? 1 : Math.min(1, Math.max(0, (current - start) / (goal - start)));
  return { start, current, goal, done: Math.round(done * 100) / 100, left: Math.max(0, Math.round((goal - current) * dir * 10) / 10) };
}

/** kg por semana: inclinação da reta (mínimos quadrados) dos pesos dos últimos 28 dias. */
export function weeklyTrend(weights: WeightLog[], today: string): number | null {
  const pts = byDay(weights).filter(w => w.day > addDays(today, -28) && w.day <= today).map(w => [daysBetween(today, w.day), w.kg]);
  if (pts.length < 2 || pts.at(-1)![0] - pts[0][0] < 6) return null;
  const mx = pts.reduce((a, [x]) => a + x, 0) / pts.length, my = pts.reduce((a, [, y]) => a + y, 0) / pts.length;
  const slope = pts.reduce((a, [x, y]) => a + (x - mx) * (y - my), 0) / pts.reduce((a, [x]) => a + (x - mx) ** 2, 0);
  return slope * 7;
}

/** Último valor de cada parte medida e a diferença pro primeiro registro dela. */
export function latestMeasures(ms: Measure[]): Partial<Record<MeasurePart, { cm: number; delta: number; day: string }>> {
  const out: Partial<Record<MeasurePart, { cm: number; delta: number; day: string }>> = {};
  for (const m of byDay(ms)) {
    const first = out[m.part] ? out[m.part]!.cm - out[m.part]!.delta : m.cm;
    out[m.part] = { cm: m.cm, delta: Math.round((m.cm - first) * 10) / 10, day: m.day };
  }
  return out;
}

/* ---------- números da vida toda ---------- */

export function lifetimeTotals(sessions: Session[]) {
  const done = finished(sessions);
  const sets = done.flatMap(workSets);
  return {
    workouts: done.length,
    sets: sets.length,
    kg: Math.round(sets.reduce((v, x) => v + x.kg * x.reps, 0)),
    min: Math.round(done.reduce((m, s) => m + (s.endedAt! - s.startedAt), 0) / 60_000),
    km: Math.round(done.reduce((k, s) => k + (s.cardio?.km ?? 0), 0) * 10) / 10,
  };
}

/* ---------- desafios ---------- */

export interface ChallengeData { sessions: Session[]; water: WaterLog[]; waterGoalMl: number; library: Exercise[] }

/** Progresso medido dentro do prazo; bater a meta conclui de vez, mesmo olhando depois. */
export function challengeProgress(c: Challenge, d: ChallengeData, today: string) {
  const end = addDays(c.startDay, c.days - 1);
  const inside = (day: string) => day >= c.startDay && day <= end;
  const ss = finished(d.sessions).filter(s => inside(dayOf(s)));
  let value: number;
  if (c.kind === 'treinos') value = ss.length;
  else if (c.kind === 'series') value = ss.reduce((n, s) => n + workSets(s).length, 0);
  else if (c.kind === 'cardio') value = Math.round(ss.reduce((k, s) => k + (s.cardio?.km ?? 0), 0) * 10) / 10;
  else {
    const perDay = new Map<string, number>();
    for (const w of d.water) if (inside(w.day)) perDay.set(w.day, (perDay.get(w.day) ?? 0) + w.ml);
    value = [...perDay.values()].filter(ml => ml >= d.waterGoalMl).length;
  }
  return { value, done: value >= c.target, over: today > end, daysLeft: Math.max(0, daysBetween(today, end) + 1) };
}
