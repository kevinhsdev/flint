import type { Macros } from './types';

/** Produto do Open Food Facts: macros por 100 g e a porção sugerida (g), se houver. */
export interface Product { name: string; per100: Macros; servingG: number | null }

const API = 'https://world.openfoodfacts.org/api/v2/product/';
const FIELDS = 'product_name,product_name_pt,brands,nutriments,serving_quantity';
const n = (x: unknown) => (typeof x === 'number' && Number.isFinite(x) && x >= 0 ? x : null);

export function parseProduct(json: unknown): Product | null {
  const prod = (json as { status?: number; product?: Record<string, unknown> } | null)?.product;
  if (!prod || (json as { status?: number }).status !== 1) return null;
  const name = String(prod.product_name_pt || prod.product_name || '').trim();
  const nu = (prod.nutriments ?? {}) as Record<string, unknown>;
  const kj = n(nu.energy_100g);
  const kcal = n(nu['energy-kcal_100g']) ?? (kj !== null ? Math.round(kj / 4.184) : null);
  const p = n(nu.proteins_100g), c = n(nu.carbohydrates_100g), f = n(nu.fat_100g);
  if (!name || (kcal === null && p === null && c === null && f === null)) return null;
  const brand = String(prod.brands ?? '').split(',')[0].trim();
  return {
    name: brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${name} (${brand})` : name,
    per100: { kcal: Math.round(kcal ?? 4 * (p ?? 0) + 4 * (c ?? 0) + 9 * (f ?? 0)), p: p ?? 0, c: c ?? 0, f: f ?? 0 },
    servingG: n(prod.serving_quantity) || null,
  };
}

export const scaleMacros = (m: Macros, g: number): Macros => ({
  kcal: Math.round((m.kcal * g) / 100), p: Math.round((m.p * g) / 10) / 10, c: Math.round((m.c * g) / 10) / 10, f: Math.round((m.f * g) / 10) / 10,
});

/** Busca o código lido; 'offline' sem rede, 'invalid' se não for um código de barras, null se o produto não existir. */
export async function lookupBarcode(code: string, get: (url: string) => Promise<Response> = u => fetch(u)): Promise<Product | null | 'offline' | 'invalid'> {
  const digits = code.trim();
  if (!/^\d{6,14}$/.test(digits)) return 'invalid';
  let res: Response;
  try { res = await get(`${API}${digits}.json?fields=${FIELDS}`); } catch { return 'offline'; }
  if (!res.ok) return null;
  try { return parseProduct(await res.json()); } catch { return null; }
}
