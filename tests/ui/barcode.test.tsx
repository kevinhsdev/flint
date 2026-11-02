import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { startFresh } from '../../src/db/repo';

beforeEach(() => startFresh());
afterEach(() => vi.unstubAllGlobals());

const product = { status: 1, product: { product_name_pt: 'Aveia em flocos', brands: 'Quaker', serving_quantity: 30, nutriments: { 'energy-kcal_100g': 375, proteins_100g: 13.5, carbohydrates_100g: 58.7, fat_100g: 8.5 } } };

async function openScanner() {
  const r = renderAt('/dieta');
  await r.user.click(await screen.findByRole('button', { name: 'Adicionar em Café da manhã' }));
  await r.user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Código de barras' }));
  return r;
}

test('código digitado busca o produto, preenche pela porção e recalcula pelos gramas', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(product))));
  const { user } = await openScanner();
  const sheet = screen.getByRole('dialog');
  expect(within(sheet).getByText(/Câmera indisponível/)).toBeInTheDocument();
  await user.type(within(sheet).getByLabelText('Código'), '7891000100103');
  await user.click(within(sheet).getByRole('button', { name: 'Buscar' }));
  expect(await within(sheet).findByDisplayValue('Aveia em flocos (Quaker)')).toBeInTheDocument();
  expect(within(sheet).getByLabelText('Proteína (g)')).toHaveValue('4,1');
  expect(within(sheet).getByText('113 kcal')).toBeInTheDocument();
  const grams = within(sheet).getByLabelText('Gramas');
  await user.clear(grams); await user.type(grams, '60');
  expect(within(sheet).getByText('225 kcal')).toBeInTheDocument();
  expect(within(sheet).getByLabelText('Quantidade')).toHaveValue('60 g');
  await user.click(within(sheet).getByRole('button', { name: 'Adicionar' }));
  await vi.waitFor(async () => expect((await db.foods.toArray())[0]).toMatchObject({ name: 'Aveia em flocos (Quaker)', qty: '60 g', kcal: 225, p: 8.1 }));
});

test('produto não encontrado avisa e deixa anotar à mão', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 0 }))));
  const { user } = await openScanner();
  const sheet = screen.getByRole('dialog');
  await user.type(within(sheet).getByLabelText('Código'), '7891000100103');
  await user.click(within(sheet).getByRole('button', { name: 'Buscar' }));
  expect(await within(sheet).findByText(/não encontrado/)).toBeInTheDocument();
});

test('sem internet avisa', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
  const { user } = await openScanner();
  const sheet = screen.getByRole('dialog');
  await user.type(within(sheet).getByLabelText('Código'), '7891000100103');
  await user.click(within(sheet).getByRole('button', { name: 'Buscar' }));
  expect(await within(sheet).findByText(/precisa de internet/)).toBeInTheDocument();
});
