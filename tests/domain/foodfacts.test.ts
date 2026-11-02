import { lookupBarcode, parseProduct, scaleMacros } from '../../src/domain/foodfacts';

const off = (product: Record<string, unknown>, status = 1) => ({ status, product });
const nutri = { 'energy-kcal_100g': 375, proteins_100g: 13.5, carbohydrates_100g: 58.7, fat_100g: 8.5 };

test('lê nome (pt primeiro), marca, macros por 100 g e porção', () => {
  expect(parseProduct(off({ product_name: 'Rolled oats', product_name_pt: 'Aveia em flocos', brands: 'Quaker, PepsiCo', nutriments: nutri, serving_quantity: 30 })))
    .toEqual({ name: 'Aveia em flocos (Quaker)', per100: { kcal: 375, p: 13.5, c: 58.7, f: 8.5 }, servingG: 30 });
});

test('sem kcal, converte kJ; sem porção, null; macro ausente vira 0', () => {
  expect(parseProduct(off({ product_name: 'Leite', nutriments: { energy_100g: 251, proteins_100g: 3.2 } })))
    .toEqual({ name: 'Leite', per100: { kcal: 60, p: 3.2, c: 0, f: 0 }, servingG: null });
});

test('produto não encontrado ou sem energia nem macros não serve', () => {
  expect(parseProduct(off({}, 0))).toBeNull();
  expect(parseProduct(off({ product_name: 'Água', nutriments: {} }))).toBeNull();
  expect(parseProduct(off({ nutriments: nutri }))).toBeNull();
});

test('escala pela quantidade em gramas', () => {
  expect(scaleMacros({ kcal: 375, p: 13.5, c: 58.7, f: 8.5 }, 30)).toEqual({ kcal: 113, p: 4.1, c: 17.6, f: 2.6 });
});

test('busca no Open Food Facts só com código numérico; sem rede avisa', async () => {
  const calls: string[] = [];
  const ok = async (url: string) => { calls.push(url); return new Response(JSON.stringify(off({ product_name: 'Aveia', nutriments: nutri }))); };
  expect(await lookupBarcode(' 7891000100103 ', ok)).toMatchObject({ name: 'Aveia' });
  expect(calls[0]).toMatch(/^https:\/\/world\.openfoodfacts\.org\/api\/v2\/product\/7891000100103\.json\?fields=/);
  expect(await lookupBarcode('abc', ok)).toBe('invalid');
  expect(calls).toHaveLength(1);
  expect(await lookupBarcode('7891000100103', async () => { throw new TypeError('Failed to fetch'); })).toBe('offline');
  expect(await lookupBarcode('7891000100103', async () => new Response(JSON.stringify(off({}, 0))))).toBeNull();
});
