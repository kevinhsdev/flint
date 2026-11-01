import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { logFood, saveSettings, startFresh } from '../../src/db/repo';
import { addDays, localDay } from '../../src/domain/dates';

const today = localDay(new Date());
beforeEach(() => startFresh());

const meal = async (name: string) => within((await screen.findByRole('heading', { name })).closest('section')!);

test('Hoje mostra a dieta do dia e leva pra aba Dieta', async () => {
  await saveSettings({ nutritionGoal: { kcal: 2000, p: 150, c: 200, f: 60 } });
  await logFood({ day: today, meal: 'cafe', name: 'Ovo', qty: '', kcal: 200, p: 12, c: 1, f: 14 });
  const { user } = renderAt('/');
  await user.click(await screen.findByRole('link', { name: /^Dieta: 200 de 2\.000 kcal/ }, { timeout: 15000 }));
  expect(await screen.findByRole('heading', { name: 'Dieta' })).toBeInTheDocument();
});

test('refeição salva: guarda uma refeição inteira e adiciona tudo de uma vez', async () => {
  await logFood({ day: today, meal: 'almoco', name: 'Arroz', qty: '150 g', kcal: 189, p: 4, c: 42, f: 0.5 });
  await logFood({ day: today, meal: 'almoco', name: 'Frango', qty: '120 g', kcal: 200, p: 37, c: 0, f: 5 });
  const { user } = renderAt('/dieta');
  await user.click(await (await meal('Almoço')).findByRole('button', { name: 'Salvar Almoço como refeição pronta' }));
  let sheet = screen.getByRole('dialog');
  const name = within(sheet).getByLabelText('Nome');
  await user.clear(name); await user.type(name, 'Marmita');
  await user.click(within(sheet).getByRole('button', { name: 'Salvar' }));
  await vi.waitFor(async () => expect(await db.savedMeals.count()).toBe(1));

  await user.click(await screen.findByRole('button', { name: 'Adicionar em Jantar' }));
  sheet = screen.getByRole('dialog');
  await user.click(within(within(sheet).getByRole('group', { name: 'Refeições salvas' })).getByRole('button', { name: /Marmita.*389 kcal/ }));
  expect(await (await meal('Jantar')).findByText('Frango')).toBeInTheDocument();
  expect(await db.foods.where('day').equals(today).filter(f => f.meal === 'jantar').count()).toBe(2);
});

test('refeição salva pode ser apagada', async () => {
  await db.savedMeals.add({ id: 's', name: 'Marmita', foods: [{ name: 'Arroz', qty: '', kcal: 189, p: 4, c: 42, f: 0.5 }] });
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Adicionar em Jantar' }));
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Apagar refeição salva Marmita' }));
  await vi.waitFor(async () => expect(await db.savedMeals.count()).toBe(0));
});

test('Progresso tem a evolução da dieta por semana', async () => {
  await logFood({ day: addDays(today, -1), meal: 'almoco', name: 'Feijão', qty: '', kcal: 1800, p: 120, c: 14, f: 0.5 });
  renderAt('/progresso');
  const card = within((await screen.findByRole('heading', { name: 'Dieta' })).closest('section')!);
  expect(card.getByText(/1\.800 kcal/)).toBeInTheDocument();
  expect(card.getByText(/120 g de proteína/)).toBeInTheDocument();
});
