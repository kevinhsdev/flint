import { render, screen } from '@testing-library/react';
import { FeatureCard } from '../../src/ui/FeatureCard';

test('com foto: marca a foto, título vira heading e mostra a ação', () => {
  const { container } = render(<FeatureCard photo="peito" eyebrow="Hoje" title="A — Peito" action={<button>Começar</button>} />);
  expect(container.firstElementChild).toHaveAttribute('data-photo', 'peito');
  expect(screen.getByRole('heading', { name: 'A — Peito' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Começar' })).toBeInTheDocument();
});

test('sem foto: cartão vermelho', () => {
  const { container } = render(<FeatureCard eyebrow="Rotina" title="Monte seus treinos" />);
  expect(container.firstElementChild).toHaveAttribute('data-photo', 'none');
});
