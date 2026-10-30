// Estágios de evolução da Faísca: mesma rig, chama maior e cada vez mais quente na cor
// (laranja → vermelho → roxo → azul, como a temperatura de uma chama de verdade).
// tongue = { a: ângulo (rad, 0 = topo), w: largura, h: altura, curl: curvatura, f: frequência do tremor }
const BASE = [
  { a: -.05, w: .7, h: 54, curl: 9, f: 5.1 },
  { a: -.8, w: .55, h: 32, curl: -3, f: 6.3 },
  { a: .78, w: .5, h: 26, curl: 4, f: 5.7 },
];
const T4 = { a: .32, w: .38, h: 30, curl: -4, f: 6.8 };
const T5 = { a: -.42, w: .38, h: 36, curl: 5, f: 7.2 };
const grow = (k: number, extra: typeof BASE = []) => [...BASE, ...extra].map(t => ({ ...t, h: t.h * k }));

export const STAGES = {
  // laranja: a Faísca aprovada no mockup
  faisca: {
    R: 40, headY: -42, reach: 15, embers: 1, particle: 'ember', glow: '#FF5A1F',
    grad: ['#FFE9A0', '#FFB321', '#FF6A1F', '#E5163E', '#A80C28'],
    core: ['#FFFBE6', '#FFE07A', '#FFC94A'], shade: ['#8E0820', '#FFF1B8'],
    body: ['#FF8A3D', '#E5163E'], belly: '#FFC061', limb: '#F0442A', limbHi: '#FF9A5C', foot: '#B80F2E', ol: '#9A0A26',
    face: { ey: 4, my: 17, ex: 13, ink: '#4A0B0E', cheek: '#FF6B6B' },
    tongues: BASE,
  },
  // vermelho carmesim
  chama: {
    R: 44, headY: -46, reach: 16, embers: 1.6, particle: 'ember', glow: '#E5163E',
    grad: ['#FFD9C2', '#FF6B4A', '#F0243F', '#C10E32', '#7A0620'],
    core: ['#FFF1E8', '#FFB09A', '#FF6B6B'], shade: ['#6E0418', '#FFD9CC'],
    body: ['#FF5A4A', '#C10E32'], belly: '#FF9A8A', limb: '#D61A36', limbHi: '#FF6B6B', foot: '#8E0820', ol: '#6E0418',
    face: { ey: 4, my: 17, ex: 13, ink: '#3D0410', cheek: '#FF9AA8' },
    tongues: grow(1.15, [T4]),
  },
  // roxo
  fogueira: {
    R: 48, headY: -50, reach: 17, embers: 2.6, particle: 'violet', glow: '#9B3DFF',
    grad: ['#F3E2FF', '#D58BFF', '#A94DFF', '#7A22D9', '#4B0F94'],
    core: ['#FFF8FF', '#F0C8FF', '#D58BFF'], shade: ['#3A0B78', '#F3E2FF'],
    body: ['#C06BFF', '#7A22D9'], belly: '#E4B5FF', limb: '#8E33E8', limbHi: '#C98CFF', foot: '#4B0F94', ol: '#3A0B78',
    face: { ey: 4, my: 17, ex: 13, ink: '#22073F', cheek: '#FF8AD8' },
    tongues: grow(1.25, [T4, T5]),
  },
  // azul: a chama mais quente
  forja: {
    R: 50, headY: -52, reach: 18, embers: 3.4, particle: 'blue', glow: '#2E8CFF',
    grad: ['#F0FBFF', '#9BE3FF', '#3FA9FF', '#1E5FE0', '#0F2F99'],
    core: ['#FFFFFF', '#D6F6FF', '#9BE3FF'], shade: ['#0B2575', '#E0F7FF'],
    body: ['#5BB8FF', '#1E5FE0'], belly: '#BDEBFF', limb: '#2A6FE8', limbHi: '#7CC4FF', foot: '#0F2F99', ol: '#0B2575',
    face: { ey: 4, my: 17, ex: 13, ink: '#06183F', cheek: '#8AB8FF' },
    rim: '#E0F7FF',
    tongues: grow(1.3, [T4, T5]),
  },
};
