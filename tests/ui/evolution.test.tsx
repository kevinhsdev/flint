import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { addChallenge, getSettings, logMeasures, logWeight, saveSettings, startFresh } from '../../src/db/repo';
import { addDays, localDay } from '../../src/domain/dates';
import { cardioSession, checkinSession } from '../../src/domain/training';

const today = localDay(new Date());
const noon = new Date(`${today}T12:00`); // longe da meia-noite: o treino cai em hoje
beforeEach(() => startFresh());

test('meta de peso: define no cartão e mostra início, agora, meta e o que falta', async () => {
  await logWeight(90, addDays(today, -20));
  await logWeight(86, today);
  const { user } = renderAt('/progresso');
  await user.click(await screen.findByRole('button', { name: 'Meta' }));
  await user.type(screen.getByLabelText('Meta de peso (kg)'), '80');
  await user.click(screen.getByRole('button', { name: 'Salvar meta' }));
  await vi.waitFor(async () => expect((await getSettings()).weightGoalKg).toBe(80));
  const goal = await screen.findByRole('group', { name: 'Meta de peso' });
  expect(within(goal).getByText('90')).toBeInTheDocument();
  expect(within(goal).getByText('86')).toBeInTheDocument();
  expect(within(goal).getByText('80')).toBeInTheDocument();
  expect(within(goal).getByText(/faltam 6 kg/)).toBeInTheDocument();
  expect(within(goal).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
});

test('medidas: registra e mostra a diferença pra primeira', async () => {
  await logMeasures(addDays(today, -30), { cintura: 90 });
  const { user } = renderAt('/progresso');
  const card = (await screen.findByRole('heading', { name: 'Medidas' })).closest('section')!;
  await user.click(within(card).getByRole('button', { name: 'Registrar medidas' }));
  const cintura = screen.getByLabelText('Cintura (cm)');
  await user.clear(cintura);
  await user.type(cintura, '87,5');
  await user.type(screen.getByLabelText('Braço (cm)'), '38');
  await user.click(screen.getByRole('button', { name: 'Salvar medidas' }));
  expect(await within(card).findByText('87,5 cm')).toBeInTheDocument();
  expect(within(card).getByText('−2,5')).toBeInTheDocument();
  expect(within(card).getByText('38 cm')).toBeInTheDocument();
});

test('seus números: totais da vida toda e a grade do ano', async () => {
  await db.sessions.add(cardioSession({ type: 'corrida', min: 30, km: 5 }, noon));
  const { user } = renderAt('/progresso');
  const card = (await screen.findByRole('heading', { name: 'Seus números' })).closest('section')!;
  expect(within(card).getByText('5 km')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '1 ano' }));
  expect(screen.getByText(/em 1 ano/)).toBeInTheDocument();
});

test('evolução do exercício tem a métrica Séries', async () => {
  renderAt('/progresso/exercicio/supino-reto-barra');
  expect(await screen.findByRole('tab', { name: 'Séries' })).toBeInTheDocument();
});

test('desafios: cria no Time e acompanha o progresso', async () => {
  await db.sessions.add(cardioSession({ type: 'corrida', min: 30, km: 5 }, noon));
  const { user } = renderAt('/time');
  await user.click(await screen.findByRole('button', { name: 'Novo desafio' }));
  const sheet = screen.getByRole('dialog');
  await user.click(within(sheet).getByRole('button', { name: 'Km de cardio' }));
  const target = within(sheet).getByLabelText('Meta');
  await user.clear(target);
  await user.type(target, '20');
  await user.click(within(sheet).getByRole('button', { name: '14 dias' }));
  await user.click(within(sheet).getByRole('button', { name: 'Começar desafio' }));
  const item = await screen.findByRole('listitem', { name: /20 km de cardio em 14 dias/ });
  expect(within(item).getByText('5 / 20')).toBeInTheDocument();
  expect(within(item).getByText('14 dias restantes')).toBeInTheDocument();
  expect(within(item).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
});

test('desafio batido aparece como concluído', async () => {
  await saveSettings({ waterGoalMl: 2000 });
  await addChallenge({ kind: 'treinos', target: 1, days: 7 }, today);
  await db.sessions.add(cardioSession({ type: 'bike', min: 40, km: 15 }, noon));
  renderAt('/time');
  const item = await screen.findByRole('listitem', { name: /1 treino em 7 dias/ });
  expect(within(item).getByText('Concluído')).toBeInTheDocument();
});

test('seus números: pouco volume aparece em kg e min, não "0 t" e "0 h"', async () => {
  await db.sessions.add(checkinSession('A', null, 25, noon));
  renderAt('/progresso');
  const list = within((await screen.findByRole('heading', { name: 'Seus números' })).closest('section')!);
  expect(list.getByText('0 kg')).toBeInTheDocument();
  expect(list.getByText('25 min')).toBeInTheDocument();
});
