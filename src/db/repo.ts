import { db } from './db';
import { EXERCISES } from '../domain/exercises';
import { localDay } from '../domain/dates';
import { RULES } from '../domain/rules';
import type { Exercise, Settings, Template } from '../domain/types';

export const uid = () => crypto.randomUUID();

export const DEFAULT_SETTINGS: Settings = {
  heightCm: null,
  waterGoalMl: null,
  trainDays: [...RULES.defaults.trainDays],
  trainTime: RULES.defaults.trainTime,
  demo: false,
  notif: { water: true, train: true, pedra: true, quietStart: RULES.notif.quietStart, quietEnd: RULES.notif.quietEnd },
};

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<Settings> | undefined) };
}

export async function saveSettings(p: Partial<Settings>) {
  await db.kv.put({ key: 'settings', value: { ...(await getSettings()), ...p } });
}

export async function ensureLibrary() {
  if ((await db.exercises.count()) === 0) await db.exercises.bulkAdd(EXERCISES);
}

export async function addCustomExercise(e: Omit<Exercise, 'id' | 'custom' | 'archived'>): Promise<string> {
  const id = `custom-${uid()}`;
  await db.exercises.add({ ...e, id, custom: true, archived: false });
  return id;
}

/** Exercícios nunca são apagados: o histórico continua apontando para eles. */
export const archiveExercise = (id: string) => db.exercises.update(id, { archived: true });

export const upsertTemplate = (t: Template) => db.templates.put(t);
export const archiveTemplate = (id: string) => db.templates.update(id, { archived: true });

export async function reorderTemplates(ids: string[]) {
  await db.transaction('rw', db.templates, () => Promise.all(ids.map((id, order) => db.templates.update(id, { order }))));
}

export async function duplicateTemplate(id: string): Promise<string> {
  const t = await db.templates.get(id);
  if (!t) throw new Error('treino não encontrado');
  const copy = { ...t, id: uid(), name: `${t.name} (cópia)`, order: await db.templates.count(), items: t.items.map(i => ({ ...i })) };
  await db.templates.add(copy);
  return copy.id;
}

export async function logWater(ml: number, at = new Date()) {
  await db.water.add({ id: uid(), day: localDay(at), at: at.getTime(), ml });
}

export async function undoLastWater(day: string) {
  const last = (await db.water.where('day').equals(day).sortBy('at')).at(-1);
  if (last) await db.water.delete(last.id);
}

/** Um registro de peso por dia: registrar de novo substitui. */
export async function logWeight(kg: number, day: string) {
  const same = await db.weights.where('day').equals(day).first();
  await db.weights.put({ id: same?.id ?? uid(), day, kg });
}

export const addPhoto = (blob: Blob, day: string) => db.photos.add({ id: uid(), day, blob });
export const deletePhoto = (id: string) => db.photos.delete(id);

export async function wipeAll() {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map(t => t.clear())));
}
