import type { Entry, Session, Template } from './types';

const byNewest = (sessions: Session[]) =>
  sessions.filter(s => s.endedAt !== null).sort((a, b) => b.startedAt - a.startedAt);

/** Próximo treino da rotação: o seguinte (por ordem, circular) ao último treino feito com template. */
export function nextTemplate(templates: Template[], sessions: Session[]): Template | null {
  const all = [...templates].sort((a, b) => a.order - b.order);
  const active = all.filter(t => !t.archived);
  if (!active.length) return null;
  const last = byNewest(sessions).find(s => s.templateId && all.some(t => t.id === s.templateId));
  if (!last) return active[0];
  const lastOrder = all.find(t => t.id === last.templateId)!.order;
  return active.find(t => t.order > lastOrder) ?? active[0];
}

export function lastEntryFor(exerciseId: string, sessions: Session[]): Entry | undefined {
  for (const s of byNewest(sessions)) {
    const e = s.entries.find(x => x.exerciseId === exerciseId && x.sets.some(set => set.done));
    if (e) return e;
  }
  return undefined;
}
