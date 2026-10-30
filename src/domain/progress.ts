import { localDay } from './dates';
import { epley } from './strength';
import { MUSCLES, type Exercise, type Muscle, type Session } from './types';

const doneSets = (s: Session) => s.entries.flatMap(e => e.sets.filter(x => x.done).map(x => ({ ...x, exerciseId: e.exerciseId })));
const volumeOf = (s: Session) => doneSets(s).reduce((v, x) => v + x.kg * x.reps, 0);
const dayOf = (s: Session) => localDay(new Date(s.startedAt));

export function sessionStats(s: Session, lib: Exercise[]) {
  const muscles = new Set<Muscle>();
  for (const e of s.entries) {
    const ex = lib.find(x => x.id === e.exerciseId);
    if (ex && e.sets.some(x => x.done)) muscles.add(ex.primary);
  }
  return {
    durationMin: Math.round(((s.endedAt ?? Date.now()) - s.startedAt) / 60_000),
    volumeKg: volumeOf(s),
    muscles: [...muscles],
  };
}

export function exerciseSeries(exerciseId: string, sessions: Session[]) {
  return sessions
    .filter(s => s.endedAt !== null)
    .sort((a, b) => a.startedAt - b.startedAt)
    .flatMap(s => {
      const sets = doneSets(s).filter(x => x.exerciseId === exerciseId);
      if (!sets.length) return [];
      return [{
        day: dayOf(s),
        maxKg: Math.max(...sets.map(x => x.kg)),
        e1rm: Math.max(...sets.map(x => epley(x.kg, x.reps))),
        volume: sets.reduce((v, x) => v + x.kg * x.reps, 0),
      }];
    });
}

export function muscleVolume(sessions: Session[], fromDay: string, toDay: string, lib: Exercise[]): Record<Muscle, number> {
  const out = Object.fromEntries(MUSCLES.map(m => [m, 0])) as Record<Muscle, number>;
  for (const s of sessions) {
    const d = dayOf(s);
    if (s.endedAt === null || d < fromDay || d > toDay) continue;
    for (const x of doneSets(s)) {
      const ex = lib.find(e => e.id === x.exerciseId);
      if (!ex) continue;
      out[ex.primary] += x.kg * x.reps;
      for (const m of ex.secondary) out[m] += x.kg * x.reps * 0.5;
    }
  }
  return out;
}

export function dayIntensity(sessions: Session[], days: string[]): Record<string, number> {
  const vol: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]));
  for (const s of sessions) if (s.endedAt !== null && dayOf(s) in vol) vol[dayOf(s)] += volumeOf(s);
  const max = Math.max(0, ...Object.values(vol));
  return Object.fromEntries(Object.entries(vol).map(([d, v]) => [d, max ? v / max : 0]));
}
