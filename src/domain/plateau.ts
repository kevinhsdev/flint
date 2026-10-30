import { addDays, localDay } from './dates';
import { epley, isWork } from './strength';
import type { Session } from './types';

const WINDOW_DAYS = 21;
// a comparação é com as 3 semanas anteriores à janela, não com o melhor de sempre (quem volta de pausa está subindo)
const BEFORE_DAYS = 42;
const MIN_SESSIONS = 3;

/** Platô: 3+ sessões nas últimas 3 semanas e o melhor 1RM estimado delas não passa o das 3 semanas anteriores. Peso corporal (0 kg) fica de fora. */
export function plateau(exerciseId: string, sessions: Session[], today: Date): boolean {
  const from = addDays(localDay(today), -WINDOW_DAYS), since = addDays(localDay(today), -BEFORE_DAYS);
  const best = (xs: Session[]) => Math.max(0, ...xs.flatMap(s => s.entries.filter(e => e.exerciseId === exerciseId)
    .flatMap(e => e.sets.filter(isWork).map(x => epley(x.kg, x.reps)))));
  const withEx = sessions.filter(s => s.endedAt !== null && s.entries.some(e => e.exerciseId === exerciseId && e.sets.some(x => isWork(x) && x.kg > 0)));
  const inWindow = withEx.filter(s => localDay(new Date(s.startedAt)) > from);
  const before = withEx.filter(s => { const d = localDay(new Date(s.startedAt)); return d <= from && d > since; });
  return inWindow.length >= MIN_SESSIONS && before.length > 0 && best(inWindow) <= best(before);
}
