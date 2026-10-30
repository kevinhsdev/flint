import type { Entry, Session, Template } from '../../src/domain/types';

type SetTuple = [kg: number, reps: number, done?: boolean];

/** Sessão finalizada no dia `day` (dias a partir de 2026-10-01). */
export const sess = (id: string, day: number, entries: [string, SetTuple[]][], templateId: string | null = null): Session => {
  const startedAt = new Date(2026, 9, day, 18).getTime();
  return {
    id, templateId, name: id, startedAt, endedAt: startedAt + 3_600_000,
    entries: entries.map(([exerciseId, sets]) => ({ exerciseId, sets: sets.map(([kg, reps, done = true]) => ({ kg, reps, done })) })),
  };
};

export const entry = (sets: SetTuple[], exerciseId = 'x'): Entry => ({
  exerciseId, sets: sets.map(([kg, reps, done = true]) => ({ kg, reps, done })),
});

export const tpl = (id: string, order: number, archived = false): Template => ({ id, name: id, order, items: [], archived });
