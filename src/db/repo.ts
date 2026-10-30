import { db } from './db';
import { EXERCISES } from '../domain/exercises';
import { localDay } from '../domain/dates';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { makeSeed } from '../domain/seed';
import type { Exercise, Settings, Template } from '../domain/types';

export const uid = () => crypto.randomUUID();

export { DEFAULT_SETTINGS };

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

/** Primeira abertura: biblioteca + dados de exemplo. Nas próximas, não faz nada. */
export async function boot() {
  await ensureLibrary();
  if (await db.kv.get('settings')) return;
  const s = makeSeed(new Date());
  await db.transaction('rw', [db.templates, db.sessions, db.water, db.weights, db.kv], async () => {
    await db.templates.bulkAdd(s.templates);
    await db.sessions.bulkAdd(s.sessions);
    await db.water.bulkAdd(s.water);
    await db.weights.bulkAdd(s.weights);
    await db.kv.put({ key: 'settings', value: s.settings });
  });
}

/** "Começar do zero": apaga tudo e deixa o app vazio, fora do modo demo. */
export async function startFresh() {
  await wipeAll();
  await ensureLibrary();
  await db.kv.put({ key: 'settings', value: { ...DEFAULT_SETTINGS, demo: false } });
}

export async function wipeAll() {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map(t => t.clear())));
}
