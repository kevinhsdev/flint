import { dayIntensity, exerciseSeries, muscleVolume, sessionStats } from '../../src/domain/progress';
import { EXERCISES } from '../../src/domain/exercises';
import { sess } from './helpers';

const s1 = sess('a', 5, [['supino-reto-barra', [[60, 10], [60, 8], [70, 5, false]]]]);
const s2 = sess('b', 7, [['supino-reto-barra', [[65, 10]]], ['rosca-direta-barra', [[30, 10]]]]);

test('sessionStats: volume só de séries concluídas, duração e músculos', () => {
  expect(sessionStats(s1, EXERCISES)).toEqual({ durationMin: 60, volumeKg: 1080, muscles: ['peito'] });
});
test('exerciseSeries: um ponto por sessão', () => {
  const pts = exerciseSeries('supino-reto-barra', [s2, s1]);
  expect(pts.map(p => [p.day, p.maxKg, p.volume])).toEqual([['2026-10-05', 60, 1080], ['2026-10-07', 65, 650]]);
  expect(pts[1].e1rm).toBeCloseTo(86.67, 1);
});
test('muscleVolume: primário 1×, secundário 0,5×, no intervalo', () => {
  const v = muscleVolume([s1, s2], '2026-10-06', '2026-10-12', EXERCISES);
  expect(v.peito).toBe(650);
  expect(v.triceps).toBe(325);
  expect(v.biceps).toBe(300);
  expect(v.antebraco).toBe(150);
});
test('dayIntensity normaliza 0..1', () => {
  const d = dayIntensity([s1, s2], ['2026-10-05', '2026-10-06', '2026-10-07']);
  expect(d['2026-10-05']).toBeCloseTo(1080 / 1080);
  expect(d['2026-10-06']).toBe(0);
  expect(d['2026-10-07']).toBeCloseTo(950 / 1080);
});
