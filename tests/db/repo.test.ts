import { db } from '../../src/db/db';
import { addCustomExercise, archiveExercise, ensureLibrary, getSettings, logWater, undoLastWater, wipeAll } from '../../src/db/repo';

beforeEach(() => wipeAll());

test('arquivar exercício mantém o registro', async () => {
  const id = await addCustomExercise({ name: 'Remada Kevin', primary: 'costas', secondary: [], equipment: 'cable' });
  await archiveExercise(id);
  expect((await db.exercises.get(id))!.archived).toBe(true);
});
test('logWater às 23:59 cai no dia local', async () => {
  await logWater(250, new Date(2026, 9, 30, 23, 59));
  expect((await db.water.where('day').equals('2026-10-30').toArray()).length).toBe(1);
});
test('undoLastWater remove só o último do dia', async () => {
  await logWater(250, new Date(2026, 9, 30, 10));
  await logWater(500, new Date(2026, 9, 30, 11));
  await undoLastWater('2026-10-30');
  expect((await db.water.toArray()).map(w => w.ml)).toEqual([250]);
});
test('settings tem defaults', async () => {
  expect((await getSettings()).trainDays).toEqual([1, 2, 3, 4, 5]);
});
test('ensureLibrary insere uma vez só', async () => {
  await ensureLibrary(); const n = await db.exercises.count(); await ensureLibrary();
  expect(await db.exercises.count()).toBe(n);
});
