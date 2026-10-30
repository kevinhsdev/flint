/* Sons sutis sintetizados com Web Audio: nenhum arquivo, volume baixo, desligáveis em Ajustes. */

export type SoundName = 'check' | 'pr' | 'drop' | 'done';

const VOL = 0.22;
let enabled = true;
let ctx: AudioContext | null = null;

/** Espelho do ajuste `sound`, pra tocar sem ler o banco. */
export const setSoundEnabled = (on: boolean) => { enabled = on; };

function audio(): AudioContext | null {
  if (ctx) return ctx;
  const Ctor = globalThis.AudioContext ?? (globalThis as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  // o iOS só libera o áudio depois de um toque
  const unlock = () => { void ctx?.resume(); };
  addEventListener('pointerdown', unlock, { once: true });
  return ctx;
}

/** Uma nota com ataque curto e queda exponencial; `to` faz o glissando. */
function tone(a: AudioContext, freq: number, at: number, dur: number, { type = 'sine' as OscillatorType, vol = VOL, to = 0 } = {}) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.linearRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(a.destination);
  o.start(at); o.stop(at + dur + 0.02);
}

/** Estalo de fogo: ruído curto filtrado. */
function crackle(a: AudioContext, at: number, dur: number) {
  const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() < 0.06 ? (Math.random() * 2 - 1) * (1 - i / n) : 0;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = 'highpass'; f.frequency.value = 1800; g.gain.value = VOL * 0.7;
  src.connect(f); f.connect(g); g.connect(a.destination);
  src.start(at);
}

export function play(name: SoundName) {
  if (!enabled) return;
  const a = audio();
  if (!a) return;
  const t = a.currentTime + 0.01;
  if (name === 'check') { tone(a, 1320, t, 0.07, { type: 'triangle', vol: VOL * 0.8 }); tone(a, 1980, t + 0.045, 0.09, { type: 'triangle', vol: VOL * 0.6 }); }
  if (name === 'drop') tone(a, 880, t, 0.28, { to: 340, vol: VOL * 0.9 });
  if (name === 'pr') { [523, 659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.06, 0.42, { type: 'triangle', vol: VOL * 0.55 })); crackle(a, t, 0.5); }
  if (name === 'done') [659, 784, 1047].forEach((f, i) => tone(a, f, t + i * 0.12, 0.3, { type: 'sine', vol: VOL * 0.75 }));
}
