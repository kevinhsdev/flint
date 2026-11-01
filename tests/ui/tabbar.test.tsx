import { act, render, screen } from '@testing-library/react';
import { renderAt } from './render';
import { startFresh } from '../../src/db/repo';
import { MemoryRouter } from 'react-router';
import { TabBar } from '../../src/ui/TabBar';
import { SILHOUETTE } from '../../src/screens/progress/anatomy';

beforeEach(() => startFresh());

test('barra tem 5 abas e marca a ativa', async () => {
  renderAt('/agua');
  const nav = await screen.findByRole('navigation', { name: 'Principal' });
  expect([...nav.querySelectorAll('a')].map(a => a.textContent)).toEqual(['Hoje', 'Treino', 'Água', 'Progresso', 'Time']);
  expect(screen.getByRole('link', { name: 'Água' })).toHaveAttribute('aria-current', 'page');
});

test('barra continua na sessão de treino (é a saída para outras abas)', async () => {
  renderAt('/treino/sessao?start=livre');
  // espera a sessão terminar de carregar: senão o carregamento assíncrono roda depois do fim do teste (no CI, mais lento)
  expect(await screen.findByRole('heading', { name: 'Treino livre' })).toBeInTheDocument();
  expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
});

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
