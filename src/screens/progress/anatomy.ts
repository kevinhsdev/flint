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

// proporção de atleta (~8 cabeças): ombros largos, braços soltos do tronco, como num atlas de anatomia
const SIL_HALF = 'M100 58L90 58Q90 66 88 70Q74 74 60 78Q46 82 44 98Q42 112 42 128Q41 148 40 164Q36 182 34 200Q32 214 32 226Q27 236 30 252Q35 258 40 252Q44 240 44 228Q48 210 52 192Q56 176 57 162Q60 144 61 126Q62 118 63 114Q66 140 68 162Q69 176 68 190Q65 206 66 222Q64 250 66 276Q69 296 72 306Q68 326 70 342Q74 362 80 376Q74 386 78 390L96 390Q97 382 94 374Q92 352 94 332Q96 316 94 306Q97 280 98 256Q99 240 100 232Z';
export const SILHOUETTE = both(SIL_HALF) + 'M100 10Q119 10 119 34Q119 58 100 58Q81 58 81 34Q81 10 100 10Z';

const DELT = 'M64 79Q50 82 47 96Q46 108 49 116Q57 110 61 99Q64 90 64 79Z';
const UPPER_ARM = 'M52 118Q45 128 46 144Q48 158 53 160Q59 148 59 134Q58 122 52 118Z';
const FOREARM = 'M48 168Q39 180 37 198Q36 214 38 222Q43 214 47 202Q52 186 53 170Z';

export const FRONT: Partial<Record<Muscle, string>> = {
  trapezio: both('M90 64Q88 71 70 77Q82 77 91 75Z'),
  ombros: both(DELT),
  peito: both('M99 80L74 82Q66 88 64 100Q64 114 72 120Q86 124 99 118Z'),
  biceps: both(UPPER_ARM),
  antebraco: both(FOREARM),
  abdomen: both('M99 124L88 124Q86 146 87 168Q88 186 92 200L99 206Z', 'M84 126Q74 132 71 150Q70 168 74 184Q81 176 84 156Z'),
  quadriceps: both('M70 214Q64 238 66 264Q69 288 78 300Q88 300 93 284Q96 262 95 240Q93 222 86 210Z'),
  panturrilha: both('M72 318Q68 334 71 352Q75 362 79 356Q82 340 80 326Q77 314 72 318Z'),
};
// linhas de definição por cima das formas (gomos do abdômen, divisão do quadríceps e do posterior), só desenho
export const FRONT_LINES = 'M100 126L100 204M88 144L112 144M88 164L112 164M89 184L111 184' + both('M82 226Q78 258 84 292', 'M72 338Q75 348 76 356');
export const BACK_LINES = both('M81 262Q79 280 81 298', 'M76 316Q75 334 74 352') + 'M100 206L100 246';

export const BACK: Partial<Record<Muscle, string>> = {
  trapezio: both('M100 60L90 62Q86 70 68 78Q82 82 89 96Q95 112 100 132Z'),
  ombros: both(DELT),
  costas: both('M88 100Q84 88 68 84Q63 98 64 116Q66 140 72 162Q80 172 89 176Q95 160 98 140Q96 118 88 100Z', 'M92 180Q96 190 96 202L100 204L100 166Z'),
  triceps: both(UPPER_ARM),
  antebraco: both(FOREARM),
  gluteos: both('M100 206Q86 202 72 208Q64 222 67 240Q76 254 92 252Q98 250 100 246Z'),
  posterior: both('M68 256Q64 276 66 292Q71 304 79 302Q90 296 93 278Q95 262 93 256Q80 260 68 256Z'),
  panturrilha: both('M68 312Q63 330 67 350Q72 362 79 356Q86 342 86 324Q84 310 76 308Q70 308 68 312Z'),
};
