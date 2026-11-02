import type { SavedMeal } from './types';

/** Item da lista de compras, guardado no kv em 'shopping'. */
export interface ShopItem { id: string; name: string; qty: string; done: boolean }

const AMOUNT = /^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|un)?$/i;
const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

/**
 * Junta os alimentos das refeições salvas escolhidas, cada uma `times` vezes.
 * "150 g", "2 un" somam por unidade; texto livre ("1 concha") vira "N× 1 concha".
 */
export function shoppingList(picks: { meal: SavedMeal; times: number }[]): { name: string; qty: string }[] {
  const items = new Map<string, { name: string; units: Map<string, number>; free: Map<string, number> }>();
  for (const { meal, times } of picks) {
    if (times <= 0) continue;
    for (const f of meal.foods) {
      const key = f.name.trim().toLowerCase();
      const it = items.get(key) ?? { name: f.name.trim(), units: new Map(), free: new Map() };
      items.set(key, it);
      const a = AMOUNT.exec(f.qty.trim());
      if (a) { const u = (a[2] ?? '').toLowerCase(); it.units.set(u, (it.units.get(u) ?? 0) + Number(a[1].replace(',', '.')) * times); }
      else it.free.set(f.qty.trim(), (it.free.get(f.qty.trim()) ?? 0) + times);
    }
  }
  return [...items.values()]
    .map(it => ({
      name: it.name,
      qty: [
        ...[...it.units].map(([u, n]) => `${fmt(n)}${u ? ` ${u}` : ''}`),
        ...[...it.free].map(([q, n]) => `${n}×${q ? ` ${q}` : ''}`),
      ].join(' + '),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
}
