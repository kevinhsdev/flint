import { db } from '../../src/db/db';
import { addPhoto, loadDemo, getSettings, wipeAll } from '../../src/db/repo';
import { exportBackup, importBackup } from '../../src/domain/backup';

vi.setConfig({ testTimeout: 30_000 });

const counts = async () => Object.fromEntries(await Promise.all(db.tables.map(async t => [t.name, await t.count()])));

beforeEach(async () => { await wipeAll(); await loadDemo(); });

test('export → import restaura igual', async () => {
  await addPhoto(new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' }), '2026-10-01');
  const before = await counts(), settings = await getSettings();
  const file = await exportBackup(true);
  await wipeAll();
  expect(await importBackup(file)).toEqual({ ok: true });
  expect(await counts()).toEqual(before);
  expect(await getSettings()).toEqual(settings);
  const [p] = await db.photos.toArray();
  expect(new Uint8Array(await p.blob.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
});

test('sem fotos, o backup não leva fotos', async () => {
  await addPhoto(new Blob([new Uint8Array([9])]), '2026-10-01');
  const json = JSON.parse(await (await exportBackup(false)).text());
  expect(json.app).toBe('flint');
  expect(json.version).toBe(2);
  expect(json.data.photos).toEqual([]);
});

test('import inválido não apaga nada', async () => {
  const n = await db.sessions.count();
  expect((await importBackup(new Blob(['{"app":"outro"}']))).ok).toBe(false);
  expect((await importBackup(new Blob(['isso não é json']))).ok).toBe(false);
  expect((await importBackup(new Blob([JSON.stringify({ app: 'flint', version: 1, data: { sessions: 'x' } })]))).ok).toBe(false);
  expect(await db.sessions.count()).toBe(n);
});

test('import de versão futura é recusado', async () => {
  const r = await importBackup(new Blob([JSON.stringify({ app: 'flint', version: 3, data: {} })]));
  expect(r.ok).toBe(false);
  expect(!r.ok && r.error).toMatch(/versão mais nova/);
});
