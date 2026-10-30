import { addDays, localDay, weekday, weekStart } from '../../src/domain/dates';

test('localDay usa fuso local, não UTC', () => {
  expect(localDay(new Date(2026, 9, 30, 23, 59))).toBe('2026-10-30');
  expect(localDay(new Date(2026, 9, 31, 0, 1))).toBe('2026-10-31');
});
test('weekStart é segunda', () => {
  expect(weekStart('2026-11-01')).toBe('2026-10-26');
  expect(weekStart('2026-10-26')).toBe('2026-10-26');
});
test('addDays atravessa mês', () => { expect(addDays('2026-10-31', 1)).toBe('2026-11-01'); });
test('weekday: 0 = domingo', () => { expect(weekday('2026-11-01')).toBe(0); });
