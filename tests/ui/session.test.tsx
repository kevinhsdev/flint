import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { startFresh, startSession, upsertTemplate } from '../../src/db/repo';
import { db } from '../../src/db/db';

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
