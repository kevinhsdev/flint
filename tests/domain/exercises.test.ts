import { EXERCISES } from '../../src/domain/exercises';
import { EQUIPMENT, MUSCLES } from '../../src/domain/types';

test('biblioteca cobre todos os músculos e ids são únicos', () => {
  expect(new Set(EXERCISES.map(e => e.id)).size).toBe(EXERCISES.length);
  expect(EXERCISES.length).toBeGreaterThanOrEqual(80);
  expect(EXERCISES.length).toBeLessThanOrEqual(120);
  for (const m of MUSCLES) expect(EXERCISES.some(e => e.primary === m)).toBe(true);
  for (const q of EQUIPMENT) expect(EXERCISES.some(e => e.equipment === q)).toBe(true);
});
