import type { Muscle } from '../../domain/types';

/*
 * Corpo desenhado à mão num viewBox 200×400 (centro x = 100). Cada forma é a metade esquerda;
 * `mirror` gera a direita. Comandos sempre absolutos (M/L/Q/Z), então todo número é par x,y.
 */
const mirror = (d: string) => {
  let i = 0;
  return d.replace(/-?\d+(\.\d+)?/g, n => (i++ % 2 === 0 ? String(200 - Number(n)) : n));
};
const both = (...halves: string[]) => halves.map(h => h + mirror(h)).join('');

const SIL_HALF = 'M101 50L91 50Q90 58 90 63Q80 66 70 70Q58 74 55 86Q51 98 51 116Q49 134 47 150Q43 166 42 182Q39 196 38 206Q33 216 35 228Q38 234 43 230Q46 222 47 212Q50 204 52 198Q57 182 59 166Q61 154 62 146Q65 130 65 112Q66 106 67 104Q68 120 69 136Q71 152 72 162Q70 176 68 186Q63 206 62 236Q62 260 65 280Q62 296 62 312Q63 336 69 360Q71 372 70 380Q64 386 68 390L86 390Q89 384 87 372Q86 352 88 330Q90 306 90 290Q91 280 92 270Q95 248 96 228Q98 216 101 212Z';
export const SILHOUETTE = both(SIL_HALF) + 'M100 10Q116 10 116 30Q116 50 100 50Q84 50 84 30Q84 10 100 10Z';

const DELT = 'M70 71Q58 74 55 88Q54 98 57 104Q62 100 65 90Q68 80 70 71Z';
const UPPER_ARM = 'M59 106Q53 116 54 134Q56 146 60 146Q64 132 64 116Q63 108 59 106Z';
const FOREARM = 'M60 154Q52 160 48 176Q45 190 46 198Q50 196 53 186Q58 172 60 154Z';

export const FRONT: Partial<Record<Muscle, string>> = {
  trapezio: both('M91 58Q90 64 89 66Q80 68 72 70Q82 62 91 58Z'),
  ombros: both(DELT),
  peito: both('M99 74L78 75Q70 78 68 90Q68 102 76 108Q88 112 99 106Z'),
  biceps: both(UPPER_ARM),
  antebraco: both(FOREARM),
  abdomen: both('M99 112L88 112Q86 130 87 150Q88 166 92 180L99 184Z', 'M85 114Q76 118 73 136Q72 154 76 168Q82 160 85 140Z'),
  quadriceps: both('M71 192Q64 214 65 244Q67 266 76 276Q86 276 91 262Q95 244 95 224Q93 206 87 196Z'),
  panturrilha: both('M66 300Q63 318 66 340Q70 350 74 344Q77 326 75 310Q72 298 66 300Z'),
};
// linhas de definição por cima das formas (gomos do abdômen, divisão do quadríceps e do posterior), só desenho
export const FRONT_LINES = 'M100 114L100 182M88 132L112 132M88 150L112 150M89 166L111 166' + both('M82 204Q78 236 83 270', 'M66 318Q70 330 70 344');
export const BACK_LINES = both('M81 238Q79 258 81 280', 'M74 296Q73 316 72 338') + 'M100 188L100 224';

export const BACK: Partial<Record<Muscle, string>> = {
  trapezio: both('M100 54L91 56Q86 64 72 70Q84 74 90 86Q95 100 100 118Z'),
  ombros: both(DELT),
  costas: both('M89 90Q84 78 72 74Q66 88 67 106Q69 126 74 146Q80 156 88 160Q94 146 97 128Q95 108 89 90Z', 'M91 164Q95 172 95 184L100 186L100 150Z'),
  triceps: both(UPPER_ARM),
  antebraco: both(FOREARM),
  gluteos: both('M100 188Q86 184 74 190Q66 202 69 218Q78 230 92 228Q98 226 100 222Z'),
  posterior: both('M70 232Q64 252 66 272Q72 284 80 282Q90 274 93 254Q94 238 92 232Q80 236 70 232Z'),
  panturrilha: both('M65 294Q60 312 64 334Q70 346 77 340Q84 324 84 306Q82 292 74 290Q68 290 65 294Z'),
};
