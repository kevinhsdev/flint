import { db } from '../db/db';

const VERSION = 1;
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
const ROW: Record<Table, (r: Record<string, unknown>) => boolean> = {
  exercises: r => str(r.id) && str(r.name) && str(r.primary),
  templates: r => str(r.id) && str(r.name) && Array.isArray(r.items),
  sessions: r => str(r.id) && num(r.startedAt) && Array.isArray(r.entries) && (r.endedAt === null || num(r.endedAt)),
  water: r => str(r.id) && str(r.day) && num(r.ml),
  weights: r => str(r.id) && str(r.day) && num(r.kg),
  kv: r => str(r.key),
  photos: r => str(r.id) && str(r.day) && str(r.data) && (r.data as string).startsWith('data:'),
};

/** Valida tudo antes de tocar no banco; depois troca o conteúdo numa transação só (tudo ou nada). */
export async function importBackup(file: Blob): Promise<{ ok: true } | { ok: false; error: string }> {
  let json: unknown;
  try { json = JSON.parse(await file.text()); } catch { return { ok: false, error: 'O arquivo não é um backup válido.' }; }
  if (!isObj(json) || json.app !== 'flint') return { ok: false, error: 'Este arquivo não é um backup do Flint.' };
  if (!num(json.version) || (json.version as number) > VERSION) return { ok: false, error: 'Backup feito numa versão mais nova do app. Atualize o app e tente de novo.' };
  const data = json.data;
  if (!isObj(data)) return { ok: false, error: 'Backup incompleto.' };
  for (const t of TABLES) {
    const rows = data[t] ?? [];
    if (!Array.isArray(rows) || !rows.every(r => isObj(r) && ROW[t](r))) return { ok: false, error: `Backup com dados inválidos (${t}).` };
  }
  const rows = (t: Table) => (data[t] ?? []) as Record<string, unknown>[];
  const photos = rows('photos').map(p => ({ id: p.id as string, day: p.day as string, blob: dataUrlToBlob(p.data as string) }));
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map(t => t.clear()));
    for (const t of TABLES) if (t !== 'photos') await db.table(t).bulkAdd(rows(t));
    await db.photos.bulkAdd(photos);
  });
  return { ok: true };
}
