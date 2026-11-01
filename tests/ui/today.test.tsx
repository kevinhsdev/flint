import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../src/App';
import { loadDemo, saveSettings, startFresh, wipeAll } from '../../src/db/repo';
import { db } from '../../src/db/db';
import { coachLine } from '../../src/screens/today/Today';

vi.setConfig({ testTimeout: 30_000 }); // o boot com dados de exemplo é lento com muitos arquivos em paralelo

beforeEach(() => { location.hash = '#/'; });

test('demo mostra o aviso e "Montar meu plano" abre a pesquisa', async () => {
  await wipeAll(); await loadDemo();
  const user = userEvent.setup();
  render(<App />);
  expect(await screen.findByText(/Dados de exemplo/, {}, { timeout: 15000 })).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Montar meu plano' }));
  expect(await screen.findByText(/Qual é o seu objetivo/)).toBeInTheDocument();
});

test('tocar no card de água soma 250 ml', async () => {
  await startFresh(); await saveSettings({ onboarded: true });
  const user = userEvent.setup();
  render(<App />);
  const card = await screen.findByRole('button', { name: /^Água/ }, { timeout: 15000 });
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

test('próximo treino aparece no cartão com foto', async () => {
  await wipeAll(); await loadDemo();
  const { container } = render(<App />);
  expect(await screen.findByRole('button', { name: 'Começar' }, { timeout: 15000 })).toBeInTheDocument();
  expect(container.querySelector('[data-photo]')?.getAttribute('data-photo')).toMatch(/^(peito|costas|pernas|ombros|bracos|abdomen|geral)$/);
});

test('sem rotina o cartão é vermelho e chama pra montar', async () => {
  await startFresh(); await saveSettings({ onboarded: true });
  const { container } = render(<App />);
  expect(await screen.findByRole('button', { name: 'Montar rotina' }, { timeout: 15000 })).toBeInTheDocument();
  expect(container.querySelector('[data-photo]')?.getAttribute('data-photo')).toBe('none');
});
