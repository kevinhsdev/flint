import { db } from '../../src/db/db';
import { boot, getSettings, startFresh, wipeAll } from '../../src/db/repo';

beforeEach(() => wipeAll());

test('boot semeia uma vez; startFresh zera e tira demo', async () => {
  await boot();
  const n = await db.sessions.count();
  expect(n).toBeGreaterThan(0);
  expect((await getSettings()).demo).toBe(true);
  await boot();
  expect(await db.sessions.count()).toBe(n);
  await startFresh();
  expect(await db.sessions.count()).toBe(0);
  expect(await db.templates.count()).toBe(0);
  expect(await db.exercises.count()).toBeGreaterThan(0);
  expect((await getSettings()).demo).toBe(false);
});
