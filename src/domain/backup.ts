import { db } from '../db/db';
import { DEFAULT_SETTINGS, ensureLibrary } from '../db/repo';
import { CARDIO } from './types';

const VERSION = 2; // v2: pesquisa (profile/onboarded), som, metas de carga, séries de aquecimento
const TABLES = ['exercises', 'templates', 'sessions', 'water', 'weights', 'kv', 'photos'] as const;
type Table = (typeof TABLES)[number];

async function toDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

function dataUrlToBlob(url: string): Blob {
  const [head, b64] = url.split(',');
  const bin = atob(b64), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream' });
}

/** Arquivo JSON com tudo; fotos (base64) só se pedido, porque pesam. */
export async function exportBackup(includePhotos: boolean): Promise<Blob> {
  const data: Record<string, unknown[]> = {};
  for (const t of TABLES) if (t !== 'photos') data[t] = await db[t].toArray();
  data.photos = includePhotos
    ? await Promise.all((await db.photos.toArray()).map(async p => ({ id: p.id, day: p.day, data: await toDataUrl(p.blob) })))
    : [];
  return new Blob([JSON.stringify({ app: 'flint', version: VERSION, exportedAt: new Date().toISOString(), data })], { type: 'application/json' });
}

const isObj = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null && !Array.isArray(x);
const str = (x: unknown) => typeof x === 'string';
const num = (x: unknown) => typeof x === 'number' && Number.isFinite(x);
const numOrNull = (x: unknown) => x === null || num(x);
const setOk = (s: unknown) => isObj(s) && num(s.kg) && num(s.reps) && typeof s.done === 'boolean' && (!('warmup' in s) || typeof s.warmup === 'boolean')
  && (!('rir' in s) || (Number.isInteger(s.rir) && (s.rir as number) >= 0 && (s.rir as number) <= 5));
const oneOf = (x: unknown, xs: readonly unknown[]) => xs.includes(x);
const profileOk = (p: unknown) => p === null || (isObj(p) && oneOf(p.goal, ['massa', 'emagrecer', 'condicionamento', 'forca'])
  && oneOf(p.level, ['iniciante', 'intermediario', 'avancado']) && oneOf(p.place, ['completa', 'basica', 'casa'])
  && Array.isArray(p.days) && p.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) && oneOf(p.minutes, [30, 45, 60, 90]) && num(p.age));
const entryOk = (e: unknown) => isObj(e) && str(e.exerciseId) && Array.isArray(e.sets) && e.sets.every(setOk) && (!('group' in e) || str(e.group));
const cardioOk = (c: unknown) => isObj(c) && oneOf(c.type, CARDIO) && num(c.min) && numOrNull(c.km);
/** Campos ausentes viram padrão em getSettings; presentes precisam ter o tipo certo. */
const settingsOk = (v: unknown) => isObj(v)
  && (!('heightCm' in v) || numOrNull(v.heightCm)) && (!('waterGoalMl' in v) || numOrNull(v.waterGoalMl))
  && (!('trainDays' in v) || (Array.isArray(v.trainDays) && v.trainDays.every(num)))
  && (!('trainTime' in v) || str(v.trainTime)) && (!('demo' in v) || typeof v.demo === 'boolean')
  && (!('notif' in v) || isObj(v.notif)) && (!('onboarded' in v) || typeof v.onboarded === 'boolean')
  && (!('profile' in v) || profileOk(v.profile)) && (!('sound' in v) || typeof v.sound === 'boolean')
  && (!('targets' in v) || (isObj(v.targets) && Object.values(v.targets).every(num)));
const ROW: Record<Table, (r: Record<string, unknown>) => boolean> = {
  exercises: r => str(r.id) && str(r.name) && str(r.primary),
  templates: r => str(r.id) && str(r.name) && Array.isArray(r.items),
  sessions: r => str(r.id) && num(r.startedAt) && Array.isArray(r.entries) && r.entries.every(entryOk) && numOrNull(r.endedAt)
    && (!('kind' in r) || oneOf(r.kind, ['checkin', 'cardio'])) && (r.kind !== 'cardio' || cardioOk(r.cardio)),
  water: r => str(r.id) && str(r.day) && num(r.ml),
  weights: r => str(r.id) && str(r.day) && num(r.kg),
  kv: r => str(r.key) && (r.key !== 'settings' || settingsOk(r.value)),
  photos: r => str(r.id) && str(r.day) && str(r.data) && (r.data as string).startsWith('data:'),
};

/**
 * Valida tudo antes de tocar no banco; depois troca o conteúdo numa transação só (tudo ou nada).
 * Backup sem fotos mantém as fotos do aparelho (exportar sem fotos é o padrão).
 */
export async function importBackup(file: Blob): Promise<{ ok: true } | { ok: false; error: string }> {
  let json: unknown;
  try { json = JSON.parse(await file.text()); } catch { return { ok: false, error: 'O arquivo não é um backup válido.' }; }
  if (!isObj(json) || json.app !== 'flint') return { ok: false, error: 'Este arquivo não é um backup do Flint.' };
  if (!num(json.version) || (json.version as number) > VERSION) return { ok: false, error: 'Backup feito numa versão mais nova do app. Atualize o app e tente de novo.' };
  const data = json.data;
  if (!isObj(data)) return { ok: false, error: 'Backup incompleto.' };
  for (const t of TABLES) {
    const rows = t === 'photos' ? data[t] ?? [] : data[t];
    if (!Array.isArray(rows)) return { ok: false, error: 'Backup incompleto.' };
    if (!rows.every(r => isObj(r) && ROW[t](r))) return { ok: false, error: `Backup com dados inválidos (${t}).` };
  }
  const rows = (t: Table) => (data[t] ?? []) as Record<string, unknown>[];
  try {
    const photos = rows('photos').map(p => ({ id: p.id as string, day: p.day as string, blob: dataUrlToBlob(p.data as string) }));
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.filter(t => t.name !== 'photos' || photos.length).map(t => t.clear()));
      for (const t of TABLES) if (t !== 'photos') await db.table(t).bulkAdd(rows(t));
      await db.photos.bulkAdd(photos);
      await ensureLibrary();
      if (!(await db.kv.get('settings'))) await db.kv.put({ key: 'settings', value: { ...DEFAULT_SETTINGS, demo: false } });
    });
  } catch {
    return { ok: false, error: 'Não deu para restaurar este backup. Seus dados não foram alterados.' };
  }
  return { ok: true };
}
