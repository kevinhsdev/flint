import { db } from '../../src/db/db';
import { getSettings, loadDemo, startFresh, wipeAll } from '../../src/db/repo';

beforeEach(() => wipeAll());

test('loadDemo semeia; startFresh zera e tira demo', async () => {
  await loadDemo();
  const n = await db.sessions.count();
  expect(n).toBeGreaterThan(0);
  expect((await getSettings()).demo).toBe(true);
  await startFresh();
  expect(await db.sessions.count()).toBe(0);
  expect(await db.templates.count()).toBe(0);
  expect(await db.exercises.count()).toBeGreaterThan(0);
  expect((await getSettings()).demo).toBe(false);
});
