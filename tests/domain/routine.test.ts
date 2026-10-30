import { lastEntryFor, nextTemplate } from '../../src/domain/routine';
import { sess, tpl } from './helpers';

const T = ['A', 'B', 'C', 'D', 'E', 'F'].map((id, i) => tpl(id, i));

test('sem histórico → primeiro', () => {
  expect(nextTemplate(T, [])!.id).toBe('A');
});
test('gira A→…→F→A', () => {
  expect(nextTemplate(T, [sess('s1', 1, [], 'C')])!.id).toBe('D');
  expect(nextTemplate(T, [sess('s1', 1, [], 'E'), sess('s2', 2, [], 'F')])!.id).toBe('A');
});
test('pula arquivado e ignora treino livre', () => {
  const t = T.map(x => (x.id === 'C' ? { ...x, archived: true } : x));
  expect(nextTemplate(t, [sess('s1', 1, [], 'B'), sess('s2', 2, [], null)])!.id).toBe('D');
});
test('template da última sessão arquivado → segue a ordem dele', () => {
  const t = T.map(x => (x.id === 'B' ? { ...x, archived: true } : x));
  expect(nextTemplate(t, [sess('s1', 1, [], 'B')])!.id).toBe('C');
});
test('nenhum template ativo → null', () => {
  expect(nextTemplate([], [])).toBeNull();
});
test('lastEntryFor pega a sessão finalizada mais recente com o exercício', () => {
  const s = [sess('a', 1, [['x', [[50, 10]]]]), sess('b', 3, [['x', [[55, 10]]]]), sess('c', 2, [['y', [[1, 1]]]])];
  expect(lastEntryFor('x', s)!.sets[0].kg).toBe(55);
});
