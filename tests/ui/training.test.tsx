import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { startFresh, startSession, upsertTemplate } from '../../src/db/repo';
import { cardioSession, checkinSession } from '../../src/domain/training';

beforeEach(() => startFresh());

test('cardio: escolhe corrida, digita tempo e distância, vê o ritmo e registra', async () => {
  const { user } = renderAt('/treino');
  await user.click(await screen.findByRole('button', { name: 'Cardio' }));
  await user.click(screen.getByRole('button', { name: 'Corrida' }));
  await user.type(screen.getByLabelText('Duração (min)'), '30');
  await user.type(screen.getByLabelText('Distância (km)'), '5');
  expect(screen.getByText('6:00 /km')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Registrar cardio' }));
  await vi.waitFor(async () => expect(await db.sessions.count()).toBe(1));
  const [s] = await db.sessions.toArray();
  expect(s).toMatchObject({ kind: 'cardio', name: 'Corrida', cardio: { type: 'corrida', min: 30, km: 5 } });
  expect(s.endedAt).not.toBeNull();
  expect(await screen.findByRole('status')).toHaveTextContent('Corrida registrada');
});

test('cardio sem duração não registra', async () => {
  const { user } = renderAt('/treino');
  await user.click(await screen.findByRole('button', { name: 'Cardio' }));
  expect(screen.getByRole('button', { name: 'Registrar cardio' })).toBeDisabled();
});

test('check-in: marca o treino feito sem anotar séries', async () => {
  await upsertTemplate({ id: 'tA', name: 'A — Peito', order: 0, items: [], archived: false });
  const { user } = renderAt('/treino');
  await user.click(await screen.findByRole('button', { name: 'Check-in' }));
  const sheet = screen.getByRole('dialog');
  await user.click(within(sheet).getByRole('button', { name: 'A — Peito' }));
  await user.click(within(sheet).getByRole('button', { name: 'Fazer check-in' }));
  await vi.waitFor(async () => expect(await db.sessions.count()).toBe(1));
  const [s] = await db.sessions.toArray();
  expect(s).toMatchObject({ kind: 'checkin', name: 'A — Peito', templateId: 'tA', entries: [] });
  expect(s.endedAt! - s.startedAt).toBe(60 * 60_000); // duração padrão
});

test('histórico mostra cardio com ritmo e check-in, sem abrir editor de séries', async () => {
  await db.sessions.bulkAdd([cardioSession({ type: 'corrida', min: 30, km: 5 }), checkinSession('B — Costas', null, 45)]);
  renderAt('/treino/historico');
  expect(await screen.findByText('Corrida')).toBeInTheDocument();
  expect(screen.getByText('5 km')).toBeInTheDocument();
  expect(screen.getByText('6:00 /km')).toBeInTheDocument();
  expect(screen.getByText('Check-in')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Abrir/ })).toBeNull();
  expect(screen.getAllByRole('button', { name: /Excluir/ })).toHaveLength(2);
});

describe('treino em andamento', () => {
  const SS = { id: 'tS', name: 'S — Superset', order: 0, archived: false, items: [
    { exerciseId: 'supino-reto-barra', sets: 2, repMin: 8, repMax: 12, restSec: 90, group: 'g' },
    { exerciseId: 'remada-curvada-barra', sets: 2, repMin: 8, repMax: 12, restSec: 90, group: 'g' },
  ] };

  test('depois da série, pergunta o RIR e guarda na série', async () => {
    await upsertTemplate({ id: 'tA', name: 'A — Peito', order: 0, archived: false, items: [{ exerciseId: 'supino-reto-barra', sets: 2, repMin: 8, repMax: 12, restSec: 90 }] });
    await startSession('tA');
    const { user } = renderAt('/treino/sessao');
    await user.click((await screen.findAllByRole('button', { name: /Concluir série/ }))[0]);
    const ask = screen.getByRole('group', { name: 'Quantas reps sobraram na série 1?' });
    await user.click(within(ask).getByRole('button', { name: '2' }));
    expect(screen.queryByRole('group', { name: /sobraram/ })).toBeNull();
    expect(screen.getByText('RPE 8')).toBeInTheDocument();
    await vi.waitFor(async () => expect((await db.sessions.toArray())[0].entries[0].sets[0].rir).toBe(2));
  });

  test('superset da rotina: rodada no topo e descanso só depois do último exercício', async () => {
    await upsertTemplate(SS);
    await startSession('tS');
    const { user } = renderAt('/treino/sessao');
    expect(await screen.findByText('Superset · rodada 1 de 2')).toBeInTheDocument();
    const checks = screen.getAllByRole('button', { name: /Concluir série/ });
    await user.click(checks[0]);                       // supino 1: vai direto pra remada
    expect(screen.queryByRole('timer')).toBeNull();
    await user.click(checks[2]);                       // remada 1: fecha a rodada, descansa
    expect(await screen.findByRole('timer')).toBeInTheDocument();
    expect(screen.getByText('Superset · rodada 2 de 2')).toBeInTheDocument();
    expect((await db.sessions.toArray())[0].entries.map(e => e.group)).toEqual(['g', 'g']);
  });

  test('juntar em superset pelo menu do exercício e desfazer', async () => {
    await upsertTemplate({ ...SS, items: SS.items.map(({ group: _g, ...i }) => i) });
    await startSession('tS');
    const { user } = renderAt('/treino/sessao');
    await user.click(await screen.findByRole('button', { name: 'Opções de Supino reto com barra' }));
    await user.click(screen.getByRole('button', { name: 'Superset com o próximo' }));
    expect(await screen.findByText('Superset · rodada 1 de 2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Opções de Supino reto com barra' }));
    await user.click(screen.getByRole('button', { name: 'Desfazer superset' }));
    expect(screen.queryByText(/Superset ·/)).toBeNull();
  });

  test('no editor de treino, o elo junta dois exercícios em superset', async () => {
    await upsertTemplate({ ...SS, items: SS.items.map(({ group: _g, ...i }) => i) });
    const { user } = renderAt('/treino/editar/tS');
    await user.click(await screen.findByRole('button', { name: 'Superset: juntar Supino reto com barra com o próximo' }));
    await user.click(screen.getByRole('button', { name: 'Salvar' }));
    await vi.waitFor(async () => {
      const [a, b] = (await db.templates.get('tS'))!.items;
      expect(a.group).toBeTruthy();
      expect(b.group).toBe(a.group);
    });
  });
});
