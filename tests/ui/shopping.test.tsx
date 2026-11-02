import { screen, within } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { startFresh } from '../../src/db/repo';
import { importBackup } from '../../src/domain/backup';

beforeEach(() => startFresh());

test('Dieta leva pra lista de compras', async () => {
  const { user } = renderAt('/dieta');
  await user.click(await screen.findByRole('link', { name: 'Lista de compras' }));
  expect(await screen.findByRole('heading', { name: 'Lista de compras' })).toBeInTheDocument();
});

test('monta a lista das refeições salvas, marca, adiciona à mão e limpa os marcados', async () => {
  await db.savedMeals.add({ id: 's', name: 'Marmita', foods: [{ name: 'Arroz', qty: '150 g', kcal: 189, p: 4, c: 42, f: 0.5 }, { name: 'Frango', qty: '120 g', kcal: 200, p: 37, c: 0, f: 5 }] });
  const { user } = renderAt('/dieta/compras');
  const add = await screen.findByRole('button', { name: 'Adicionar à lista' });
  expect(add).toBeDisabled();
  await user.click(screen.getByRole('button', { name: 'Mais Marmita' }));
  await user.click(screen.getByRole('button', { name: 'Mais Marmita' }));
  expect(screen.getByText(/2× na semana/)).toBeInTheDocument();
  await user.click(add);
  const list = await screen.findByRole('list', { name: 'Itens' });
  expect(await within(list).findByRole('checkbox', { name: 'Arroz 300 g' })).not.toBeChecked();

  await user.type(screen.getByLabelText('Item'), 'Sabão{Enter}');
  await user.click(await within(list).findByRole('checkbox', { name: 'Arroz 300 g' }));
  await vi.waitFor(async () => expect(((await db.kv.get('shopping'))?.value as { done: boolean }[]).filter(i => i.done)).toHaveLength(1));
  await user.click(screen.getByRole('button', { name: 'Limpar marcados' }));
  await vi.waitFor(() => expect(within(list).queryByRole('checkbox', { name: 'Arroz 300 g' })).not.toBeInTheDocument());
  expect(within(list).getByRole('checkbox', { name: 'Frango 240 g' })).toBeInTheDocument();
  expect(within(list).getByRole('checkbox', { name: 'Sabão' })).toBeInTheDocument();
});

test('backup com lista de compras malformada é recusado', async () => {
  const bad = { app: 'flint', version: 4, data: { exercises: [], templates: [], sessions: [], water: [], weights: [], kv: [{ key: 'shopping', value: [{ id: 1 }] }] } };
  const r = await importBackup(new File([JSON.stringify(bad)], 'b.json'));
  expect(r.ok).toBe(false);
});
