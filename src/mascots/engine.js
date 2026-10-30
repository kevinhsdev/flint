// Portado de docs/reference/mascots.js (mockup aprovado). Mantém física e comportamentos; troca o bootstrap do mockup por uma API.
import { STAGES } from './stages';

/* Rig 2.5D com o repertório dos mascotes de app mais famosos:
   ociosos vivos (olhar, coçar a cabeça, bocejar, dormir), dança, comemoração,
   cócegas no toque, carinho ao esfregar, arrastar e arremessar com física (fica tonto),
   falar com a boca sincronizada. Braços e pernas "nub" que dobram e atrasam. */
const TAU = Math.PI * 2;
let still = false;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, k) => a + (b - a) * k;
const NS = 'http://www.w3.org/2000/svg';
const f1 = v => v.toFixed(1), f2 = v => v.toFixed(2), f3 = v => v.toFixed(3);
let uid = 0;

function smooth(pts) {
  const n = pts.length;
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return d + 'Z';
}
function blob(R, bumps, wob = () => 0, sway = 0, N = 64, up = 0) {
  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = i / N * TAU - Math.PI, th = a - Math.PI / 2;
    let ext = 0, curl = 0;
    for (const b of bumps) {
      const d = Math.abs(a - b.a) / b.w;
      if (d < 1) { const k = Math.pow(1 - d, 2.1); ext += b.h * k; curl += (b.curl || 0) * k * k; }
    }
    const r = R * (1 + wob(th)), dx = Math.cos(th) * (1 - up), dy = Math.sin(th) * (1 - up) - up, dl = Math.hypot(dx, dy) || 1;
    pts.push([Math.cos(th) * r + dx / dl * ext + curl + sway * Math.pow(ext / 60, 1.6) * 40, Math.sin(th) * r + dy / dl * ext]);
  }
  return smooth(pts);
}

/* ---------- folha de expressões (linguagem da logo: olhos brancos recortados, sem pupila) ---------- */
// cada olho é desenhado como o esquerdo; o direito é espelhado (s = -1)
const W = '#fff';
const eye = (s, d) => `<g transform="scale(${s} 1)"><path d="${d}" fill="${W}"/></g>`;
const EYE = {
  // o olho da logo: topo reto em diagonal descendo para o centro, base arredondada
  neutro: (k, s) => eye(s, 'M-10 -9L9.5 6Q4 11.5 -2 11.5Q-10.5 11 -11 2Q-11.2 -4.5 -10 -9Z'),
  bravo: (k, s) => eye(s, 'M-10.5 -12L10 7Q4 11.5 -2 11.5Q-10.5 11 -11 2Q-11.2 -6 -10.5 -12Z'),
  triste: (k, s) => eye(s, 'M-10 -1L9 -7Q11 3 5 9Q-2 13 -8 9Q-11.5 5 -10 -1Z'),
  feliz: (k, s) => eye(s, 'M-10.5 6Q-10 -9 0 -9Q10 -9 10.5 6Q7 4 0 3.5Q-7 4 -10.5 6Z'),
  animado: (k, s) => eye(s, 'M-11.5 7Q-11 -11 0 -11Q11 -11 11.5 7Q7.5 4.5 0 4Q-7.5 4.5 -11.5 7Z'),
  surpreso: () => `<ellipse rx="9" ry="10.5" fill="${W}"/>`,
  esforco: (k, s) => `<g transform="scale(${s} 1)"><path d="M-8 -8L7 0L-8 8" stroke="${W}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  sono: () => `<path d="M-9 1Q0 7 9 1" stroke="${W}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
  tonto: () => `<path d="M0 0m-1.5 0a1.5 1.5 0 1 1 3 0a3.2 3.2 0 1 1 -6.4 0a5 5 0 1 1 10 0a7 7 0 1 1 -14 0" stroke="${W}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  olhaCima: (k, s) => eye(s, 'M-10 -12L9.5 3Q4 8.5 -2 8.5Q-10.5 8 -11 -1Q-11.2 -7.5 -10 -12Z'),
};
// boca só aparece quando há emoção; em repouso o rosto é o da logo
const MOUTH = {
  neutro: () => '',
  feliz: k => `<path d="M-7 -1Q0 9 7 -1Z" fill="${k}"/>`,
  animado: k => `<path d="M-9 -2Q0 12 9 -2Z" fill="${k}"/><path d="M-4 4.5Q0 7.5 4 4.5Q0 3 -4 4.5Z" fill="#FF8FA3"/>`,
  surpreso: k => `<ellipse cy="2" rx="3.4" ry="4.4" fill="${k}"/>`,
  bravo: () => '',
  foco: () => '',
  triste: k => `<path d="M-5 4Q0 -1 5 4" stroke="${k}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  esforco: k => `<rect x="-7" y="-2.5" width="14" height="7" rx="3" fill="${k}"/><rect x="-5.5" y="-.8" width="11" height="3.2" rx="1" fill="#fff"/>`,
  bocejo: k => `<ellipse cy="3" rx="4.6" ry="6.4" fill="${k}"/>`,
  sono: () => '',
  tonto: k => `<path d="M-6 2Q-3 -1 0 2Q3 5 6 2" stroke="${k}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  fala: k => `<ellipse cy="2" rx="4.4" ry="3.8" fill="${k}"/>`,
};
const EXPR = { neutro: ['neutro', 'neutro'], feliz: ['feliz', 'feliz'], animado: ['animado', 'animado'], surpreso: ['surpreso', 'surpreso'],
  bravo: ['bravo', 'bravo'], triste: ['triste', 'triste'], foco: ['bravo', 'foco'], esforco: ['esforco', 'esforco'], bocejo: ['sono', 'bocejo'],
  sono: ['sono', 'sono'], tonto: ['tonto', 'tonto'], curioso: ['olhaCima', 'neutro'] };
const BLINKS = new Set(['neutro', 'surpreso', 'bravo', 'triste', 'olhaCima']);

function marks(e, R, top) {
  const st = (x, y, s, c) => `<path class="mk" d="M${x} ${y - s}Q${x + s * .2} ${y - s * .2} ${x + s} ${y}Q${x + s * .2} ${y + s * .2} ${x} ${y + s}Q${x - s * .2} ${y + s * .2} ${x - s} ${y}Q${x - s * .2} ${y - s * .2} ${x} ${y - s}Z" fill="${c}"/>`;
  const ln = (d, c, w = 2.4) => `<path class="mk" d="${d}" stroke="${c}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
  switch (e) {
    case 'feliz': return ln(`M${-R - 8} ${-R * .2}l-7 -3M${-R - 6} ${-R * .5}l-6 -6`, '#FFE38A') + ln(`M${R + 8} ${-R * .2}l7 -3M${R + 6} ${-R * .5}l6 -6`, '#FFE38A');
    case 'animado': return st(-R - 12, -R * .4, 7, '#FFE38A') + st(R + 14, -R * .7, 9, '#FFF4C2') + st(R + 6, R * .35, 5, '#FFE38A') + st(-R - 4, R * .45, 4, '#FFF4C2');
    case 'surpreso': return ln(`M-9 ${-top - 6}l-4 -9M0 ${-top - 9}v-10M9 ${-top - 6}l4 -9`, '#FFF4C2');
    case 'bravo': return ln(`M${R * .62} ${-R * .95}q4 4 0 8M${R * .62 + 12} ${-R * .95}q-4 4 0 8M${R * .62 + 2} ${-R * .95 - 2}q4 -4 8 0M${R * .62 + 2} ${-R * .95 + 10}q4 4 8 0`, '#FF3B3B', 2.8);
    case 'triste': return ln(`M${-R - 8} ${-R * .6}v12M${-R - 15} ${-R * .4}v12M${R + 8} ${-R * .6}v12M${R + 15} ${-R * .4}v12`, '#8FA3C8', 2);
    case 'tonto': return `<g data-orbit>${[0, 1, 2].map(i => st(Math.cos(i * TAU / 3) * 30, Math.sin(i * TAU / 3) * 30, 5, '#FFE38A')).join('')}</g>`;
    default: return '';
  }
}

/* ---------- personagens ---------- */
// sombra chapada de duas cores (como ilustração flat): a forma de novo, deslocada, recorta uma meia-lua escura
const flat = (id, main, dark) => `
  <g clip-path="url(#cl${id})"><use href="#o${id}" fill="${dark}"/><use data-r="lit" href="#o${id}" fill="${main}" transform="translate(-6 -5)"/></g>`;
// silhueta da logo: escudo com ponta embaixo e três pontas em cima; a evolução cresce as pontas, não multiplica
const CROWN = { x: [-.7, 0, .7], h: [.86, 1.16, .86] };
function flame(R, k, t, M, sway, f) {
  const c = CROWN, n = 3, P = (x, y) => `${f1(x * R)} ${f1(y * R)}`;
  const tip = i => {
    const h = c.h[i] * k * (1 + M * .06 * Math.sin(t * f * (1 + i * .13) + i * 1.9)), x = c.x[i] + sway * (h - .5) * .28;
    return [x, -h];
  };
  const tips = c.x.map((_, i) => tip(i));
  let d = `M${P(0, 1.06)}C${P(-.5, 1)} ${P(-1.03, .72)} ${P(-1, .24)}C${P(-.98, -.24)} ${P(-.88, -.6)} ${P(...tips[0])}`;
  for (let i = 1; i < n; i++) {
    const vx = (c.x[i - 1] + c.x[i]) / 2 + sway * .05, vy = -.58 + Math.abs(vx) * .05;
    d += `L${P(vx, vy)}Q${P((vx + tips[i][0]) / 2 + .02 * Math.sign(-tips[i][0] || 1), (vy + tips[i][1]) / 2 - .06)} ${P(...tips[i])}`;
  }
  return d + `C${P(.88, -.6)} ${P(.98, -.24)} ${P(1, .24)}C${P(1.03, .72)} ${P(.5, 1)} ${P(0, 1.06)}Z`;
}
const CHARS = {
  faisca: {
    kind: 'faisca', ...STAGES.faisca,
    top: 95, shoulders: 16,
    behaviors: ['boxe', 'polichinelo', 'look', 'look', 'fidget', 'danca'],
    specials: ['boxe', 'polichinelo'],
    head(id) {
      return `
      <use class="hq" href="#o${id}" fill="${this.glow}" opacity=".35" filter="url(#f${id})"/>
      <use href="#o${id}" fill="${this.flat[0]}" stroke="${this.flat[0]}" stroke-width="3" stroke-linejoin="round"/>
      ${flat(id, this.flat[0], this.flat[1])}`;
    },
    frame(s, t, r) {
      const k = s.flare.a * (1 + clamp(s.vy * .0007, -.25, .35)) * (s.sleeping ? .82 : 1);
      const sway = clamp(-s.yaw.v * .35 - s.rot.v * .02 - s.vx * .0015, -.8, .8);
      r.o.setAttribute('d', flame(this.R, k * this.tongues[0].h / 54, t * s.speed, s.M, sway, 5.4));
      if (s.big && Math.random() < .05 * this.embers * s.speed) s.emit(this.particle, s.x + (Math.random() - .5) * 40, s.y + this.headY - 40 - Math.random() * 30 * k);
    },
  },
  gota: {
    kind: 'gota',
    R: 42, top: 80, headY: -44, shoulders: 16,
    body: ['#A6DBFF', '#14B8E6'], belly: '#DDF3FF', limb: '#0A93C4', limbHi: '#8FE9F8', foot: '#07759E', ol: '#065E80',
    face: { ey: 9, my: 27, ex: 17, ink: '#03344A', cheek: '#F9A8D4' },
    behaviors: ['gotinha', 'balanco', 'look', 'look', 'fidget', 'danca'],
    specials: ['gotinha', 'balanco'],
    // água de verdade: corpo ciano com superfície ondulando dentro e brilho branco, longe do azul da Forja
    head: id => `
      <use href="#o${id}" fill="#8FE9F8"/>
      <g clip-path="url(#cl${id})">
        <path data-r="wave" fill="#14B8E6"/>
        <path data-r="wave2" fill="#0A93C4" opacity=".55"/>
      </g>
      <path d="M-27 -2Q-30 -16 -20 -27" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".9"/>
      <circle cx="-28" cy="8" r="2.6" fill="#fff" opacity=".9"/>
      <g data-r="drip"><path d="M0 -9Q6 -1 6 3A6 6 0 0 1 -6 3Q-6 -1 0 -9Z" fill="#14B8E6"/></g>`,
    frame(s, t, r) {
      const j = s.jelly.a, k = s.flare.a * (1 + clamp(s.vy * .0006, -.2, .3));
      const wob = th => s.M * (.028 + j) * Math.sin(3 * th + t * 2.4 * s.speed) + s.M * (.016 + j * .6) * Math.sin(5 * th - t * 3.3);
      r.o.setAttribute('d', blob(this.R, [{ a: .3, w: .8, h: 34 * k, curl: -15 }], wob, clamp(-s.yaw.v * .35 - s.rot.v * .02 - s.vx * .0015, -.8, .8)));
      // a água balança contra o movimento do corpo, como num copo
      const tilt = clamp(s.vx * .02 + s.rot.a * .9 + s.yaw.a * 14, -16, 16), lvl = -12 + clamp(s.vy * .008, -6, 6);
      const surf = (amp, ph, dy) => {
        let d = `M-70 ${f1(lvl + dy + tilt)}`;
        for (let x = -70; x <= 70; x += 10) d += `L${x} ${f1(lvl + dy - tilt * x / 70 + amp * Math.sin(x / 11 + t * 3.2 * s.speed + ph) * (s.M || .4))}`;
        return d + 'L70 90L-70 90Z';
      };
      r.wave.setAttribute('d', surf(2.6, 0, 0)); r.wave2.setAttribute('d', surf(2, 2.4, 16));
      let dx = 34 + Math.sin(t * 1.3) * 3, dy = -62 + Math.sin(t * 2.1) * 5 * s.M - s.vy * .01, op = 1;
      if (s.drip) { dx = s.drip.x; dy = s.drip.y; op = s.drip.op; }
      r.drip.setAttribute('transform', `translate(${f1(dx)} ${f1(dy)})`); r.drip.setAttribute('opacity', op);
    },
  },
  // seixo liso e chapado, com musgo e uma rachadura (a versão facetada está em docs/reference/mascots-v1)
  pedra: {
    kind: 'pedra',
    R: 46, top: 60, headY: -46, shoulders: 17,
    body: ['#A9B4B0', '#66716F'], belly: '#C8D1CD', limb: '#5E6967', limbHi: '#B9C3BF', foot: '#4A5452', ol: '#3D4644', hw: 9,
    face: { ey: 9, my: 27, ex: 18, ink: '#1F2624', cheek: '#FF9A8A' },
    behaviors: ['rosca', 'flex', 'look', 'look', 'fidget', 'danca'],
    specials: ['rosca', 'flex'],
    head: id => `
      <use href="#o${id}" fill="#8E9A96"/>
      ${flat(id, '#8E9A96', '#6A7572')}
      <g clip-path="url(#cl${id})"><path data-r="moss" fill="#4FB862"/><path data-r="moss2" fill="#3E9E50"/></g>
      <path d="M26 -14l-6 8 4 5-5 7" stroke="#55605D" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <g data-r="sprout" transform="translate(0 -40)">
        <path d="M0 0Q-1 -8 1 -14" stroke="#3E9E50" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path data-r="leafL" d="M1 -12Q-10 -22 -18 -14Q-9 -8 1 -12Z" fill="#5BC86B"/><path d="M1 -12Q-9 -16 -16 -14" stroke="#3E9E50" stroke-width="1" fill="none" opacity=".6"/>
        <path data-r="leafR" d="M1 -14Q10 -27 20 -20Q11 -12 1 -14Z" fill="#7BDC86"/><path d="M1 -14Q10 -20 18 -20" stroke="#3E9E50" stroke-width="1" fill="none" opacity=".6"/>
      </g>`,
    frame(s, t, r) {
      const R = this.R, sq = s.M * .015 * Math.sin(t * 1.6);
      // seixo: superelipse achatada, um pouco mais larga embaixo
      const pts = [];
      for (let i = 0; i < 48; i++) {
        const a = i / 48 * TAU, c = Math.cos(a), sn = Math.sin(a), e = .86;
        const x = Math.sign(c) * Math.pow(Math.abs(c), e) * R * 1.08 * (1 + (sn > 0 ? .04 * sn : 0)), y = Math.sign(sn) * Math.pow(Math.abs(sn), e) * R * (.9 + sq);
        pts.push([x, y + 4]);
      }
      r.o.setAttribute('d', smooth(pts));
      // musgo: tampa irregular no topo que gira com o rosto
      const off = Math.sin(s.yaw.a) * R * .4, top = -R * .9 + 4;
      let m = `M${f1(-R * 1.2 + off)} -90`, m2 = m;
      for (let x = -60; x <= 60; x += 6) {
        const y = top + 12 + 5 * Math.sin(x * .35 + 1) + 3 * Math.sin(x * .9);
        m += `L${f1(x + off)} ${f1(y)}`; m2 += `L${f1(x + off)} ${f1(y - 6 + 2 * Math.sin(x * .5))}`;
      }
      r.moss.setAttribute('d', m + 'L70 -90Z'); r.moss2.setAttribute('d', m2 + 'L70 -90Z');
      s.leaf.T = clamp(-s.yaw.v * 18 - s.vx * .03 + s.vy * .01, -40, 40) + s.M * 4 * Math.sin(t * 1.7);
      r.sprout.setAttribute('transform', `translate(${f1(off * .6)} -40) rotate(${f1(s.leaf.a)})`);
    },
  },
};

/* ---------- montagem ---------- */
const SPR = ['sq', 'hy', 'rot', 'armL', 'armR', 'flare', 'jelly', 'yaw', 'pitch', 'liftL', 'liftR', 'dip', 'lean', 'stretch', 'spread', 'hsq', 'leaf', 'bendL', 'bendR'];
const insts = [];
function mount(el, kind, stage) {
  const C = kind === 'faisca' && stage ? { ...CHARS.faisca, ...STAGES[stage] } : CHARS[kind];
  const id = ++uid, big = el.clientWidth >= 110;
  still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.classList.add('m', kind);
  // estilo "nub" (Kirby/Slime Rancher): bracinhos e pés atrás da silhueta, só a ponta aparece
  const arm = side => `<g data-r="arm${side}"><ellipse rx="9.5" ry="8" fill="${C.limb}"/></g>`;
  const hand = side => `<g data-r="hand${side}">${side === 'R' ? `<g data-r="db" opacity="0"><rect x="-12" y="-1.5" width="24" height="3" rx="1.5" fill="#2B2E3A"/><rect x="-14" y="-6.5" width="5" height="13" rx="1.6" fill="#E5163E"/><rect x="9" y="-6.5" width="5" height="13" rx="1.6" fill="#E5163E"/></g>` : ''}</g>`;
  const foot = side => `<g data-r="foot${side}"><ellipse rx="11" ry="7.5" fill="${C.foot}"/></g>`;
  el.innerHTML = `<svg viewBox="-66 -168 132 176" role="img" aria-label="${kind}">
    <defs>
      <path id="o${id}"/>
      <clipPath id="cl${id}"><use href="#o${id}"/></clipPath>
      <radialGradient id="gn${id}" cx="62%" cy="38%" r="75%"><stop offset="0" stop-color="${C.limbHi}"/><stop offset=".55" stop-color="${C.limb}"/><stop offset="1" stop-color="${C.foot}"/></radialGradient>
      <radialGradient id="gf${id}" cx="50%" cy="20%" r="85%"><stop offset="0" stop-color="${C.limb}"/><stop offset="1" stop-color="${C.foot}"/></radialGradient>
      <linearGradient id="gb${id}" gradientUnits="userSpaceOnUse" x1="-10" y1="-50" x2="10" y2="4"><stop offset="0" stop-color="${C.body[0]}"/><stop offset="1" stop-color="${C.body[1]}"/></linearGradient>
      <linearGradient id="rim${id}" gradientUnits="userSpaceOnUse" x1="-50" y1="-60" x2="20" y2="30"><stop offset="0" stop-color="${C.rim ?? (C.kind === 'gota' ? '#E6F7FF' : '#FFF1B8')}"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="f${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="10"/></filter>
      <filter id="fb${id}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter>
      <filter id="fs${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
    </defs>
    <ellipse data-r="shadow" cx="0" cy="4" rx="30" ry="5.5" fill="#000" opacity=".4"/>
    <g data-r="root">
      <g data-r="legs">${foot('L')}${foot('R')}</g>
      <g data-r="body">
        <g data-r="back">${arm('L')}${arm('R')}</g>
        <g data-r="belly"></g>
        <g data-r="head">${C.head(id)}
          <g data-r="face"><g data-r="ckL"></g><g data-r="ckR"></g>
            <g data-r="eL"></g><g data-r="eR"></g><g data-r="mo"></g></g>
          <g data-r="marks"></g></g>
        <g data-r="front">${hand('L')}${hand('R')}</g>
      </g>
    </g><g data-r="fx"></g>
  </svg>`;
  const r = {}; el.querySelectorAll('[data-r]').forEach(n => r[n.dataset.r] = n);
  r.o = el.querySelector(`#o${id}`); r.svg = el.querySelector('svg');
  if (!big) el.querySelectorAll('.hq').forEach(n => n.remove());
  const s = { el, C, r, big, x: 0, y: 0, vx: 0, vy: 0, mood: '', exprKey: '', expr: 'neutro', tmp: null, tmpUntil: 0, tmpMarks: false, beExpr: null,
    blinkAt: 1 + Math.random() * 3, M: still ? 0 : 1, speed: 1, parts: [], acts: [], beh: null, far: '',
    nextBeh: performance.now() + 600 + Math.random() * 2400, cursorUntil: 0, cy: 0, cp: 0, lastTouch: performance.now(),
    hands: { L: [-20, -20], R: [20, -20] }, feet: { L: [-9, 0], R: [9, 0] }, drag: null, dizzyUntil: 0, talkUntil: 0, sleeping: false };
  SPR.forEach(k => s[k] = { a: 0, v: 0, T: 0 });
  s.flare.a = s.flare.T = 1; s.armL.a = s.armR.a = 62;
  s.emit = (type, x, y, vx, vy) => emit(s, type, x, y, vx, vy);
  C.init?.(s, r);
  insts.push(s); setExpr(s);
  return s;
}
function setExpr(s, now) {
  const temp = s.tmp && now < s.tmpUntil;
  let e = now < s.dizzyUntil ? 'tonto' : temp ? s.tmp : s.mood === 'sad' ? 'triste' : (s.beExpr || 'neutro');
  let [ek, mk] = EXPR[e];
  if (now < s.talkUntil) mk = Math.floor(now / 110) % 3 ? 'fala' : 'neutro';
  const showMarks = e === 'tonto' || (temp ? s.tmpMarks : s.mood === 'sad');
  const key = ek + mk + showMarks + e;
  if (key === s.exprKey) return;
  s.exprKey = key; s.expr = e; s.eyeKind = ek;
  const ink = s.C.face.ink;
  s.r.eL.innerHTML = EYE[ek](ink, 1); s.r.eR.innerHTML = EYE[ek](ink, -1); s.r.mo.innerHTML = MOUTH[mk](ink);
  s.r.marks.innerHTML = showMarks ? marks(e, s.C.R, s.C.top) : '';
  s.orbit = s.r.marks.querySelector('[data-orbit]');
}
const say = (s, e, ms, withMarks = true) => { s.tmp = e; s.tmpUntil = performance.now() + ms; s.tmpMarks = withMarks; };
const later = (s, ms, fn) => s.acts.push({ at: performance.now() + ms, fn });
const DUR = { boxe: 2.6, polichinelo: 2.4, look: 1.8, balanco: 3, gotinha: 2.8, rosca: 3.8, flex: 2.2, fidget: 1.8, danca: 3.4, acenar: 1.6, comemorar: 1.7, bravo: 1.8, cocegas: 1.1, carinho: 1.4, dormir: Infinity };
const startBeh = (s, name) => { s.beh = { name, start: performance.now(), dur: DUR[name] * (name === 'look' ? .8 + Math.random() * .6 : 1), hit: false, rep: -1 }; };
const wake = s => { s.lastTouch = performance.now(); if (s.sleeping) { s.sleeping = false; s.beh = null; say(s, 'surpreso', 700); jump(s, 380); } };

/* ---------- partículas ---------- */
const PART = {
  ember: { c: ['#FFE27A', '#FFB321', '#FF6A1F'], r: [1.2, 2.6], g: -60, life: 1.3 },
  violet: { c: ['#F3E2FF', '#D58BFF', '#A94DFF'], r: [1.2, 2.8], g: -60, life: 1.5 },
  blue: { c: ['#F0FBFF', '#9BE3FF', '#3FA9FF'], r: [1.2, 2.8], g: -60, life: 1.5 },
  spark: { c: ['#FFE38A', '#FFF4C2', '#FF8A3D'], r: [1.5, 3.2], g: 380, life: .9 },
  drop: { c: ['#9AD4FF', '#4F9BFF', '#EAF7FF'], r: [2.5, 4.5], g: 700, life: 1, drop: true },
  tear: { c: ['#8CC8FF'], r: [2.2, 2.8], g: 500, life: 1, drop: true },
  dust: { c: ['#3D3549', '#4A4158'], r: [3, 5.5], g: -20, life: .7, grow: true },
  sweat: { c: ['#BFE3FF'], r: [2, 2.6], g: 420, life: .8, drop: true },
  heart: { c: ['#FF6B9A', '#FF8FB1'], r: [4, 6], g: -70, life: 1.3, heart: true },
  note: { c: ['#FFE38A', '#FFF4C2'], r: [9, 12], g: -50, life: 1.4, text: '♪' },
  zzz: { c: ['#C9C2D6'], r: [8, 12], g: -25, life: 2, text: 'z', grow: true },
  leaf: { c: ['#5BC86B', '#7BDC86'], r: [3, 4], g: 120, life: 1.4, leaf: true },
};
function emit(s, type, x, y, vx = 0, vy = 0) {
  const P = PART[type], rad = P.r[0] + Math.random() * (P.r[1] - P.r[0]);
  let el;
  if (P.text) { el = document.createElementNS(NS, 'text'); el.textContent = P.text; el.setAttribute('font-size', rad); el.setAttribute('font-weight', '800'); el.setAttribute('text-anchor', 'middle'); }
  else if (P.heart) { el = document.createElementNS(NS, 'path'); el.setAttribute('d', `M0 ${rad * .9}C${-rad * 1.6} ${-rad * .2} ${-rad * .7} ${-rad * 1.3} 0 ${-rad * .4}C${rad * .7} ${-rad * 1.3} ${rad * 1.6} ${-rad * .2} 0 ${rad * .9}Z`); }
  else if (P.drop) { el = document.createElementNS(NS, 'path'); el.setAttribute('d', `M0 ${-rad * 1.7}Q${rad} 0 ${rad} ${rad * .4}A${rad} ${rad} 0 0 1 ${-rad} ${rad * .4}Q${-rad} 0 0 ${-rad * 1.7}Z`); }
  else if (P.leaf) { el = document.createElementNS(NS, 'path'); el.setAttribute('d', `M0 0Q${rad} ${-rad * 1.5} ${rad * 2.4} 0Q${rad} ${rad * .8} 0 0Z`); }
  else { el = document.createElementNS(NS, 'circle'); el.setAttribute('r', rad); }
  el.setAttribute('fill', P.c[Math.floor(Math.random() * P.c.length)]); s.r.fx.appendChild(el);
  const drift = type === 'ember' || type === 'violet' || type === 'blue' || type === 'heart' || type === 'note' || type === 'zzz';
  s.parts.push({ el, x, y, vx: vx + (drift ? (Math.random() - .5) * 18 : 0), vy: vy + (drift ? -25 - Math.random() * 25 : 0), g: P.g, life: P.life, t: 0, grow: P.grow, spin: P.leaf ? (Math.random() - .5) * 600 : 0 });
}
function burst(s, type, x, y, n, sp, up) {
  for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (Math.random() - .5) * sp, v = up * (.6 + Math.random() * .6); emit(s, type, x, y, Math.cos(a) * v, Math.sin(a) * v); }
}
const headPos = s => [s.x, s.y + s.C.headY];

/* ---------- ações ---------- */
function jump(s, power = 560) { if (still) return; s.sq.v -= 7; s.dip.v += 60; later(s, 110, () => { s.vy = -power; }); }
const ACTS = {
  pular(s) { say(s, 'feliz', 1000); jump(s); },
  acenar(s) { say(s, 'feliz', 1700); startBeh(s, 'acenar'); s.talkUntil = performance.now() + 1200; },
  comemorar(s) {
    say(s, 'animado', 1900); startBeh(s, 'comemorar'); jump(s, 600); later(s, 760, () => jump(s, 480));
    later(s, 250, () => { const [x, y] = headPos(s); burst(s, 'spark', x, y - 50, 16, 2.6, 260); if (s.C.kind === 'gota') burst(s, 'drop', x, y - 50, 8, 2.4, 220); if (s.C.kind === 'pedra') burst(s, 'leaf', x, y - 50, 6, 2.4, 200); });
  },
  bravo(s) {
    say(s, 'bravo', 2000); startBeh(s, 'bravo'); s.flare.T = s.C.kind === 'faisca' ? 1.45 : 1; s.jelly.T = s.C.kind === 'gota' ? .06 : 0;
    later(s, 1800, () => { s.flare.T = s.mood === 'sad' ? .55 : 1; s.jelly.T = 0; });
  },
  danca(s) { startBeh(s, 'danca'); },
  dormir(s) { s.sleeping = true; startBeh(s, 'dormir'); },
  triste(s) { s.mood = s.mood === 'sad' ? '' : 'sad'; s.el.classList.toggle('sad', s.mood === 'sad'); s.flare.T = s.mood === 'sad' ? .55 : 1; s.tmp = null; s.beh = null; s.sleeping = false; },
  cocegas(s) { say(s, 'feliz', 1100); startBeh(s, 'cocegas'); s.hsq.v += 3; },
  carinho(s) { say(s, 'feliz', 1500, false); startBeh(s, 'carinho'); },
};
for (const n of ['boxe', 'polichinelo', 'gotinha', 'balanco', 'rosca', 'flex']) ACTS[n] = s => startBeh(s, n);

/* ---------- comportamentos ---------- */
function behave(s, u, now) {
  const b = s.beh, n = b.name;
  s.beExpr = null;
  switch (n) {
    case 'look': s.yaw.T = b.yaw ??= (Math.random() - .5) * 1.1; s.pitch.T = b.pitch ??= (Math.random() - .6) * .4; if (b.pitch < -.15) s.beExpr = 'curioso'; break;
    case 'fidget': { // coça a cabeça
      s.armR.T = 150; s.bendR.T = -16; s.armR.T += Math.sin(u * 26) * 7; s.pitch.T = -.12; s.yaw.T = .2; s.rot.T += 5; s.beExpr = 'curioso';
      break;
    }
    case 'acenar': s.armR.T = 150 + 26 * Math.sin(u * 15); s.bendR.T = 8; s.yaw.T = -.25; s.rot.T += -6; break;
    case 'comemorar': s.armL.T = 160 + 10 * Math.sin(u * 12); s.armR.T = 160 + 10 * Math.sin(u * 12 + 1); break;
    case 'bravo': s.armL.T = -14; s.armR.T = -14; s.bendL.T = s.bendR.T = 10; s.angry = true; s.pitch.T = .15; s.stretch.T = .05; break;
    case 'cocegas': { const k = 1 - u / b.dur; s.rot.T += Math.sin(u * 40) * 9 * k; s.armL.T = 60 + 30 * Math.sin(u * 30); s.armR.T = 60 - 30 * Math.sin(u * 30); s.dip.T = Math.abs(Math.sin(u * 20)) * 4 * k; if (s.big && Math.random() < .08) s.emit('note', s.x + (Math.random() - .5) * 50, s.y - 150); break; }
    case 'carinho': s.rot.T += 8 * Math.sin(u * 3); s.pitch.T = .1; s.yaw.T = s.cy; s.dip.T = 2; if (s.big && Math.random() < .1) s.emit('heart', s.x + (Math.random() - .5) * 40, s.y - 140); break;
    case 'danca': { // ritmo: afunda no tempo, passinho, braços alternados, cabeça atrasada
      const beat = .42, k = Math.floor(u / beat), l = (u % beat) / beat, odd = k % 2;
      s.beExpr = 'feliz';
      s.dip.T = l < .3 ? 7 : 0; s.yaw.T = odd ? .35 : -.35; s.lean.T = odd ? 7 : -7;
      s.liftL.T = odd ? 6 * Math.sin(l * Math.PI) : 0; s.liftR.T = odd ? 0 : 6 * Math.sin(l * Math.PI);
      s.armL.T = odd ? 155 : 45; s.armR.T = odd ? 45 : 155; s.bendL.T = s.bendR.T = 10;
      if (k !== b.rep) { b.rep = k; if (s.big) s.emit('note', s.x + (odd ? 38 : -38), s.y - 140); }
      break;
    }
    case 'dormir': {
      s.beExpr = 'sono'; s.pitch.T = .25; s.rot.T += 7; s.armL.T = 45; s.armR.T = 45; s.dip.T = 3; s.speed = .35;
      if (s.big && Math.floor(u / 1.2) !== b.rep) { b.rep = Math.floor(u / 1.2); s.emit('zzz', s.x + 30, s.y - 150); }
      break;
    }
    case 'boxe': {
      s.beExpr = 'foco'; s.dip.T = Math.abs(Math.sin(u * 10)) * 4; s.yaw.T = .3 * Math.sin(u * 1.6);
      s.armL.T = 125; s.armR.T = 125; s.bendL.T = s.bendR.T = -14;
      const ph = Math.floor(u / .42), l = (u % .42) / .42;
      if (l < .38) { if (ph % 2) { s.armR.T = 78; s.bendR.T = 0; s.yaw.T = .35; } else { s.armL.T = 78; s.bendL.T = 0; s.yaw.T = -.35; } }
      s.liftL.T = Math.max(0, Math.sin(u * 10)) * 3; s.liftR.T = Math.max(0, -Math.sin(u * 10)) * 3;
      break;
    }
    case 'polichinelo': {
      const rep = Math.floor(u / .8), l = (u % .8) / .8;
      if (rep !== b.rep && rep < 3) { b.rep = rep; jump(s, 300); }
      const up = l < .5; s.beExpr = 'feliz';
      s.armL.T = up ? 168 : 10; s.armR.T = up ? 168 : 10; s.spread.T = up ? 7 : 0;
      break;
    }
    case 'balanco': {
      s.beExpr = 'feliz'; s.yaw.T = .45 * Math.sin(u * 2.6); s.lean.T = 6 * Math.sin(u * 2.6);
      s.dip.T = Math.abs(Math.sin(u * 5.2)) * 3; s.armL.T = 25 + 18 * Math.sin(u * 2.6); s.armR.T = 25 - 18 * Math.sin(u * 2.6);
      s.liftL.T = Math.max(0, Math.sin(u * 2.6)) * 4; s.liftR.T = Math.max(0, -Math.sin(u * 2.6)) * 4;
      break;
    }
    case 'gotinha': {
      const top = -s.C.R - 6;
      if (u < .7) { const k = u / .7; s.drip = { x: 34 * (1 - k), y: -62 - 20 * k, op: 1 }; s.pitch.T = -.35; s.yaw.T = .15 * (1 - k); s.beExpr = 'curioso'; }
      else if (!b.hit) {
        const f = u - .7, y = -82 + 600 * f * f;
        s.drip = { x: 0, y: Math.min(y, top), op: 1 }; s.pitch.T = -.25; s.beExpr = 'surpreso';
        if (y >= top) { b.hit = true; s.hsq.v -= 5; s.jelly.a = .08; burst(s, 'drop', s.x, s.y + s.C.headY + top, 7, 2.2, 150); say(s, 'feliz', 1300); }
      } else { s.drip = { x: 34, y: -62, op: clamp((u - 1.7) / .6, 0, 1) }; }
      break;
    }
    case 'rosca': {
      s.r.db.setAttribute('opacity', 1);
      const rep = Math.floor(u / 1.2), l = (u % 1.2) / 1.2;
      const curl = l < .3 ? Math.sin(l / .3 * Math.PI / 2) : l < .42 ? 1 : 1 - (l - .42) / .58;
      s.armR.T = 15 + 40 * curl; s.bendR.T = -26 * curl; s.armL.T = 12;
      s.beExpr = l < .5 ? 'esforco' : 'foco'; s.yaw.T = .18; s.dip.T = 2.5 * curl;
      if (rep !== b.rep) { b.rep = rep; if (rep > 0 && s.big) emit(s, 'sweat', s.x + 34, s.y - 120, 30, -60); }
      break;
    }
    case 'flex': { // pose de muque
      const k = clamp(u / .3, 0, 1);
      s.armL.T = 12 + 108 * k; s.armR.T = 12 + 108 * k; s.bendL.T = s.bendR.T = -22 * k;
      s.beExpr = u < .3 ? 'esforco' : 'animado'; s.stretch.T = .04 * k; s.dip.T = 3 * k;
      if (u > .3 && b.rep < 0) { b.rep = 0; s.sq.v += 3; if (s.big) { burst(s, 'spark', s.x - 34, s.y - 70, 5, 1.4, 120); burst(s, 'spark', s.x + 34, s.y - 70, 5, 1.4, 120); } }
      break;
    }
  }
  if (u >= b.dur) {
    if (n === 'rosca') { s.r.db.setAttribute('opacity', 0); say(s, 'feliz', 900, false); }
    s.beh = null; s.beExpr = null; s.drip = null;
    s.nextBeh = now + 1500 + Math.random() * 2500;
  }
}

/* ---------- loop ---------- */
function spring(o, k, d, dt) { o.v += (-(o.a - o.T) * k - o.v * d) * dt; o.a += o.v * dt; }
const T = (el, v) => el.setAttribute('transform', v);
const hose = (a, b, bend) => { // membro "nub": curva que dobra pra fora
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
  return `M${f1(a[0])} ${f1(a[1])}Q${f1(mx - dy / l * bend)} ${f1(my + dx / l * bend)} ${f1(b[0])} ${f1(b[1])}`;
};
let last = performance.now(), raf = 0;
function tick(now) {
  const dt = Math.min(.033, (now - last) / 1000), t = now / 1000; last = now;
  for (const s of insts) {
    const { r, C } = s;
    s.acts = s.acts.filter(a => (now >= a.at ? (a.fn(), false) : true));
    const sad = s.mood === 'sad', dragging = !!s.drag;
    s.angry = false; s.speed = 1;

    // pose base: respirando, braços balançando
    const swing = s.M * 3 * Math.sin(t * 1.8);
    s.armL.T = 62 + swing; s.armR.T = 62 - swing;
    for (const k of ['liftL', 'liftR', 'dip', 'lean', 'stretch', 'spread', 'bendL', 'bendR']) s[k].T = 0;
    s.bendL.T = s.bendR.T = 4;
    s.yaw.T = 0; s.pitch.T = 0; s.rot.T = s.M * 1.8 * Math.sin(t * 1.3);
    if (now < s.cursorUntil && (!s.beh || s.beh.name === 'look')) { s.yaw.T = s.cy; s.pitch.T = s.cp; }

    if (!sad && !s.beh && !dragging && s.M && now > s.nextBeh && now > s.dizzyUntil) {
      if (s.big && now - s.lastTouch > 40000) { ACTS.dormir(s); }
      else { const L = C.behaviors, n = L[Math.floor(Math.random() * L.length)]; startBeh(s, n); }
    }
    if (s.beh && !dragging) behave(s, (now - s.beh.start) / 1000, now);
    if (sad) { s.armL.T = 35; s.armR.T = 35; s.pitch.T = .3; s.yaw.T = -.15; s.rot.T = 4; s.dip.T = 3; s.speed = .5; }
    if (s.angry) s.speed = 1.8;
    if (now < s.dizzyUntil) { s.rot.T = Math.sin(t * 5) * 9; s.yaw.T = Math.sin(t * 3) * .3; s.armL.T = 40; s.armR.T = 40; }
    setExpr(s, now);

    // física: arrastar, voar, quicar
    if (dragging) {
      const d = s.drag;
      const nx = d.px - d.ox, ny = Math.min(0, d.py - d.oy);
      s.vx = lerp(s.vx, (nx - s.x) / Math.max(dt, .001), .35); s.vy = lerp(s.vy, (ny - s.y) / Math.max(dt, .001), .35);
      s.x = nx; s.y = ny;
      s.armL.T = 150 + 15 * Math.sin(t * 9); s.armR.T = 150 + 15 * Math.sin(t * 9 + 2);
    } else if (s.y < 0 || s.vy < 0) {
      s.vy += 2600 * dt; s.y += s.vy * dt; s.x += s.vx * dt;
      if (s.y >= 0) {
        const hit = s.vy;
        s.y = 0; s.sq.v -= hit * .011; s.hsq.v -= hit * .006;
        if (hit > 380) { s.vy = -hit * .42; s.vx *= .7; if (s.big) { burst(s, 'dust', s.x - 20, 0, 3, 1.2, 50); burst(s, 'dust', s.x + 20, 0, 3, 1.2, 50); } }
        else s.vy = 0;
        if (hit > 1000) { s.dizzyUntil = now + 1700; s.beh = null; }
      }
    } else { s.x += s.vx * dt; s.vx *= Math.pow(.002, dt); if (Math.abs(s.x) > .2) s.x *= Math.pow(.25, dt); }
    if (Math.abs(s.x) > 40) { s.x = Math.sign(s.x) * 40; s.vx *= -.5; }
    const airborne = s.y < -.5 || dragging;

    spring(s.sq, 320, 13, dt); spring(s.hsq, 260, 9, dt);
    if (airborne && !dragging) { s.armL.T += 35; s.armR.T += 35; }
    for (const k of ['armL', 'armR']) spring(s[k], 190, 12, dt);
    for (const k of ['liftL', 'liftR', 'dip', 'spread', 'bendL', 'bendR']) spring(s[k], 240, 15, dt);
    spring(s.yaw, 70, 11, dt); spring(s.pitch, 70, 11, dt); spring(s.lean, 90, 11, dt); spring(s.stretch, 80, 10, dt);
    spring(s.rot, 120, 10, dt); spring(s.flare, 90, 12, dt); spring(s.jelly, 60, 6, dt); spring(s.leaf, 70, 4, dt);
    s.hy.T = clamp(s.vy * .022, -9, 9) + (sad ? 5 : 0); spring(s.hy, 260, 15, dt);

    // squash/stretch + smear na direção da velocidade
    const speed = Math.hypot(s.vx, s.vy), smear = airborne ? clamp(speed / 1600, 0, .32) : 0;
    let sy = (1 + s.sq.a + s.stretch.a) * (1 + s.M * (s.sleeping ? .045 : .02) * Math.sin(t * 2.4 * (s.sleeping ? .4 : s.speed)));
    const sx = 1 - (sy - 1) * .7, yaw = s.yaw.a, pitch = s.pitch.a;
    const shakeX = s.angry && s.M ? Math.sin(t * 70) * 1.5 : 0;
    const ang = Math.atan2(s.vy, s.vx) * 180 / Math.PI - 90;
    T(r.root, `translate(${f2(s.x + shakeX)} ${f2(s.y)}) translate(0 -60) rotate(${f1(ang)}) scale(${f3(1 - smear * .45)} ${f3(1 + smear)}) rotate(${f1(-ang)}) translate(0 60)`);
    const bodyY = s.dip.a;
    T(r.body, `translate(0 ${f2(bodyY)}) rotate(${f2(s.lean.a)}) scale(${f3(sx)} ${f3(sy)})`);

    // pés: dois "feijões" sob o corpo; no ar ficam pendurados
    const cy = Math.cos(yaw);
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? -1 : 1;
      const ft = airborne ? [sg * 12 * cy + yaw * 4, 5] : [sg * (13 + s.spread.a) * cy + yaw * 4, -4 - s['lift' + side].a];
      const fp = s.feet[side]; fp[0] = lerp(fp[0], ft[0], airborne ? .25 : .5); fp[1] = lerp(fp[1], ft[1], airborne ? .25 : .5);
      T(r['foot' + side], `translate(${f1(fp[0])} ${f1(fp[1] + bodyY * .3)}) rotate(${f1(sg * (8 + s['lift' + side].a * 2))})`);
    }

    // cabeça: atraso + squash próprio
    const hs = yaw * 5, hq = s.hsq.a;
    T(r.head, `translate(${f2(hs)} ${f2(C.headY + s.hy.a * .4 + pitch * 4)}) rotate(${f2(s.rot.a)}) translate(0 ${C.R}) scale(${f3(1 - hq * .7)} ${f3(1 + hq)}) translate(0 ${-C.R})`);
    T(r.belly, `translate(${f2(yaw * 7)} 0)`);

    // bracinhos nub: deslizam pela borda do corpo seguindo o ângulo, com atraso
    for (const side of ['L', 'R']) {
      const sg = side === 'L' ? -1 : 1, deg = s['arm' + side].a, a = deg * Math.PI / 180;
      const rr = C.R * .95 + 3 + clamp((deg - 80) / 70, 0, 1) * (C.reach || 6), d = [sg * Math.sin(a), Math.cos(a)];
      const H = [hs + d[0] * rr, C.headY + d[1] * rr];
      const hp = s.hands[side]; hp[0] = lerp(hp[0], H[0], .32); hp[1] = lerp(hp[1], H[1], .32);
      T(r['arm' + side], `translate(${f1(hp[0])} ${f1(hp[1])}) rotate(${f1(Math.atan2(d[1], d[0]) * 180 / Math.PI)})`);
      T(r['hand' + side], `translate(${f1(hp[0] + d[0] * 6)} ${f1(hp[1] + d[1] * 6)})`);
    }
    const h = clamp(1 + s.y / 220, .4, 1);
    T(r.shadow, `translate(${f1(s.x)} 0) scale(${f3(h)} 1)`); r.shadow.setAttribute('opacity', f2(.4 * h));
    C.frame(s, t, r);
    if (r.spec) T(r.spec, `translate(${f2(-yaw * 12)} ${f2(-pitch * 8)})`);
    if (r.lit) T(r.lit, `translate(${f2(-6 - yaw * 9)} ${f2(-5 - pitch * 5)})`); // a luz chapada acompanha o giro
    if (s.orbit) T(s.orbit, `translate(0 ${-C.R - 4}) scale(1 .35) rotate(${f1(t * 360)})`);

    // rosto na esfera: gira com yaw/pitch
    if (t > s.blinkAt) { s.blinkStart = t; s.blinkAt = t + 2.2 + Math.random() * 3.5; }
    const bt = t - (s.blinkStart || -9), blink = BLINKS.has(s.eyeKind) && bt < .16 ? 1 - Math.sin(bt / .16 * Math.PI) * .92 : 1;
    const F = C.face, R = C.R;
    const place = (el, base, y, by = 1) => {
      const a = Math.asin(clamp(base / R, -.95, .95)) + yaw, x = R * Math.sin(a), fx = Math.max(.12, Math.cos(a));
      T(el, `translate(${f2(x)} ${f2(y + Math.sin(pitch) * R * .55)}) scale(${f3(fx)} ${f3(by)})`);
    };
    place(r.eL, -F.ex, F.ey, blink); place(r.eR, F.ex, F.ey, blink); place(r.mo, 0, F.my);
    place(r.ckL, -F.ex - 10, F.ey + 10); place(r.ckR, F.ex + 10, F.ey + 10);

    if (sad && s.M && Math.random() < .012) emit(s, 'tear', s.x - F.ex - 2, s.y + C.headY + F.ey + 8 + s.hy.a);

    s.parts = s.parts.filter(p => {
      p.t += dt; if (p.t > p.life) { p.el.remove(); return false; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .985;
      const k = 1 - p.t / p.life;
      T(p.el, `translate(${f1(p.x)} ${f1(p.y)}) rotate(${f1(p.spin * p.t)}) scale(${f2(p.grow ? 1 + p.t * .8 : .4 + k * .6)})`);
      p.el.setAttribute('opacity', f2(Math.min(1, k * 1.6)));
      return true;
    });
  }
  raf = insts.length ? requestAnimationFrame(tick) : 0;
}

/* ---------- interação: toque = cócegas, arrastar = arremessar, esfregar = carinho ---------- */
const toSvg = (s, e) => { const b = s.r.svg.getBoundingClientRect(), k = 132 / b.width; return [(e.clientX - b.left) * k - 66, (e.clientY - b.top) * k - 168]; };
function attach(s) {
  const el = s.el;
  let down = null, rub = 0, rubT = 0;
  const onDown = e => {
    e.stopPropagation(); wake(s);
    const [px, py] = toSvg(s, e); down = { t: performance.now(), px, py, moved: 0 };
    if (s.big && s.interactive && !still) { el.setPointerCapture?.(e.pointerId); s.drag = null; down.ox = px - s.x; down.oy = py - s.y; }
  };
  const onMove = e => {
    const [px, py] = toSvg(s, e);
    if (down) {
      down.moved = Math.max(down.moved, Math.hypot(px - down.px, py - down.py));
      if (s.big && s.interactive && down.moved > 6) {
        if (!s.drag) { s.drag = { ox: down.ox, oy: down.oy }; s.beh = null; say(s, 'surpreso', 99999); if (s.mood === 'sad') ACTS.triste(s); }
        s.drag.px = px; s.drag.py = py;
      }
    } else if (s.big && e.pointerType === 'mouse') { // esfregar com o mouse = carinho
      const now = performance.now(); if (now - rubT > 400) rub = 0; rubT = now;
      rub += Math.hypot(e.movementX, e.movementY);
      if (rub > 260 && (!s.beh || s.beh.name !== 'carinho')) { rub = 0; wake(s); ACTS.carinho(s); }
    }
  };
  const onUp = () => {
    if (!down) return;
    if (s.drag) { s.drag = null; s.tmp = null; s.vx = clamp(s.vx, -900, 900); s.vy = clamp(s.vy, -1400, 600); if (s.y > -2 && s.vy >= 0) s.vy = -1; }
    else if (down.moved < 6) cheerUp(s, () => ACTS.cocegas(s));
    down = null;
  };
  el.addEventListener('pointerdown', onDown); el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp); el.addEventListener('pointercancel', onUp);
  return () => {
    el.removeEventListener('pointerdown', onDown); el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp); el.removeEventListener('pointercancel', onUp);
  };
}

// brincar com um mascote triste anima ele por um tempo; depois o humor real (do app) volta
function cheerUp(s, fn) {
  if (s.mood === 'sad') ACTS.triste(s);
  fn();
  if (s.wantSad) later(s, 4000, () => { if (s.wantSad && s.mood !== 'sad') ACTS.triste(s); });
}

// os mascotes acompanham o cursor com o olhar
let following = false;
function follow() {
  if (following) return; following = true;
  addEventListener('pointermove', e => {
    const now = performance.now();
    for (const s of insts) {
      const b = s.el.getBoundingClientRect(), dx = e.clientX - (b.left + b.width / 2), dy = e.clientY - (b.top + b.height * .4);
      if (Math.hypot(dx, dy) > 700) continue;
      s.cy = clamp(dx / 350, -.6, .6); s.cp = clamp(dy / 500, -.3, .3); s.cursorUntil = now + 1500;
    }
  });
}

/**
 * Monta um mascote dentro de `el` e devolve o controle dele.
 * kind: 'faisca' | 'gota' | 'pedra'; stage (só Faísca): 'faisca' | 'chama' | 'fogueira' | 'forja'.
 */
export function mountMascot(el, kind, opts = {}) {
  let s, detach;
  const start = stage => {
    s = mount(el, kind, stage);
    s.interactive = opts.interactive !== false;
    s.wantSad = false;
    detach = attach(s);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); }
  };
  const stop = () => {
    detach();
    insts.splice(insts.indexOf(s), 1);
    el.innerHTML = ''; el.classList.remove('m', kind, 'sad');
  };
  start(opts.stage);
  follow();
  const h = {
    act(name) {
      if (name !== 'dormir') wake(s); else s.lastTouch = performance.now();
      cheerUp(s, () => ACTS[name](s));
    },
    say(ms = 1800) { s.talkUntil = performance.now() + ms; },
    setMood(m) { s.wantSad = m === 'sad'; if ((s.mood === 'sad') !== s.wantSad) ACTS.triste(s); },
    setStage(st) { const sad = s.wantSad; stop(); start(st); if (sad) h.setMood('sad'); },
    destroy: stop,
  };
  return h;
}

export const activeMascotCount = () => insts.length;
