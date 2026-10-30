import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { addCustomExercise, getActiveSession, logWater, startFresh, startSession, upsertTemplate } from '../../src/db/repo';
import { NumberField } from '../../src/ui/NumberField';
import { ErrorBoundary } from '../../src/ui/ErrorBoundary';

beforeEach(() => startFresh());

test('Hoje vira o dia quando o app volta do segundo plano depois da meia-noite', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 29, 23, 50));
  await logWater(500);
  renderAt('/');
  expect(await screen.findByRole('button', { name: /^Água: 0,5/ })).toBeInTheDocument();
  vi.setSystemTime(new Date(2026, 9, 30, 7, 0));
  act(() => { document.dispatchEvent(new Event('visibilitychange')); });
  expect(await screen.findByRole('button', { name: /^Água: 0,0/ })).toBeInTheDocument();
  vi.useRealTimers();
});

test('exercício próprio pode ser arquivado no picker', async () => {
  await addCustomExercise({ name: 'Supno torto', primary: 'peito', secondary: [], equipment: 'dumbbell' });
  const { user } = renderAt('/treino/editar/novo');
  await user.click(await screen.findByRole('button', { name: 'Adicionar exercícios' }));
  await user.type(screen.getByRole('searchbox'), 'supno');
  await user.click(await screen.findByRole('button', { name: 'Arquivar Supno torto' }));
  await vi.waitFor(() => expect(screen.queryByText('Supno torto')).toBeNull());
  expect((await db.exercises.toArray()).find(e => e.name === 'Supno torto')!.archived).toBe(true);
});

test('NumberField não agrupa milhar (2750 não vira 2,75)', () => {
  const onValue = vi.fn();
  render(<NumberField aria-label="ml" value={2750} onValue={onValue} />);
  expect(screen.getByLabelText('ml')).toHaveValue('2750');
  fireEvent.change(screen.getByLabelText('ml'), { target: { value: '3000' } });
  expect(onValue).toHaveBeenLastCalledWith(3000);
});

test('começar outro treino com um em andamento pergunta antes', async () => {
  await upsertTemplate({ id: 'tA', name: 'A', order: 0, archived: false, items: [{ exerciseId: 'supino-reto-barra', sets: 1, repMin: 8, repMax: 12, restSec: 60 }] });
  await upsertTemplate({ id: 'tB', name: 'B', order: 1, archived: false, items: [{ exerciseId: 'agachamento-livre', sets: 1, repMin: 8, repMax: 12, restSec: 60 }] });
  const first = await startSession('tA');
  const { user } = renderAt('/treino/sessao?start=tB');
  expect(await screen.findByText(/A ainda está em andamento/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Descartar e começar B' }));
  await vi.waitFor(async () => expect((await getActiveSession())?.templateId).toBe('tB'));
  expect(await db.sessions.get(first)).toBeUndefined();
  expect(await screen.findByRole('heading', { name: 'B' })).toBeInTheDocument(); // sessão nova carregada antes do fim do teste
});

test('erro de renderização mostra saída em vez de tela branca', () => {
  const Boom = () => { throw new Error('quebrou'); };
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<ErrorBoundary><Boom /></ErrorBoundary>);
  expect(screen.getByRole('button', { name: 'Recarregar' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Apagar dados e recomeçar' })).toBeInTheDocument();
});

test('importar backup pede confirmação antes de substituir os dados', async () => {
  const { exportBackup } = await import('../../src/domain/backup');
  const file = new File([await (await exportBackup(false)).text()], 'b.json', { type: 'application/json' });
  await logWater(500);
  const { user } = renderAt('/time/ajustes');
  await user.upload(await screen.findByLabelText('Importar', { selector: 'input' }), file);
  expect(await screen.findByText(/substitui os dados deste aparelho/)).toBeInTheDocument();
  expect(await db.water.count()).toBe(1);
  await user.click(screen.getByRole('button', { name: 'Substituir' }));
  expect(await screen.findByText('Backup restaurado.')).toBeInTheDocument();
  expect(await db.water.count()).toBe(0);
});
