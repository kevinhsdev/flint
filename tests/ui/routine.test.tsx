import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { startFresh, upsertTemplate } from '../../src/db/repo';
import { db } from '../../src/db/db';

beforeEach(() => startFresh());

test('criar treino A com supino e começar', async () => {
  const { user } = renderAt('/treino');
  await user.click(await screen.findByRole('button', { name: 'Novo treino' }));
  await user.type(await screen.findByLabelText('Nome'), 'A — Peito');
  await user.click(screen.getByRole('button', { name: 'Adicionar exercícios' }));
  await user.type(screen.getByRole('searchbox'), 'supino reto');   // sem acento funciona
  await user.click(screen.getByText('Supino reto com barra'));
  await user.click(screen.getByRole('button', { name: 'Adicionar 1' }));
  await user.click(screen.getByRole('button', { name: 'Salvar' }));
  expect(await screen.findByText('A — Peito')).toBeInTheDocument();
  const [t] = await db.templates.toArray();
  expect(t.items).toEqual([{ exerciseId: 'supino-reto-barra', sets: 3, repMin: 8, repMax: 12, restSec: 90 }]);
});

test('sem treinos, a Faísca convida a montar a rotina', async () => {
  renderAt('/treino');
  expect(await screen.findByText('Bora montar sua primeira rotina?')).toBeInTheDocument();
});

test('busca ignora acentos e o picker esconde arquivados', async () => {
  await db.exercises.update('supino-reto-halter', { archived: true });
  const { user } = renderAt('/treino/editar/novo');
  await user.click(await screen.findByRole('button', { name: 'Adicionar exercícios' }));
  await user.type(screen.getByRole('searchbox'), 'triceps');
  expect(screen.getAllByText(/tríceps/i).length).toBeGreaterThan(0);
  await user.clear(screen.getByRole('searchbox'));
  await user.type(screen.getByRole('searchbox'), 'supino reto');
  expect(screen.queryByText('Supino reto com halteres')).toBeNull();
});

test('arquivar pede confirmação', async () => {
  await upsertTemplate({ id: 't1', name: 'B — Costas', order: 0, items: [], archived: false });
  const { user } = renderAt('/treino');
  await user.click(await screen.findByRole('button', { name: 'Opções de B — Costas' }));
  await user.click(screen.getByRole('button', { name: 'Arquivar' }));
  expect((await db.templates.get('t1'))!.archived).toBe(false);
  await user.click(screen.getByRole('button', { name: 'Sim, arquivar' }));
  await vi.waitFor(async () => expect((await db.templates.get('t1'))!.archived).toBe(true));
});
