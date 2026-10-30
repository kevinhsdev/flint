import { render, screen } from '@testing-library/react';
import { renderAt } from './render';
import App from '../../src/App';
import { db } from '../../src/db/db';
import { getSettings, saveSettings, startFresh, upsertTemplate, wipeAll } from '../../src/db/repo';
import { localDay } from '../../src/domain/dates';
import type { Profile } from '../../src/domain/types';

vi.setConfig({ testTimeout: 30_000 });

type User = ReturnType<typeof renderAt>['user'];
const next = (user: User) => user.click(screen.getByRole('button', { name: 'Continuar' }));
const pick = async (user: User, name: string | RegExp) => user.click(await screen.findByRole('button', { name }));

async function answerAll(user: User) {
  await pick(user, /Ganhar massa/); await next(user);
  await pick(user, /Intermediário/); await next(user);
  for (const d of ['Seg', 'Qua', 'Sex']) await pick(user, d);
  await next(user);
  await pick(user, /60 min/); await next(user);
  await pick(user, /Academia completa/); await next(user);
  await pick(user, /Monte um para mim/); await next(user);
  await user.type(screen.getByLabelText('Peso (kg)'), '80');
  await user.type(screen.getByLabelText('Altura (cm)'), '180');
  await user.type(screen.getByLabelText('Idade'), '30');
  await next(user);
  const time = screen.getByLabelText('Horário');
  await user.clear(time); await user.type(time, '18:00');
}

test('primeira abertura cai na pesquisa', async () => {
  await wipeAll();
  render(<App />);
  expect(await screen.findByText(/Qual é o seu objetivo/, {}, { timeout: 15000 })).toBeInTheDocument();
});

test('responder tudo gera rotina, água e peso', async () => {
  await startFresh();
  const { user } = renderAt('/bem-vindo');
  await answerAll(user);
  await user.click(screen.getByRole('button', { name: 'Ver meu plano' }));
  expect(await screen.findByText(/Seu ponto de partida/)).toBeInTheDocument();
  const s = await getSettings();
  expect(s.onboarded).toBe(true);
  expect(s.trainDays).toEqual([1, 3, 5]);
  expect(s.trainTime).toBe('18:00');
  expect(s.heightCm).toBe(180);
  expect((await db.templates.toArray()).filter(t => !t.archived)).toHaveLength(3);
  expect((await db.weights.toArray()).map(w => [w.day, w.kg])).toEqual([[localDay(new Date()), 80]]);
  await next(user); // estratégia
  await next(user); // água
  expect(await screen.findByText(/2,75 L/)).toBeInTheDocument();
});

test('peso fora da faixa não avança', async () => {
  await startFresh();
  const { user } = renderAt('/bem-vindo');
  await answerAll(user);
  await user.click(screen.getByRole('button', { name: 'Voltar' }));
  const kg = screen.getByLabelText('Peso (kg)');
  await user.clear(kg); await user.type(kg, '20');
  expect(screen.getByText(/Entre 30 e 300 kg/)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeDisabled();
});

test('só quero explorar carrega a demo', async () => {
  await startFresh();
  const { user } = renderAt('/bem-vindo');
  await pick(user, 'Só quero explorar');
  await vi.waitFor(async () => expect((await getSettings()).demo).toBe(true));
  expect(await db.sessions.count()).toBeGreaterThan(0);
});

const PROFILE: Profile = { goal: 'massa', level: 'intermediario', days: [1, 3, 5], minutes: 60, place: 'completa', age: 30 };

async function withHistory() {
  await startFresh();
  await upsertTemplate({ id: 'meu', name: 'Meu treino', order: 0, archived: false, items: [{ exerciseId: 'supino-reto-barra', sets: 3, repMin: 8, repMax: 12, restSec: 90 }] });
  await db.sessions.add({ id: 's1', templateId: 'meu', name: 'Meu treino', startedAt: Date.now() - 864e5, endedAt: Date.now() - 864e5 + 3600e3,
    entries: [{ exerciseId: 'supino-reto-barra', sets: [{ kg: 60, reps: 10, done: true }] }] });
  await db.weights.add({ id: 'w', day: '2026-01-01', kg: 80 });
  await saveSettings({ onboarded: true, profile: PROFILE, heightCm: 180, waterGoalMl: 3000 });
}

async function redoTo(user: User, finalButton: string) {
  for (let i = 0; i < 6; i++) await next(user); // tudo já vem preenchido
  await pick(user, finalButton);
}

test('refazer arquiva treinos antigos e mantém histórico', async () => {
  await withHistory();
  const { user } = renderAt('/bem-vindo?refazer=1');
  expect(await screen.findByRole('button', { name: /Ganhar massa/, pressed: true })).toBeInTheDocument();
  await redoTo(user, 'Gerar novo plano');
  await vi.waitFor(async () => expect((await db.templates.get('meu'))?.archived).toBe(true));
  expect((await db.templates.toArray()).filter(t => !t.archived)).toHaveLength(3);
  expect(await db.sessions.get('s1')).toBeDefined();
});

test('manter minha rotina não mexe nos treinos', async () => {
  await withHistory();
  const { user } = renderAt('/bem-vindo?refazer=1');
  await screen.findByRole('button', { name: /Ganhar massa/, pressed: true });
  await redoTo(user, 'Manter minha rotina');
  await vi.waitFor(async () => expect((await getSettings()).waterGoalMl).toBeNull());
  expect(await db.templates.toArray()).toHaveLength(1);
  expect((await db.templates.get('meu'))?.archived).toBe(false);
});
