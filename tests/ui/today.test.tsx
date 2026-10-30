import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { startFresh, wipeAll } from '../../src/db/repo';
import { db } from '../../src/db/db';
import { coachLine } from '../../src/screens/today/Today';

beforeEach(() => { location.hash = '#/'; });

test('primeira abertura mostra demo e "Começar do zero" zera', async () => {
  await wipeAll();
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByText(/Dados de exemplo/, {}, { timeout: 4000 })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Começar do zero' }));
  await user.click(screen.getByRole('button', { name: 'Apagar tudo' }));
  expect(await screen.findByText('Bora montar sua primeira rotina?')).toBeInTheDocument();
  expect(screen.queryByText(/Dados de exemplo/)).toBeNull();
});

test('tocar no card de água soma 250 ml', async () => {
  await startFresh();
  const user = userEvent.setup();
  render(<App />);
  const card = await screen.findByRole('button', { name: /^Água/ }, { timeout: 4000 });
  expect(card).toHaveTextContent('0,0');
  await user.click(card);
  expect(await screen.findByText('0,25')).toBeInTheDocument();
  expect((await db.water.toArray()).map(w => w.ml)).toEqual([250]);
});

test('coachLine escolhe a fala pela situação', () => {
  const base = { hasRoutine: true, trainedToday: false, isTrainDay: true, mood: 'happy' as const, next: { name: 'A — Peito e tríceps', muscles: ['peito', 'tríceps'] } };
  expect(coachLine(base)).toBe('Hoje é treino A — peito, tríceps. Bora?');
  expect(coachLine({ ...base, trainedToday: true })).toBe('Treino feito! Agora é hidratar.');
  expect(coachLine({ ...base, isTrainDay: false })).toBe('Folga merecida. Bebe uma água aí.');
  expect(coachLine({ ...base, mood: 'sad' })).toBe('Saudade de você na academia…');
  expect(coachLine({ ...base, hasRoutine: false })).toBe('Bora montar sua primeira rotina?');
});
