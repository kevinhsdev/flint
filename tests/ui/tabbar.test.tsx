import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { startFresh } from '../../src/db/repo';

beforeEach(() => startFresh());

test('barra tem 5 abas e marca a ativa', async () => {
  renderAt('/agua');
  const nav = await screen.findByRole('navigation', { name: 'Principal' });
  expect([...nav.querySelectorAll('a')].map(a => a.textContent)).toEqual(['Hoje', 'Treino', 'Água', 'Progresso', 'Time']);
  expect(screen.getByRole('link', { name: 'Água' })).toHaveAttribute('aria-current', 'page');
});

test('barra continua na sessão de treino (é a saída para outras abas)', async () => {
  renderAt('/treino/sessao?start=livre');
  expect(await screen.findByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
});
