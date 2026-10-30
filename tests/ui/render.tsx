import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { Shell } from '../../src/App';

/** Renderiza o app numa rota (o db é limpo pelo teste com startFresh). */
export function renderAt(route: string) {
  const user = userEvent.setup();
  return { user, ...render(<MemoryRouter initialEntries={[route]}><Shell /></MemoryRouter>) };
}
