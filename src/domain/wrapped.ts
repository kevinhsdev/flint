import { waterDays, waterGoalMl } from './body';
import { addDays, localDay, weekday } from './dates';
import type { GameData } from './gamification';
import { muscleSets, sessionStats } from './progress';
import { findPRs, type PR } from './strength';
import type { Muscle } from './types';

export interface Wrapped {
  workouts: number; volumeKg: number; prs: PR[]; bestStreakDays: number; waterGoalDays: number; topMuscle: Muscle | null; minutes: number;
}

/** Dias do mês 'YYYY-MM', do 1º ao último. */
export function monthDays(month: string): string[] {
  const [y, m] = month.split('-').map(Number);
  const n = new Date(y, m, 0).getDate();
  return Array.from({ length: n }, (_, i) => addDays(`${month}-01`, i));
}

/** Retrospectiva do mês; null se não houve treino nele. */
export function monthWrapped(month: string, d: GameData): Wrapped | null {
  const inMonth = (t: number) => localDay(new Date(t)).startsWith(month);
  const sessions = d.sessions.filter(s => s.endedAt !== null && inMonth(s.startedAt));
  if (!sessions.length) return null;
  const days = monthDays(month);
  const stats = sessions.map(s => sessionStats(s, d.library));

  // sequência: treinos seguidos sem faltar num dia marcado (descanso não quebra)
  const trained = new Set(sessions.map(s => localDay(new Date(s.startedAt))));
  let run = 0, bestStreakDays = 0;
  for (const day of days) {
    if (trained.has(day)) bestStreakDays = Math.max(bestStreakDays, ++run);
    else if (d.settings.trainDays.includes(weekday(day))) run = 0;
  }

  const lastKg = [...d.weights].sort((a, b) => a.day.localeCompare(b.day)).at(-1)?.kg;
  const water = waterDays(d.water, waterGoalMl(d.settings, lastKg), days);
  const sets = Object.entries(muscleSets(sessions, days[0], days.at(-1)!, d.library)) as [Muscle, number][];
  const top = sets.reduce<[Muscle, number] | null>((a, x) => (x[1] > (a?.[1] ?? 0) ? x : a), null);

  return {
    workouts: sessions.length,
    volumeKg: stats.reduce((n, s) => n + s.volumeKg, 0),
    minutes: stats.reduce((n, s) => n + s.durationMin, 0),
    prs: findPRs(d.sessions).filter(p => inMonth(p.at)),
    bestStreakDays,
    waterGoalDays: Object.values(water).filter(f => f >= 1).length,
    topMuscle: top?.[0] ?? null,
  };
}

/** 'YYYY-MM' do mês de `d`, deslocado `delta` meses. */
export const monthOf = (d: Date, delta = 0) => localDay(new Date(d.getFullYear(), d.getMonth() + delta, 1)).slice(0, 7);
export const monthName = (month: string) => {
  const [y, m] = month.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
};
