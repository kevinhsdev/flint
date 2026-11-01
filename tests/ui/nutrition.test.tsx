import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { getSettings, logFood, saveSettings, startFresh } from '../../src/db/repo';
import { addDays, localDay } from '../../src/domain/dates';

const today = localDay(new Date());
const yesterday = addDays(today, -1);
beforeEach(() => startFresh());

const meal = async (name: string) => within((await screen.findByRole('heading', { name })).closest('section')!);

test('dieta mostra as refeições do dia e o cartão de água', async () => {
  renderAt('/dieta');
  for (const n of ['Café da manhã', 'Almoço', 'Lanche', 'Jantar']) expect(await screen.findByRole('heading', { name: n })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /^Água:/ })).toBeInTheDocument();
});

test('adiciona alimento: kcal sai dos macros quando fica em branco', async () => {
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Adicionar em Almoço' }));
  const sheet = screen.getByRole('dialog');
  await user.type(within(sheet).getByLabelText('Alimento'), 'Arroz');
  await user.type(within(sheet).getByLabelText('Quantidade'), '150 g');
  await user.type(within(sheet).getByLabelText('Proteína (g)'), '4');
  await user.type(within(sheet).getByLabelText('Carboidrato (g)'), '42');
  await user.type(within(sheet).getByLabelText('Gordura (g)'), '0,5');
  expect(within(sheet).getByText('189 kcal')).toBeInTheDocument();
  await user.click(within(sheet).getByRole('button', { name: 'Adicionar' }));
  const almoco = await meal('Almoço');
  expect(await almoco.findByText('Arroz')).toBeInTheDocument();
  expect(almoco.getAllByText(/189 kcal/).length).toBeGreaterThan(0);
  expect(screen.getByLabelText('Consumido hoje')).toHaveTextContent('189');
  expect((await db.foods.toArray())[0]).toMatchObject({ day: today, meal: 'almoco', name: 'Arroz', qty: '150 g', kcal: 189, p: 4, c: 42, f: 0.5 });
});

test('meta: digitada à mão mostra quanto falta', async () => {
  await logFood({ day: today, meal: 'cafe', name: 'Ovo', qty: '', kcal: 200, p: 12, c: 1, f: 14 });
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Definir meta' }));
  const sheet = screen.getByRole('dialog');
  for (const [l, v] of [['Calorias (kcal)', '2000'], ['Proteína (g)', '150'], ['Carboidrato (g)', '200'], ['Gordura (g)', '60']]) {
    await user.clear(within(sheet).getByLabelText(l)); await user.type(within(sheet).getByLabelText(l), v);
  }
  await user.click(within(sheet).getByRole('button', { name: 'Salvar meta' }));
  await vi.waitFor(async () => expect((await getSettings()).nutritionGoal).toEqual({ kcal: 2000, p: 150, c: 200, f: 60 }));
  expect(await screen.findByText('1.800')).toBeInTheDocument();
  expect(screen.getByText(/restantes/)).toBeInTheDocument();
  expect(screen.getByRole('progressbar', { name: 'Proteína' })).toHaveAttribute('aria-valuenow', '8');
});

test('meta: sugestão pelo perfil preenche os campos', async () => {
  await saveSettings({ heightCm: 180, trainDays: [1, 2, 4, 5], profile: { goal: 'massa', level: 'iniciante', days: [1, 2, 4, 5], minutes: 60, place: 'completa', age: 30 } });
  await db.weights.add({ id: 'w', day: today, kg: 80 });
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Definir meta' }));
  const sheet = screen.getByRole('dialog');
  await user.click(within(sheet).getByRole('button', { name: 'Masculino' }));
  expect(within(sheet).getByLabelText('Calorias (kcal)')).toHaveValue('2950');
  expect(within(sheet).getByLabelText('Proteína (g)')).toHaveValue('160');
});

test('frequentes: alimento de outro dia vira atalho que preenche tudo', async () => {
  await logFood({ day: yesterday, meal: 'cafe', name: 'Whey', qty: '30 g', kcal: 120, p: 24, c: 3, f: 1.5 });
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Adicionar em Lanche' }));
  const sheet = screen.getByRole('dialog');
  await user.click(within(sheet).getByRole('button', { name: /Whey/ }));
  expect(within(sheet).getByLabelText('Alimento')).toHaveValue('Whey');
  await user.click(within(sheet).getByRole('button', { name: 'Adicionar' }));
  expect(await (await meal('Lanche')).findByText('Whey')).toBeInTheDocument();
});

test('repetir de ontem copia a refeição', async () => {
  await logFood({ day: yesterday, meal: 'jantar', name: 'Frango', qty: '150 g', kcal: 250, p: 46, c: 0, f: 6 });
  const { user } = renderAt('/dieta');
  await user.click(await (await meal('Jantar')).findByRole('button', { name: 'Repetir jantar de ontem' }));
  expect(await (await meal('Jantar')).findByText('Frango')).toBeInTheDocument();
  expect(await db.foods.where('day').equals(today).count()).toBe(1);
});

test('apagar alimento', async () => {
  await logFood({ day: today, meal: 'cafe', name: 'Pão', qty: '', kcal: 140, p: 4, c: 28, f: 1 });
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Apagar Pão' }));
  await vi.waitFor(async () => expect(await db.foods.count()).toBe(0));
});

test('dia anterior mostra o que foi comido ontem', async () => {
  await logFood({ day: yesterday, meal: 'almoco', name: 'Feijão', qty: '', kcal: 100, p: 6, c: 14, f: 0.5 });
  const { user } = renderAt('/dieta');
  expect(await screen.findByRole('heading', { name: 'Almoço' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Próximo dia' })).toBeDisabled();
  expect(screen.queryByText('Feijão')).toBeNull();
  await user.click(screen.getByRole('button', { name: 'Dia anterior' }));
  expect(await screen.findByText('Feijão')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Próximo dia' })).toBeEnabled();
});

test('editar refeições: renomeia, adiciona e remove', async () => {
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('button', { name: 'Editar refeições' }));
  const sheet = screen.getByRole('dialog');
  const lanche = within(sheet).getByDisplayValue('Lanche');
  await user.clear(lanche); await user.type(lanche, 'Pré-treino');
  await user.click(within(sheet).getByRole('button', { name: 'Remover Jantar' }));
  await user.click(within(sheet).getByRole('button', { name: 'Nova refeição' }));
  await user.type(within(sheet).getAllByRole('textbox').at(-1)!, 'Ceia');
  await user.click(within(sheet).getByRole('button', { name: 'Salvar refeições' }));
  await vi.waitFor(async () => expect((await getSettings()).meals.map(m => m.name)).toEqual(['Café da manhã', 'Almoço', 'Pré-treino', 'Ceia']));
  expect(await screen.findByRole('heading', { name: 'Pré-treino' })).toBeInTheDocument();
});

test('semana mostra as kcal dos últimos 7 dias', async () => {
  await logFood({ day: yesterday, meal: 'almoco', name: 'Feijão', qty: '', kcal: 1800, p: 6, c: 14, f: 0.5 });
  renderAt('/dieta');
  expect(await screen.findByRole('img', { name: /média de 1\.800 kcal/ })).toBeInTheDocument();
});
