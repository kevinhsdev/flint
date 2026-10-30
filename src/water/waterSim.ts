// Portado do mockup aprovado. Técnica de "água dinâmica 2D" (molas acopladas, usada em jogos):
// cada ponto da superfície é uma mola; ondas se propagam pros vizinhos.
export interface WaterSim { setLevel(f: number): void; splash(): void; destroy(): void }

const N = 40, K = .03, D = .04, SPREAD = .22;
interface Bubble { x: number; y: number; r: number; s: number; p: number }
const spawn = (any = false): Bubble => ({ x: Math.random(), y: any ? Math.random() : 1.05, r: .8 + Math.random() * 2.2, s: .0015 + Math.random() * .003, p: Math.random() * 6 });

export function createWaterSim(cv: HTMLCanvasElement, initial: number): WaterSim {
  const ctx = cv.getContext('2d');
  if (!ctx) return { setLevel() {}, splash() {}, destroy() {} };
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const h = new Float32Array(N), v = new Float32Array(N), L = new Float32Array(N), R = new Float32Array(N);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bubbles = Array.from({ length: 14 }, () => spawn(true));
  let W = 0, H = 0, target = Math.min(.96, initial), level = still ? target : 0, t = 0, raf = 0, visible = true;

  const size = () => { W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  const surface = (i: number, phase: number) => {
    const x = i / (N - 1) * W;
    return H * (1 - level) + h[i] + Math.sin(x * .045 + t * 1.7 + phase) * 1.8 + Math.sin(x * .11 - t * 1.2 + phase) * .9;
  };
  const path = (phase: number) => {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let i = 0; i < N; i++) ctx.lineTo(i / (N - 1) * W, surface(i, phase));
    ctx.lineTo(W, H); ctx.closePath();
  };

  function frame() {
    raf = 0;
    t += 1 / 60; level += (target - level) * .045;
    for (let i = 0; i < N; i++) { v[i] += -K * h[i] - D * v[i]; h[i] += v[i]; }
    for (let p = 0; p < 6; p++) {
      for (let i = 0; i < N; i++) {
        if (i > 0) { L[i] = SPREAD * (h[i] - h[i - 1]); v[i - 1] += L[i]; }
        if (i < N - 1) { R[i] = SPREAD * (h[i] - h[i + 1]); v[i + 1] += R[i]; }
      }
      for (let i = 0; i < N; i++) { if (i > 0) h[i - 1] += L[i]; if (i < N - 1) h[i + 1] += R[i]; }
    }
    ctx!.clearRect(0, 0, W, H);
    const top = H * (1 - level);

    // camada de trás (profundidade, levemente fora de fase)
    path(2.2); ctx!.fillStyle = 'rgba(40,90,210,.45)'; ctx!.fill();

    // corpo
    path(0);
    const g = ctx!.createLinearGradient(0, top - 6, 0, H);
    g.addColorStop(0, '#6FA8FF'); g.addColorStop(.25, '#3B82F6'); g.addColorStop(1, '#13306F');
    ctx!.fillStyle = g; ctx!.fill();

    ctx!.save(); ctx!.clip();
    // cáusticas: manchas de luz suaves
    ctx!.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) {
      const cx = (Math.sin(t * .35 + k * 1.7) * .5 + .5) * W, cy = top + 14 + k * 18 + Math.sin(t * .6 + k) * 6;
      const rg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, 34);
      rg.addColorStop(0, 'rgba(160,205,255,.16)'); rg.addColorStop(1, 'rgba(160,205,255,0)');
      ctx!.fillStyle = rg; ctx!.fillRect(cx - 34, cy - 34, 68, 68);
    }
    ctx!.globalCompositeOperation = 'source-over';
    // bolhas
    for (const b of bubbles) {
      b.y -= b.s; const bx = (b.x + Math.sin(t * 2 + b.p) * .012) * W, by = b.y * H;
      if (by < top + 3) { Object.assign(b, spawn()); continue; }
      ctx!.beginPath(); ctx!.arc(bx, by, b.r, 0, 7);
      ctx!.fillStyle = 'rgba(255,255,255,.12)'; ctx!.fill();
      ctx!.strokeStyle = 'rgba(255,255,255,.35)'; ctx!.lineWidth = .8; ctx!.stroke();
    }
    while (bubbles.length > 22) bubbles.shift();
    ctx!.restore();

    // brilho do menisco
    ctx!.beginPath();
    for (let i = 0; i < N; i++) ctx!.lineTo(i / (N - 1) * W, surface(i, 0) + 1);
    ctx!.strokeStyle = 'rgba(220,235,255,.75)'; ctx!.lineWidth = 1.5; ctx!.stroke();
    ctx!.strokeStyle = 'rgba(200,225,255,.12)'; ctx!.lineWidth = 9; ctx!.stroke();

    if (!still && visible) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  const redraw = () => { size(); kick(); };

  size(); addEventListener('resize', redraw);
  // fora da tela não gasta bateria
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); });
  io.observe(cv);
  kick();

  return {
    setLevel(f) { target = Math.min(.96, Math.max(0, f)); if (still) level = target; kick(); },
    splash() {
      const i = Math.floor(N * (.3 + Math.random() * .4));
      for (let j = -2; j <= 2; j++) if (i + j >= 0 && i + j < N) v[i + j] += 7 - Math.abs(j) * 2;
      for (let j = 0; j < 8; j++) { const b = spawn(); b.x = i / N + (Math.random() - .5) * .2; b.y = 1 - target + .08 + Math.random() * .15; bubbles.push(b); }
      kick();
    },
    destroy() { cancelAnimationFrame(raf); raf = 0; io.disconnect(); removeEventListener('resize', redraw); },
  };
}
