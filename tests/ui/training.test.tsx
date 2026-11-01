import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { startFresh, upsertTemplate } from '../../src/db/repo';
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
