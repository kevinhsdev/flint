import type { Cardio, CardioType, Entry, Session } from './types';

/* ---------- supersets ---------- */

/**
 * Liga o item `i` ao próximo num superset; se já estão ligados, separa dali pra baixo.
 * Grupo de um item só deixa de ser grupo.
 */
export function toggleGroup<T extends { group?: string }>(items: T[], i: number, newId: () => string): T[] {
  if (i >= items.length - 1) return items;
  const out = items.map(x => ({ ...x }));
  const a = out[i], b = out[i + 1];
  if (a.group && a.group === b.group) {
    const tail = newId();
    for (let j = i + 1; j < out.length && out[j].group === a.group; j++) out[j].group = tail;
  } else {
    const g = a.group ?? b.group ?? newId(), old = b.group;
    a.group = g;
    for (let j = i + 1; j < out.length && (j === i + 1 || (old && out[j].group === old)); j++) out[j].group = g;
  }
  return out.map((x, j) => {
    const alone = !x.group || (out[j - 1]?.group !== x.group && out[j + 1]?.group !== x.group);
    if (!alone) return x;
    const { group: _g, ...rest } = x;
    return rest as T;
  });
}

const work = (e: Entry) => e.sets.filter(s => !s.warmup);

/** Rodada atual do superset de `i` (aquecimento não conta); null fora de superset. */
export function supersetRound(entries: Entry[], i: number): { round: number; of: number; first: number; last: number } | null {
  const g = entries[i]?.group;
  if (!g) return null;
  let first = i, last = i;
  while (entries[first - 1]?.group === g) first--;
  while (entries[last + 1]?.group === g) last++;
  const members = entries.slice(first, last + 1);
  const of = Math.max(...members.map(e => work(e).length));
  const done = Math.min(...members.map(e => work(e).filter(s => s.done).length));
  return { round: Math.min(of, done + 1), of, first, last };
}

/** No superset, descansa só depois do último exercício da rodada. */
export function restAfter(entries: Entry[], ei: number, restSec: number): number {
  const r = supersetRound(entries, ei);
  return r && ei !== r.last ? 0 : restSec;
}

export const rpe = (rir: number) => 10 - rir;

/* ---------- cardio e check-in ---------- */

export const CARDIO_NAMES: Record<CardioType, string> = { corrida: 'Corrida', caminhada: 'Caminhada', bike: 'Bike', outro: 'Cardio' };

/** Corrida e caminhada em min/km; bike em km/h; sem distância, sem ritmo. */
export function pace(c: Cardio): string | null {
  if (!c.km || c.km <= 0 || c.min <= 0) return null;
  if (c.type === 'bike') return `${(c.km / (c.min / 60)).toFixed(1).replace('.', ',')} km/h`;
  if (c.type === 'outro') return null;
  const sec = Math.round((c.min * 60) / c.km);
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')} /km`;
}

const quick = (name: string, templateId: string | null, min: number, now: Date): Session => ({
  id: crypto.randomUUID(), templateId, name, startedAt: now.getTime() - min * 60_000, endedAt: now.getTime(), entries: [],
});

export const cardioSession = (c: Cardio, now = new Date()): Session => ({ ...quick(CARDIO_NAMES[c.type], null, c.min, now), kind: 'cardio', cardio: c });

/** "Treinei hoje" sem anotar série: conta pra sequência, XP e medalha do dia. */
export const checkinSession = (name: string, templateId: string | null, min: number, now = new Date()): Session =>
  ({ ...quick(name, templateId, min, now), kind: 'checkin' });
