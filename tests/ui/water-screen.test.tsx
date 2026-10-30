import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { getSettings, logWater, startFresh } from '../../src/db/repo';
import { waterDays, waterStreak } from '../../src/domain/body';
import type { WaterLog } from '../../src/domain/types';

beforeEach(() => startFresh());

test('tela de água soma 500 e mostra no total', async () => {
  const { user } = renderAt('/agua');
  await user.click(await screen.findByRole('button', { name: '+500 ml' }));
  expect(await screen.findByLabelText(/Bebido hoje/)).toHaveTextContent('0,5');
  expect(await db.water.count()).toBe(1);
});

test('lista do dia permite remover um registro', async () => {
  await logWater(250); await logWater(150);
  const { user } = renderAt('/agua');
  const list = await screen.findByRole('list', { name: 'Registros de hoje' });
  expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  await user.click(within(list).getByRole('button', { name: 'Remover 150 ml' }));
  await vi.waitFor(async () => expect(await db.water.count()).toBe(1));
});

test('meta manual editável na tela', async () => {
  const { user } = renderAt('/agua');
  await user.click(await screen.findByRole('switch', { name: 'Meta automática' }));
  const field = await screen.findByLabelText('Meta diária (ml)');
  await user.clear(field); await user.type(field, '3000');
  await vi.waitFor(async () => expect((await getSettings()).waterGoalMl).toBe(3000));
});

test('mostra frequência e sequência', async () => {
  renderAt('/agua');
  expect(await screen.findByRole('heading', { name: 'Frequência' })).toBeInTheDocument();
  expect(screen.getByText(/dias seguidos/)).toBeInTheDocument();
});

const w = (day: string, ml: number): WaterLog => ({ id: day + ml, day, at: 0, ml });
test('waterDays e waterStreak', () => {
  const logs = [w('2026-10-26', 2500), w('2026-10-27', 3000), w('2026-10-28', 1000), w('2026-10-28', 1500), w('2026-10-29', 1200), w('2026-10-30', 500)];
  expect(waterDays(logs, 2500, ['2026-10-27', '2026-10-29', '2026-10-31'])).toEqual({ '2026-10-27': 1, '2026-10-29': 0.48, '2026-10-31': 0 });
  expect(waterStreak(logs, 2500, '2026-10-28')).toBe(3);
  // hoje ainda parcial não quebra a sequência de ontem
  expect(waterStreak([...logs.slice(0, 4), w('2026-10-29', 500)], 2500, '2026-10-29')).toBe(3);
  expect(waterStreak(logs, 2500, '2026-10-30')).toBe(0);
});
