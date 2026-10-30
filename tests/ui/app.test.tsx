import { render, screen } from '@testing-library/react';
import App from '../../src/App';

test('mostra as 4 abas depois do carregamento', async () => {
  render(<App />);
  expect(screen.getByRole('status', { name: /Carregando/ })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Hoje' }, { timeout: 4000 })).toBeInTheDocument();
  for (const t of ['Treino', 'Progresso', 'Time'])
    expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
});
