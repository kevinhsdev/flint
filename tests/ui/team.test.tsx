import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { boot, getSettings, startFresh, wipeAll } from '../../src/db/repo';

vi.setConfig({ testTimeout: 30_000 });

test('Time mostra o estágio real e a trilha de evolução', async () => {
  await wipeAll(); await boot();
  renderAt('/time');
  expect(await screen.findByRole('heading', { name: 'Chama' })).toBeInTheDocument();
  expect(screen.getByText(/XP/, { selector: '.xp-num' })).toBeInTheDocument();
  expect(screen.getByRole('listitem', { name: /Forja.*bloqueado/ })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Ajustes' })).toBeInTheDocument();
});

test('ajustes salvam altura e dias de treino', async () => {
  await startFresh();
  const { user } = renderAt('/time/ajustes');
  await user.type(await screen.findByLabelText('Altura (cm)'), '178');
  await user.click(screen.getByRole('button', { name: 'Dom' }));
  await vi.waitFor(async () => {
    const s = await getSettings();
    expect(s.heightCm).toBe(178);
    expect(s.trainDays).toContain(0);
  });
  expect(screen.getByText('Em breve')).toBeInTheDocument();
});
