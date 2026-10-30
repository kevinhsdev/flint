import { RULES } from './rules';
import type { Entry, Equipment, Session, TemplateItem } from './types';

export const epley = (kg: number, reps: number): number => (reps === 1 ? kg : kg * (1 + reps / 30));

export interface PR {
  sessionId: string;
  exerciseId: string;
  kind: 'e1rm' | 'repMax';
  kg: number;
  reps: number;
  at: number;
}

const finished = (sessions: Session[]) =>
  sessions.filter(s => s.endedAt !== null).sort((a, b) => a.startedAt - b.startedAt);

/**
 * Percorre o histórico em ordem e marca recordes: no máximo um de cada tipo por exercício por sessão.
 * A primeira vez que um exercício (ou um nº de reps) aparece só estabelece a marca, não é PR.
 */
export function findPRs(sessions: Session[]): PR[] {
  const bestE1rm = new Map<string, number>();
  const bestAtReps = new Map<string, Map<number, number>>();
  const prs: PR[] = [];

  for (const s of finished(sessions)) {
    for (const e of s.entries) {
      const done = e.sets.filter(x => x.done && x.reps > 0);
      if (!done.length) continue;
      const byReps = bestAtReps.get(e.exerciseId) ?? new Map<number, number>();
      const seen = bestAtReps.has(e.exerciseId);

      let repPR: PR | null = null;
      for (const x of done) {
        const prev = byReps.get(x.reps);
        if (seen && prev !== undefined && x.kg > prev && (!repPR || x.kg > repPR.kg))
          repPR = { sessionId: s.id, exerciseId: e.exerciseId, kind: 'repMax', kg: x.kg, reps: x.reps, at: s.startedAt };
      }
      const top = done.reduce((a, b) => (epley(b.kg, b.reps) > epley(a.kg, a.reps) ? b : a));
      const prevE = bestE1rm.get(e.exerciseId);
      if (repPR) prs.push(repPR);
      if (prevE !== undefined && epley(top.kg, top.reps) > prevE)
        prs.push({ sessionId: s.id, exerciseId: e.exerciseId, kind: 'e1rm', kg: top.kg, reps: top.reps, at: s.startedAt });

      for (const x of done) byReps.set(x.reps, Math.max(byReps.get(x.reps) ?? 0, x.kg));
      bestAtReps.set(e.exerciseId, byReps);
      bestE1rm.set(e.exerciseId, Math.max(prevE ?? 0, epley(top.kg, top.reps)));
    }
  }
  return prs;
}

const kgText = (n: number) => String(n).replace('.', ',');

export function suggestOverload(item: TemplateItem, last: Entry | undefined, eq: Equipment): { kg: number; text: string } | null {
  const done = last?.sets.filter(s => s.done) ?? [];
  if (!done.length) return null;
  const kg = Math.max(...done.map(s => s.kg));
  const inc = RULES.overloadKg[eq];
  if (inc > 0 && done.every(s => s.reps >= item.repMax))
    return { kg: kg + inc, text: `Bateu ${item.repMax} reps em todas — tenta ${kgText(inc)} kg a mais` };
  return { kg, text: `Repete ${kgText(kg)} kg e busca +1 rep` };
}

/** Anilhas por lado, gulosamente da maior para a menor. */
export function plates(targetKg: number, barKg = 20, avail = [25, 20, 15, 10, 5, 2.5, 1.25]): { perSide: number[]; remainder: number } {
  let side = Math.max(0, (targetKg - barKg) / 2);
  const perSide: number[] = [];
  for (const p of avail) while (side >= p - 1e-9) { perSide.push(p); side -= p; }
  return { perSide, remainder: Math.round(side * 2 * 100) / 100 };
}
