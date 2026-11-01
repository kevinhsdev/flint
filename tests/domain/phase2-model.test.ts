import { db } from '../../src/db/db';
import { boot, getSettings, loadDemo, wipeAll } from '../../src/db/repo';
import { exportBackup, importBackup } from '../../src/domain/backup';

const file = (o: unknown) => new Blob([JSON.stringify(o)]);

test('boot sem dados pede a pesquisa e não carrega a demo', async () => {
  await wipeAll();
  expect(await boot()).toBe('survey');
  expect(await db.sessions.count()).toBe(0);
  expect(await db.exercises.count()).toBeGreaterThan(50);
});

test('loadDemo carrega o exemplo e boot passa a abrir o app', async () => {
  await wipeAll(); await loadDemo();
  expect(await db.sessions.count()).toBeGreaterThan(0);
  expect(await boot()).toBe('ready');
});

test('backup v1 sem campos novos importa e não reabre a pesquisa', async () => {
  await wipeAll(); await loadDemo();
  const json = JSON.parse(await (await exportBackup(false)).text());
  json.version = 1;
  json.data.kv = json.data.kv.map((r: { key: string; value: Record<string, unknown> }) => {
    if (r.key !== 'settings') return r;
    const { onboarded, profile, sound, targets, ...old } = r.value; void onboarded; void profile; void sound; void targets;
    return { ...r, value: { ...old, demo: false } };
  });
  await wipeAll();
  expect(await importBackup(file(json))).toEqual({ ok: true });
  expect(await boot()).toBe('ready');
  const s = await getSettings();
  expect(s.sound).toBe(true);
  expect(s.targets).toEqual({});
});

test('backup rejeita ajustes com profile inválido', async () => {
  await wipeAll(); await loadDemo();
  const json = JSON.parse(await (await exportBackup(false)).text());
  json.data.kv = json.data.kv.map((r: { key: string; value: Record<string, unknown> }) => (r.key === 'settings' ? { ...r, value: { ...r.value, profile: { goal: 'x' } } } : r));
  expect((await importBackup(file(json))).ok).toBe(false);
});

test('backup novo sai na versão 3', async () => {
  await wipeAll(); await loadDemo();
  expect(JSON.parse(await (await exportBackup(false)).text()).version).toBe(3);
});
