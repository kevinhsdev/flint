import { db } from './db';
import { EXERCISES } from '../domain/exercises';
import { localDay } from '../domain/dates';
import { DEFAULT_SETTINGS } from '../domain/settings';
import { makeSeed } from '../domain/seed';
import { lastEntryFor } from '../domain/routine';
import { suggestOverload } from '../domain/strength';
import { generatePlan } from '../domain/plan';
import type { Challenge, Entry, Exercise, Food, MeasurePart, SavedMeal, Profile, Session, Settings, Template } from '../domain/types';

export const uid = () => crypto.randomUUID();

export { DEFAULT_SETTINGS };

export async function getSettings(): Promise<Settings> {
  const row = await db.kv.get('settings');
  return { ...DEFAULT_SETTINGS, ...(row?.value as Partial<Settings> | undefined) };
}

export async function saveSettings(p: Partial<Settings>) {
  await db.kv.put({ key: 'settings', value: { ...(await getSettings()), ...p } });
}

/** Carga-alvo de um exercício (previsão de meta); null remove. */
export async function setTarget(exerciseId: string, kg: number | null) {
  const { [exerciseId]: _old, ...targets } = (await getSettings()).targets;
  await saveSettings({ targets: kg === null ? targets : { ...targets, [exerciseId]: kg } });
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

export const deleteWater = (id: string) => db.water.delete(id);

export async function undoLastWater(day: string) {
  const last = (await db.water.where('day').equals(day).sortBy('at')).at(-1);
  if (last) await db.water.delete(last.id);
}

/** Um registro de peso por dia: registrar de novo substitui. */
export async function logWeight(kg: number, day: string) {
  const same = await db.weights.where('day').equals(day).first();
  await db.weights.put({ id: same?.id ?? uid(), day, kg });
}

/** Medidas do dia (cm por parte); a mesma parte no mesmo dia substitui. */
export async function logMeasures(day: string, cm: Partial<Record<MeasurePart, number>>) {
  await db.transaction('rw', db.measures, async () => {
    const today = await db.measures.where('day').equals(day).toArray();
    await db.measures.bulkPut(Object.entries(cm).map(([part, v]) => ({ id: today.find(m => m.part === part)?.id ?? uid(), day, part: part as MeasurePart, cm: v! })));
  });
}

export const addChallenge = (c: Omit<Challenge, 'id' | 'startDay'>, startDay: string) => db.challenges.add({ ...c, id: uid(), startDay });
export const deleteChallenge = (id: string) => db.challenges.delete(id);

export const logFood = (f: Omit<Food, 'id' | 'at'>, at = new Date()) => db.foods.add({ ...f, id: uid(), at: at.getTime() });
export const deleteFood = (id: string) => db.foods.delete(id);

/** "Repetir de ontem": copia os alimentos de uma refeição pra outro dia. */
export async function copyMeal(from: string, to: string, meal: string) {
  const src = await db.foods.where('day').equals(from).filter(f => f.meal === meal).sortBy('at');
  const at = Date.now();
  await db.foods.bulkAdd(src.map((f, i) => ({ ...f, id: uid(), day: to, at: at + i })));
}

export const saveMeal = (name: string, foods: Food[]) =>
  db.savedMeals.add({ id: uid(), name, foods: foods.map(({ name, qty, kcal, p, c, f }) => ({ name, qty, kcal, p, c, f })) });
export const deleteSavedMeal = (id: string) => db.savedMeals.delete(id);
export async function addSavedMeal(s: SavedMeal, day: string, meal: string) {
  const at = Date.now();
  await db.foods.bulkAdd(s.foods.map((f, i) => ({ ...f, id: uid(), day, meal, at: at + i })));
}

export const addPhoto = (blob: Blob, day: string) => db.photos.add({ id: uid(), day, blob });
export const deletePhoto = (id: string) => db.photos.delete(id);

/**
 * Abertura: garante a biblioteca e diz se a pessoa ainda precisa da pesquisa inicial.
 * Quem já tem treinos, terminou a pesquisa ou está na demo vai direto pro app.
 */
export async function boot(): Promise<'survey' | 'ready'> {
  await ensureLibrary();
  const row = await db.kv.get('settings');
  if (!row) return 'survey';
  const s = await getSettings();
  if (s.onboarded || s.demo || (await db.sessions.count()) > 0) return 'ready';
  // backup antigo com rotina montada e sem histórico também já tem dados
  return (await db.templates.toArray()).some(t => !t.archived) ? 'ready' : 'survey';
}

/** "Só quero explorar": dados de exemplo da fase 1. */
export async function loadDemo() {
  await ensureLibrary();
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

/**
 * Fim da pesquisa: salva perfil e ajustes, registra o peso de hoje e (em 'generate') troca os treinos
 * ativos pelo plano gerado. Os antigos são arquivados, nunca apagados: o histórico continua apontando pra eles.
 */
export async function applySurvey(p: Profile, body: { kg: number; cm: number; trainTime: string }, mode: 'generate' | 'keep' | 'own') {
  if ((await getSettings()).demo) await startFresh(); // dados de exemplo não se misturam com os dela
  const lib = await db.exercises.toArray();
  await db.transaction('rw', [db.templates, db.weights, db.kv], async () => {
    if (mode === 'generate') {
      const active = (await db.templates.toArray()).filter(t => !t.archived);
      await Promise.all(active.map(t => db.templates.update(t.id, { archived: true })));
      // ids novos: refazer a pesquisa não pode sobrescrever o plan-A arquivado da vez anterior
      await db.templates.bulkAdd(generatePlan(p, lib).map(t => ({ ...t, id: uid() })));
    }
    await logWeight(body.kg, localDay(new Date()));
    await saveSettings({ profile: p, onboarded: true, trainDays: [...p.days].sort(), trainTime: body.trainTime, heightCm: body.cm, waterGoalMl: null, demo: false });
  });
}

export async function wipeAll() {
  await db.transaction('rw', db.tables, () => Promise.all(db.tables.map(t => t.clear())));
}

/* ---------- sessão em andamento ---------- */
const ACTIVE = 'activeSessionId';

/** Cria a sessão a partir do template (ou livre), com a carga sugerida já preenchida. */
export async function startSession(templateId: string | null): Promise<string> {
  const t = templateId ? await db.templates.get(templateId) : undefined;
  const history = await db.sessions.toArray();
  const entries: Entry[] = [];
  for (const item of t?.items ?? []) {
    const ex = await db.exercises.get(item.exerciseId);
    const last = lastEntryFor(item.exerciseId, history);
    const kg = (ex && suggestOverload(item, last, ex.equipment)?.kg) ?? 0;
    entries.push({ exerciseId: item.exerciseId, sets: Array.from({ length: item.sets }, () => ({ kg, reps: 0, done: false })), ...(item.group ? { group: item.group } : {}) });
  }
  const s: Session = { id: uid(), templateId: t?.id ?? null, name: t?.name ?? 'Treino livre', startedAt: Date.now(), endedAt: null, entries };
  await db.transaction('rw', db.sessions, db.kv, async () => {
    await db.sessions.add(s);
    await db.kv.put({ key: ACTIVE, value: s.id });
  });
  return s.id;
}

export const updateSession = (s: Session) => db.sessions.put(s);

export async function getActiveSession(): Promise<Session | undefined> {
  const id = (await db.kv.get(ACTIVE))?.value as string | undefined;
  return id ? db.sessions.get(id) : undefined;
}

export async function finishSession(id: string) {
  await db.transaction('rw', db.sessions, db.kv, async () => {
    await db.sessions.update(id, { endedAt: Date.now() });
    await db.kv.delete(ACTIVE);
  });
}

export async function discardSession(id: string) {
  await db.transaction('rw', db.sessions, db.kv, async () => {
    await db.sessions.delete(id);
    await db.kv.delete(ACTIVE);
  });
}

/** Apaga um treino do histórico; XP, recordes e medalhas se recalculam sozinhos. */
export const deleteSession = (id: string) => db.sessions.delete(id);
