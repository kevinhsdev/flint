import { act, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { TabBar } from '../../src/ui/TabBar';
import { SILHOUETTE } from '../../src/screens/progress/anatomy';

const bar = (path = '/agua') => render(<MemoryRouter initialEntries={[path]}><TabBar /></MemoryRouter>).container.querySelector('nav')!;

test('destaque desliza até a aba ativa', () => {
  const nav = bar('/agua');
  expect(nav.querySelector('.tab-pill')).not.toBeNull();
  expect(nav.style.getPropertyValue('--i')).toBe('2');
});

test('barra recua ao rolar pra baixo e volta ao rolar pra cima', () => {
  const nav = bar();
  act(() => { window.scrollY = 300; window.dispatchEvent(new Event('scroll')); });
  expect(nav.classList.contains('away')).toBe(true);
  act(() => { window.scrollY = 200; window.dispatchEvent(new Event('scroll')); });
  expect(nav.classList.contains('away')).toBe(false);
});

const span = (d: string) => {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number), ys = n.filter((_, i) => i % 2 === 1);
  return Math.max(...ys) - Math.min(...ys);
};

test('corpo do mapa tem proporção de atleta (~8 cabeças), não esticado', () => {
  const head = SILHOUETTE.slice(SILHOUETTE.lastIndexOf('M'));
  expect(span(SILHOUETTE) / span(head)).toBeLessThan(8.2); // antes ~9,5 cabeças
});
