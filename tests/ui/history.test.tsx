import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { archiveExercise, loadDemo, getSettings, startFresh, wipeAll } from '../../src/db/repo';
import { computeXP } from '../../src/domain/gamification';

async function xpNow() {
  const [sessions, water, weights, library, settings] = await Promise.all([
    db.sessions.toArray(), db.water.toArray(), db.weights.toArray(), db.exercises.toArray(), getSettings(),
  ]);
  return computeXP({ sessions, water, weights, library, settings }, new Date()).xp;
}

test('excluir treino do histórico some da lista e reduz o XP derivado', async () => {
  await wipeAll(); await loadDemo();
  const before = await xpNow(), n = await db.sessions.count();
  const { user } = renderAt('/treino/historico');
  const [first] = await screen.findAllByRole('link', { name: /Abrir/ });
  const name = first.getAttribute('aria-label')!;
  const item = first.closest('li')!;
  await user.click(within(item).getByRole('button', { name: /Excluir/ }));
  expect(await db.sessions.count()).toBe(n);           // ainda não: pede confirmação
  await user.click(screen.getByRole('button', { name: 'Sim, excluir' }));
  await vi.waitFor(async () => expect(await db.sessions.count()).toBe(n - 1));
  expect(screen.queryByRole('link', { name })).toBeNull();
  expect(await xpNow()).toBeLessThan(before);
});

test('exercício arquivado aparece no histórico', async () => {
  await startFresh();
  await db.sessions.add({ id: 's1', templateId: null, name: 'Treino livre', startedAt: Date.now() - 3_600_000, endedAt: Date.now(),
    entries: [{ exerciseId: 'supino-reto-barra', sets: [{ kg: 60, reps: 10, done: true }] }] });
  await archiveExercise('supino-reto-barra');
  renderAt('/treino/historico');
  expect(await screen.findByText(/Supino reto com barra/)).toBeInTheDocument();
  expect(screen.getByText(/600 kg/)).toBeInTheDocument();
});

test('abrir item edita a sessão sem perder endedAt', async () => {
  await startFresh();
  await db.sessions.add({ id: 's1', templateId: null, name: 'Treino livre', startedAt: 1_000, endedAt: 2_000,
    entries: [{ exerciseId: 'supino-reto-barra', sets: [{ kg: 60, reps: 10, done: true }] }] });
  const { user } = renderAt('/treino/sessao?edit=s1');
  const kg = await screen.findByLabelText('Carga da série 1');
  await user.clear(kg); await user.type(kg, '62,5');
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  await vi.waitFor(async () => expect((await db.sessions.get('s1'))!.entries[0].sets[0].kg).toBe(62.5));
  expect((await db.sessions.get('s1'))!.endedAt).toBe(2_000);
  expect(await db.kv.get('activeSessionId')).toBeUndefined();
});
