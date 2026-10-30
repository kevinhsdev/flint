import { render, screen } from '@testing-library/react';
import App from '../../src/App';
import { startFresh } from '../../src/db/repo';

vi.setConfig({ testTimeout: 30_000 }); // o boot com dados de exemplo é lento com muitos arquivos em paralelo

test('mostra as 4 abas depois do carregamento', async () => {
  await startFresh();
  render(<App />);
  expect(screen.getByRole('status', { name: /Carregando/ })).toBeInTheDocument();
  expect(await screen.findByRole('link', { name: 'Hoje' }, { timeout: 15000 })).toBeInTheDocument();
  for (const t of ['Treino', 'Progresso', 'Time'])
    expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
});
