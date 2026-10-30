import { makeSeed } from '../../src/domain/seed';
import { computeXP, mood } from '../../src/domain/gamification';
import { findPRs } from '../../src/domain/strength';
import { EXERCISES } from '../../src/domain/exercises';

const today = new Date(2026, 9, 30, 15);
const s = makeSeed(today);

test('seed: Faísca em Chama e PRs existem', () => {
  expect(computeXP({ ...s, library: EXERCISES }, today).stage).toBe('chama');
  expect(findPRs(s.sessions).length).toBeGreaterThan(5);
});
test('seed: determinístico', () => {
  expect(makeSeed(today)).toEqual(s);
});
test('seed: nada no futuro, rotina A–F, demo ligado, sem fotos, Faísca feliz', () => {
  expect(Math.max(...s.sessions.map(x => x.endedAt!))).toBeLessThanOrEqual(today.getTime());
  expect(Math.max(...s.water.map(x => x.at))).toBeLessThanOrEqual(today.getTime());
  expect(s.templates.map(t => t.name[0])).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  expect(s.settings.demo).toBe(true);
  expect(s.settings.trainDays).toEqual([1, 2, 3, 4, 5, 6]);
  expect('photos' in s).toBe(false);
  expect(mood(s.sessions, s.settings.trainDays, today)).toBe('happy');
});
test('seed: exercícios existem na biblioteca', () => {
  const ids = new Set(EXERCISES.map(e => e.id));
  for (const t of s.templates) for (const i of t.items) expect(ids.has(i.exerciseId)).toBe(true);
});
