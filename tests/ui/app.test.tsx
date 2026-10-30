import { render, screen } from '@testing-library/react';
import App from '../../src/App';

test('mostra as 4 abas', () => {
  render(<App />);
  for (const t of ['Hoje', 'Treino', 'Progresso', 'Time'])
    expect(screen.getByRole('link', { name: t })).toBeInTheDocument();
});
