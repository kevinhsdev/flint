import { epley, findPRs, plates, suggestOverload } from '../../src/domain/strength';
import { entry, sess } from './helpers';

test('epley', () => {
  expect(epley(100, 10)).toBeCloseTo(133.33, 1);
  expect(epley(100, 1)).toBe(100);
});

test('PR só com série concluída e nunca na primeira vez', () => {
  const s1 = sess('a', 1, [['supino', [[60, 10]]]]);
  const s2 = sess('b', 2, [['supino', [[62.5, 10], [80, 10, false]]]]);
  const prs = findPRs([s1, s2]);
  expect(prs.map(p => [p.sessionId, p.kind, p.kg])).toEqual([['b', 'repMax', 62.5], ['b', 'e1rm', 62.5]]);
});

test('PR ignora sessão em andamento', () => {
  const s1 = sess('a', 1, [['supino', [[60, 10]]]]);
  const s2 = { ...sess('b', 2, [['supino', [[70, 10]]]]), endedAt: null };
  expect(findPRs([s1, s2])).toEqual([]);
});

test('sobrecarga: bateu topo em todas → +2,5 na barra', () => {
  const item = { exerciseId: 'x', sets: 3, repMin: 8, repMax: 12, restSec: 90 };
  const up = suggestOverload(item, entry([[60, 12], [60, 12], [60, 12]]), 'barbell')!;
  expect(up.kg).toBe(62.5);
  expect(up.text).toBe('Bateu 12 reps em todas — tenta 2,5 kg a mais');
  const same = suggestOverload(item, entry([[60, 12], [60, 10], [60, 9]]), 'barbell')!;
  expect(same.kg).toBe(60);
  expect(same.text).toBe('Repete 60 kg e busca +1 rep');
  expect(suggestOverload(item, undefined, 'barbell')).toBeNull();
});

test('sobrecarga: halter sobe 2 kg', () => {
  const item = { exerciseId: 'x', sets: 2, repMin: 8, repMax: 12, restSec: 90 };
  expect(suggestOverload(item, entry([[20, 12], [20, 12]]), 'dumbbell')!.kg).toBe(22);
});

test('plates 100kg barra 20 → [25,15] por lado', () => {
  expect(plates(100)).toEqual({ perSide: [25, 15], remainder: 0 });
  expect(plates(21)).toEqual({ perSide: [], remainder: 1 });
});
