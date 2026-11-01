import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { startFresh, startSession, upsertTemplate } from '../../src/db/repo';
import { db } from '../../src/db/db';
import { currentEntryIndex } from '../../src/screens/train/Session';
import { entry } from '../domain/helpers';

beforeEach(async () => {
  await startFresh();
  await upsertTemplate({ id: 'tA', name: 'A — Peito', order: 0, archived: false,
    items: [{ exerciseId: 'supino-reto-barra', sets: 2, repMin: 8, repMax: 12, restSec: 90 }] });
});

test('marcar série inicia descanso de 90s', async () => {
  await startSession('tA');
  const { user } = renderAt('/treino/sessao');
  const [check] = await screen.findAllByRole('button', { name: /Concluir série/ });
  await user.click(check);
  expect(await screen.findByRole('timer')).toHaveTextContent('1:30');
  await user.click(screen.getByRole('button', { name: '+15 s' }));
  expect(screen.getByRole('timer')).toHaveTextContent('1:45');
  await user.click(screen.getByRole('button', { name: 'Pular' }));
  expect(screen.queryByRole('timer')).toBeNull();
});

test('começar pela rotina abre a sessão e a aba mostra "em andamento"', async () => {
  const { user } = renderAt('/treino/sessao?start=tA');
  expect(await screen.findByText('Supino reto com barra')).toBeInTheDocument();
  expect(await db.sessions.count()).toBe(1);
  await user.click(screen.getByRole('link', { name: 'Treino' }));
  expect(await screen.findByText('Treino em andamento')).toBeInTheDocument();
});

test('finalizar mostra o resumo com volume e XP', async () => {
  await startSession('tA');
  const { user } = renderAt('/treino/sessao');
  await user.type(await screen.findByLabelText('Carga da série 1'), '60');
  await user.type(screen.getByLabelText('Reps da série 1'), '10');
  await user.click(screen.getAllByRole('button', { name: /Concluir série/ })[0]);
  await user.click(screen.getByRole('button', { name: 'Finalizar' }));
  expect(await screen.findByText('Treino concluído')).toBeInTheDocument();
  expect(screen.getByText('600 kg')).toBeInTheDocument();
  expect(screen.getByText(/\+120 XP/)).toBeInTheDocument();
});

test('exercício atual é o primeiro com série pendente', () => {
  expect(currentEntryIndex([entry([[60, 10]]), entry([[60, 10], [60, 0, false]])])).toBe(1);
  expect(currentEntryIndex([entry([[60, 10]]), entry([[60, 10]])])).toBe(1);
  expect(currentEntryIndex([])).toBe(0);
});

test('treino livre mostra a foto de corpo todo', async () => {
  const { container } = renderAt('/treino/sessao?start=livre');
  expect(await screen.findByRole('heading', { name: 'Treino livre' })).toBeInTheDocument();
  expect(container.querySelector('[data-photo="corpo"]')).not.toBeNull();
});

test('sessão mostra a foto do grupo do exercício atual', async () => {
  const { container } = renderAt('/treino/sessao?start=tA');
  expect(await screen.findByRole('heading', { name: 'A — Peito' })).toBeInTheDocument();
  expect(container.querySelector('[data-photo="peito"]')).not.toBeNull();
});
