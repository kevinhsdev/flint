import { shoppingList } from '../../src/domain/shopping';
import type { SavedMeal } from '../../src/domain/types';

const m = (name: string, foods: [string, string][]): SavedMeal =>
  ({ id: name, name, foods: foods.map(([name, qty]) => ({ name, qty, kcal: 100, p: 1, c: 1, f: 1 })) });

test('soma o mesmo alimento entre refeições, multiplicado pelas vezes na semana', () => {
  const marmita = m('Marmita', [['Arroz', '150 g'], ['Frango', '120 g']]);
  const jantar = m('Jantar', [['arroz ', '100 g'], ['Ovo', '2 un']]);
  expect(shoppingList([{ meal: marmita, times: 5 }, { meal: jantar, times: 2 }])).toEqual([
    { name: 'Arroz', qty: '950 g' },
    { name: 'Frango', qty: '600 g' },
    { name: 'Ovo', qty: '4 un' },
  ]);
});

test('quantidade em texto livre vira "N×"; unidades diferentes ficam lado a lado; 0 vezes fica de fora', () => {
  const a = m('A', [['Feijão', '1 concha'], ['Banana', ''], ['Leite', '200 ml']]);
  const b = m('B', [['Leite', '1 un'], ['Pão', '1,5 un']]);
  const c = m('C', [['Whey', '30 g']]);
  expect(shoppingList([{ meal: a, times: 2 }, { meal: b, times: 1 }, { meal: c, times: 0 }])).toEqual([
    { name: 'Banana', qty: '2×' },
    { name: 'Feijão', qty: '2× 1 concha' },
    { name: 'Leite', qty: '400 ml + 1 un' },
    { name: 'Pão', qty: '1,5 un' },
  ]);
});
