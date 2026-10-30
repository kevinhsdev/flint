import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { getSettings, startFresh, startSession, upsertTemplate } from '../../src/db/repo';
import { db } from '../../src/db/db';

const DAY = 864e5;
const done = (id: string, daysAgo: number, kg: number, reps = 8) => db.sessions.add({
  id, templateId: 'tA', name: 'A — Peito', startedAt: Date.now() - daysAgo * DAY, endedAt: Date.now() - daysAgo * DAY + 3600e3,
  entries: [{ exerciseId: 'supino-reto-barra', sets: [{ kg, reps, done: true }, { kg, reps, done: true }] }],
});

beforeEach(async () => {
  await startFresh();
  await upsertTemplate({ id: 'tA', name: 'A — Peito', order: 0, archived: false,
    items: [{ exerciseId: 'supino-reto-barra', sets: 2, repMin: 8, repMax: 12, restSec: 90 }] });
});

test('Aquecer insere 3 séries de aquecimento no supino 100 kg', async () => {
  await done('h1', 3, 100);
  await startSession('tA');
  const { user } = renderAt('/treino/sessao');
  await user.click(await screen.findByRole('button', { name: 'Aquecer' }));
  expect(await screen.findAllByText('Aq')).toHaveLength(3);
  expect(screen.getByLabelText('Carga do aquecimento 1')).toHaveValue('20');
  expect(screen.queryByRole('button', { name: 'Aquecer' })).toBeNull();
});

test('marcar aquecimento não abre descanso nem conta série', async () => {
  await done('h1', 3, 100);
  await startSession('tA');
  const { user } = renderAt('/treino/sessao');
  await user.click(await screen.findByRole('button', { name: 'Aquecer' }));
  await user.click(await screen.findByRole('button', { name: 'Concluir aquecimento 1' }));
  expect(screen.queryByRole('timer')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Finalizar' }));
  expect(await screen.findByText('Nenhuma série concluída')).toBeInTheDocument();
});

test('selo de platô aparece com histórico estagnado', async () => {
  await done('old', 30, 100);
  for (const [i, d] of [15, 8, 2].entries()) await done(`p${i}`, d, 100);
  const progress = renderAt('/progresso');
  expect(await screen.findByText('Platô')).toBeInTheDocument();
  progress.unmount();
  await startSession('tA');
  const { user } = renderAt('/treino/sessao');
  await user.click(await screen.findByRole('button', { name: /Platô/ }));
  expect(await screen.findByRole('button', { name: /Deload/ })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Trocar por variação' })).toBeInTheDocument();
});

test('meta de carga mostra previsão em semanas', async () => {
  await done('a', 28, 60); await done('b', 14, 65); await done('c', 0, 70);
  const { user } = renderAt('/progresso/exercicio/supino-reto-barra');
  await user.type(await screen.findByLabelText('Meta de carga (kg)'), '80');
  expect(await screen.findByText(/No ritmo atual, ~\d+ semanas/)).toBeInTheDocument();
  await vi.waitFor(async () => expect((await getSettings()).targets['supino-reto-barra']).toBe(80));
});
