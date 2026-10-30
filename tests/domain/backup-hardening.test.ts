import { db } from '../../src/db/db';
import { addPhoto, loadDemo, getSettings, wipeAll } from '../../src/db/repo';
import { exportBackup, importBackup } from '../../src/domain/backup';

const file = (o: unknown) => new Blob([JSON.stringify(o)]);
async function backupJson() { return JSON.parse(await (await exportBackup(false)).text()); }

beforeEach(async () => { await wipeAll(); await loadDemo(); });

test('backup sem fotos não apaga as fotos do aparelho', async () => {
  const json = await backupJson();
  await addPhoto(new Blob([new Uint8Array([7])]), '2026-10-01');
  expect(await importBackup(file(json))).toEqual({ ok: true });
  expect(await db.photos.count()).toBe(1);
});

test('backup sem tabelas obrigatórias é recusado e nada muda', async () => {
  const n = await db.sessions.count();
  expect((await importBackup(file({ app: 'flint', version: 1, data: {} }))).ok).toBe(false);
  expect(await db.sessions.count()).toBe(n);
});

test('sessão sem séries ou ajustes quebrados são recusados', async () => {
  const json = await backupJson();
  const bad1 = structuredClone(json); bad1.data.sessions[0].entries[0] = { exerciseId: 'x' };
  expect((await importBackup(file(bad1))).ok).toBe(false);
  const bad2 = structuredClone(json);
  bad2.data.kv = bad2.data.kv.map((r: { key: string; value: Record<string, unknown> }) => (r.key === 'settings' ? { ...r, value: { ...r.value, trainDays: 'seg' } } : r));
  expect((await importBackup(file(bad2))).ok).toBe(false);
});

test('erro ao gravar vira mensagem, não exceção', async () => {
  const json = await backupJson();
  json.data.sessions.push(json.data.sessions[0]); // id duplicado
  const r = await importBackup(file(json));
  expect(r.ok).toBe(false);
  expect(await db.sessions.count()).toBeGreaterThan(0);
});

test('import garante biblioteca e ajustes', async () => {
  const json = await backupJson();
  json.data.exercises = []; json.data.kv = [];
  expect(await importBackup(file(json))).toEqual({ ok: true });
  expect(await db.exercises.count()).toBeGreaterThan(50);
  expect((await db.kv.get('settings'))).toBeTruthy();
  expect((await getSettings()).demo).toBe(false);
});
