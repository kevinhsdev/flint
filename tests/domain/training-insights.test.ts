import { warmupSets } from '../../src/domain/warmup';
import { plateau } from '../../src/domain/plateau';
import { forecastWeeks } from '../../src/domain/forecast';
import { findPRs } from '../../src/domain/strength';
import { exerciseSeries, sessionStats } from '../../src/domain/progress';
import { EXERCISES } from '../../src/domain/exercises';
import { sess } from './helpers';

const today = new Date(2026, 9, 30, 12);
const kgReps = (xs: { kg: number; reps: number }[]) => xs.map(s => [s.kg, s.reps]);

test('aquecimento de 100 kg na barra', () => expect(kgReps(warmupSets(100, 'barbell'))).toEqual([[20, 10], [50, 8], [75, 3]]));
test('aquecimento de 30 kg na barra não duplica a barra', () => expect(warmupSets(30, 'barbell').map(s => s.kg)).toEqual([20, 22.5]));
test('barra vazia não tem aquecimento', () => expect(warmupSets(20, 'barbell')).toEqual([]));
test('halter de 4 kg', () => expect(warmupSets(4, 'dumbbell').map(s => s.kg)).toEqual([2]));
test('máquina de 10 kg', () => expect(warmupSets(10, 'machine').map(s => s.kg)).toEqual([5, 7.5]));
test('peso corporal sem aquecimento', () => expect(warmupSets(0, 'bodyweight')).toEqual([]));
test('séries de aquecimento saem marcadas e não feitas', () => {
  for (const s of warmupSets(100, 'barbell')) expect(s).toMatchObject({ warmup: true, done: false });
});

test('aquecimento não vira recorde nem volume', () => {
  const a = sess('a', 1, [['supino-reto-barra', [[80, 8]]]]);
  const b = sess('b', 8, [['supino-reto-barra', [[80, 8]]]]);
  b.entries[0].sets.unshift({ kg: 200, reps: 1, done: true, warmup: true });
  expect(findPRs([a, b])).toEqual([]);
  expect(sessionStats(b, EXERCISES).volumeKg).toBe(640);
  expect(exerciseSeries('supino-reto-barra', [a, b]).at(-1)!.maxKg).toBe(80);
});

const at = (day: number, kg: number) => sess(`s${day}`, day, [['supino-reto-barra', [[kg, 5]]]]);
test('platô: 3 sessões em 3 semanas sem passar a marca anterior', () => {
  expect(plateau('supino-reto-barra', [at(1, 100), at(12, 100), at(19, 97.5), at(26, 100)], today)).toBe(true);
});
test('sem platô quando a última sessão sobe', () => {
  expect(plateau('supino-reto-barra', [at(1, 100), at(12, 100), at(19, 100), at(26, 105)], today)).toBe(false);
});
test('sem platô com menos de 3 sessões na janela ou sem histórico antes', () => {
  expect(plateau('supino-reto-barra', [at(1, 100), at(19, 100), at(26, 100)], today)).toBe(false);
  expect(plateau('supino-reto-barra', [at(12, 100), at(19, 100), at(26, 100)], today)).toBe(false);
});

const pts = (xs: [string, number][]) => xs.map(([day, maxKg]) => ({ day, maxKg }));
test('previsão sobe 2,5 kg/semana: 80 → 90 em 4 semanas', () => {
  expect(forecastWeeks(pts([['2026-10-09', 72.5], ['2026-10-16', 75], ['2026-10-23', 77.5], ['2026-10-30', 80]]), 90, today)).toEqual({ weeks: 4 });
});
test('previsão: poucos pontos, plana ou caindo → null; alvo batido → reached', () => {
  expect(forecastWeeks(pts([['2026-10-30', 80]]), 90, today)).toBeNull();
  expect(forecastWeeks(pts([['2026-10-16', 80], ['2026-10-23', 80], ['2026-10-30', 80]]), 90, today)).toBeNull();
  expect(forecastWeeks(pts([['2026-10-16', 85], ['2026-10-23', 82.5], ['2026-10-30', 80]]), 90, today)).toBeNull();
  expect(forecastWeeks(pts([['2026-10-16', 85], ['2026-10-23', 88], ['2026-10-30', 92]]), 90, today)).toEqual({ reached: true });
});
test('previsão ignora pontos com mais de 56 dias', () => {
  expect(forecastWeeks(pts([['2026-08-01', 40], ['2026-10-23', 80], ['2026-10-30', 80]]), 90, today)).toBeNull();
});
test('previsão acima de 2 anos vira null', () => {
  expect(forecastWeeks(pts([['2026-10-16', 80], ['2026-10-23', 80.1], ['2026-10-30', 80.2]]), 200, today)).toBeNull();
});
