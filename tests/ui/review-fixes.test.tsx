import { render, screen } from '@testing-library/react';
import { renderAt } from './render';
import { boot, saveSettings, startFresh, startSession, upsertTemplate } from '../../src/db/repo';
import { db } from '../../src/db/db';
import { Summary } from '../../src/screens/train/Summary';
import { EXERCISES } from '../../src/domain/exercises';
import { prCard } from '../../src/share/cards';

vi.mock('../../src/share/cards', () => ({
  prCard: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  wrappedCard: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
}));

beforeEach(() => startFresh());

test('backup antigo com treinos e sem histórico não reabre a pesquisa', async () => {
  await upsertTemplate({ id: 't', name: 'A', order: 0, archived: false, items: [] });
  await saveSettings({ onboarded: false });
  expect(await boot()).toBe('ready');
});

test('cartão do recorde já é gerado ao abrir o resumo (o toque chama o share direto)', async () => {
  const pr = { sessionId: 's', exerciseId: 'supino-reto-barra', kind: 'e1rm' as const, kg: 100, reps: 5, at: Date.now() };
  render(<Summary session={{ id: 's', templateId: null, name: 'A', startedAt: 0, endedAt: 1, entries: [] }} lib={EXERCISES} prs={[pr]} xp={0} stage="faisca" onDone={() => {}} />);
  await vi.waitFor(() => expect(prCard).toHaveBeenCalled());
});

test('Aquecer aparece no primeiro exercício composto, não no primeiro da lista', async () => {
  await upsertTemplate({ id: 'tA', name: 'A', order: 0, archived: false, items: [
    { exerciseId: 'elevacao-lateral', sets: 2, repMin: 8, repMax: 12, restSec: 60 },
    { exerciseId: 'supino-reto-barra', sets: 2, repMin: 8, repMax: 12, restSec: 90 },
  ] });
  const t = Date.now() - 3 * 864e5;
  await db.sessions.add({ id: 'h', templateId: 'tA', name: 'A', startedAt: t, endedAt: t + 3600e3, entries: [
    { exerciseId: 'elevacao-lateral', sets: [{ kg: 12, reps: 10, done: true }] },
    { exerciseId: 'supino-reto-barra', sets: [{ kg: 100, reps: 8, done: true }] },
  ] });
  await startSession('tA');
  const { user } = renderAt('/treino/sessao');
  await user.click(await screen.findByRole('button', { name: 'Aquecer' }));
  expect(await screen.findByLabelText('Carga do aquecimento 1')).toHaveValue('20'); // barra vazia: é o supino
});
