import { MUSCLE_NAMES } from '../domain/exercises';
import type { StageId } from '../domain/rules';
import type { PR } from '../domain/strength';
import type { Wrapped } from '../domain/wrapped';
import { mountMascot, type MascotKind } from '../mascots/engine';
import { fmtNum } from '../ui/NumberField';

/* Imagens 1080×1920 para os Stories, desenhadas em canvas (funciona offline). */

const W = 1080, H = 1920;
const FONT = '"Archivo Variable", system-ui, sans-serif';
const CRIMSON = '#E5163E', YELLOW = '#FFD43B', SOFT = 'rgba(255,255,255,.78)';

const loadImg = (src: string) => new Promise<HTMLImageElement>((ok, fail) => {
  const img = new Image(); img.onload = () => ok(img); img.onerror = fail; img.src = src;
});
const frame = () => new Promise(r => requestAnimationFrame(r));

/** Monta o mascote fora da tela, espera um quadro da animação e devolve o SVG como imagem. */
async function mascotImage(kind: MascotKind, stage: StageId | undefined, px: number) {
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-9999px;top:0;width:${px}px;height:${px}px`;
  document.body.append(host);
  const h = mountMascot(host, kind, { stage, interactive: false });
  await frame(); await frame();
  const svg = host.querySelector('svg')!.cloneNode(true) as SVGSVGElement;
  h.destroy(); host.remove();
  svg.setAttribute('width', String(px)); svg.setAttribute('height', String(px));
  return loadImg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`);
}

async function canvas() {
  await Promise.all([document.fonts.load(`900 100px ${FONT}`), document.fonts.load(`700 40px ${FONT}`)]).catch(() => {});
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const ctx = c.getContext('2d')!;
  // bloco vermelho, como a tela de fim do treino, com uma sombra leve embaixo
  ctx.fillStyle = CRIMSON; ctx.fillRect(0, 0, W, H);
  const g = ctx.createLinearGradient(0, H * 0.55, 0, H);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  return { c, ctx };
}

type Ctx = CanvasRenderingContext2D;
function text(ctx: Ctx, s: string, y: number, size: number, { weight = 900, color = '#fff', wide = false, spacing = 0 } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fontStretch = wide ? 'expanded' : 'normal';
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillStyle = color;
  ctx.fillText(s, W / 2, y, W - 120);
}

/** Quebra em até 2 linhas que caibam na largura. */
function lines(ctx: Ctx, s: string, size: number, max = W - 160) {
  ctx.font = `800 ${size}px ${FONT}`;
  const out = [''];
  for (const word of s.split(' ')) {
    const t = out.at(-1) ? `${out.at(-1)} ${word}` : word;
    if (ctx.measureText(t).width > max && out.at(-1)) out.push(word); else out[out.length - 1] = t;
  }
  return out.slice(0, 2);
}

async function footer(ctx: Ctx) {
  const logo = await loadImg(`${import.meta.env.BASE_URL}favicon.svg`).catch(() => null);
  ctx.font = `900 54px ${FONT}`; ctx.fontStretch = 'expanded'; ctx.letterSpacing = '0px';
  const label = 'Flint', tw = ctx.measureText(label).width, size = 72, gap = 18, x = (W - size - gap - tw) / 2;
  if (logo) {
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(x - 8, H - 204, size + 16, size + 16, 22); ctx.fill();
    ctx.drawImage(logo, x + 6, H - 190, size - 12, size - 12);
  }
  ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(label, x + size + gap, H - 140);
  ctx.textAlign = 'center';
}

const toPng = (c: HTMLCanvasElement) => new Promise<Blob>((ok, fail) => c.toBlob(b => (b ? ok(b) : fail(new Error('canvas vazio'))), 'image/png'));

export async function prCard(pr: PR, exerciseName: string, stage: StageId): Promise<Blob> {
  const { c, ctx } = await canvas();
  text(ctx, 'NOVO RECORDE', 250, 44, { weight: 800, color: YELLOW, spacing: 10 });
  ctx.drawImage(await mascotImage('faisca', stage, 640), (W - 640) / 2, 330, 640, 640);
  lines(ctx, exerciseName, 76).forEach((l, i) => text(ctx, l, 1130 + i * 92, 76, { weight: 800 }));
  text(ctx, `${fmtNum(pr.kg)} kg`, 1440, 200, { wide: true });
  text(ctx, `× ${pr.reps} ${pr.reps === 1 ? 'repetição' : 'repetições'}`, 1540, 64, { weight: 700, color: SOFT });
  text(ctx, new Date(pr.at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }), 1620, 40, { weight: 600, color: SOFT });
  await footer(ctx);
  return toPng(c);
}

export async function wrappedCard(w: Wrapped, monthLabel: string, stage: StageId = 'faisca'): Promise<Blob> {
  const { c, ctx } = await canvas();
  text(ctx, 'MINHA RETROSPECTIVA', 230, 42, { weight: 800, color: YELLOW, spacing: 10 });
  text(ctx, monthLabel[0].toUpperCase() + monthLabel.slice(1), 380, 150, { wide: true });
  ctx.drawImage(await mascotImage('faisca', stage, 560), (W - 560) / 2, 380, 560, 560);
  const tiles: [string, string][] = [
    [String(w.workouts), w.workouts === 1 ? 'treino' : 'treinos'],
    [w.volumeKg >= 1000 ? `${fmtNum(Math.round(w.volumeKg / 100) / 10)} t` : `${fmtNum(w.volumeKg)} kg`, 'levantados'],
    [String(w.prs.length), w.prs.length === 1 ? 'recorde' : 'recordes'],
    [String(w.bestStreakDays), 'treinos seguidos'],
    [String(w.waterGoalDays), 'dias na meta de água'],
    [w.topMuscle ? MUSCLE_NAMES[w.topMuscle] : '—', 'mais treinado'],
  ];
  const tw = 440, th = 200, gx = 40, x0 = (W - 2 * tw - gx) / 2;
  tiles.forEach(([big, small], i) => {
    const x = x0 + (i % 2) * (tw + gx), y = 920 + Math.floor(i / 2) * (th + 32);
    ctx.fillStyle = 'rgba(255,255,255,.16)';
    ctx.beginPath(); ctx.roundRect(x, y, tw, th, 36); ctx.fill();
    ctx.textAlign = 'left';
    ctx.font = `900 ${big.length > 7 ? 64 : 88}px ${FONT}`; ctx.fontStretch = 'expanded'; ctx.letterSpacing = '0px'; ctx.fillStyle = '#fff';
    ctx.fillText(big, x + 36, y + 112, tw - 72);
    ctx.font = `700 32px ${FONT}`; ctx.fontStretch = 'normal'; ctx.fillStyle = SOFT;
    ctx.fillText(small, x + 36, y + 162, tw - 72);
    ctx.textAlign = 'center';
  });
  await footer(ctx);
  return toPng(c);
}
