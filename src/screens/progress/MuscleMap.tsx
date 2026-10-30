import { addDays, localDay, weekStart } from '../../domain/dates';
import { MUSCLE_NAMES } from '../../domain/exercises';
import { muscleVolume } from '../../domain/progress';
import { MUSCLES, type Exercise, type Muscle, type Session } from '../../domain/types';

// Elipse (cx, cy, rx, ry, rotação) espelhada nos dois lados do corpo, como um único path.
type E = [number, number, number, number, number?];
const ell = ([cx, cy, rx, ry, rot = 0]: E) => {
  const a = (rot * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  const pt = (t: number) => [cx + rx * Math.cos(t) * c - ry * Math.sin(t) * s, cy + rx * Math.cos(t) * s + ry * Math.sin(t) * c].map(n => n.toFixed(1)).join(' ');
  return `M${pt(0)}A${rx} ${ry} ${rot} 1 1 ${pt(Math.PI)}A${rx} ${ry} ${rot} 1 1 ${pt(0)}Z`;
};
const pair = (e: E): string => ell(e) + ell([100 - e[0], e[1], e[2], e[3], -(e[4] ?? 0)]);

// Corpo num viewBox 100×200, centro em x=50.
const FRONT: Partial<Record<Muscle, string>> = {
  trapezio: pair([40, 38, 7, 3.5, 20]),
  ombros: pair([29, 45, 7, 6.5]),
  peito: pair([41, 53, 9, 7]),
  biceps: pair([25, 64, 4.5, 9, 8]),
  antebraco: pair([21, 84, 4, 10, 10]),
  abdomen: ell([50, 76, 8, 15]),
  quadriceps: pair([41, 118, 7.5, 20, -3]),
  panturrilha: pair([40, 160, 5, 13, -2]),
};
const BACK: Partial<Record<Muscle, string>> = {
  trapezio: ell([50, 44, 11, 9]),
  ombros: pair([29, 45, 7, 6.5]),
  costas: pair([41, 64, 9, 14, -8]),
  triceps: pair([25, 64, 4.5, 9, 8]),
  antebraco: pair([21, 84, 4, 10, 10]),
  gluteos: pair([43, 98, 8, 8]),
  posterior: pair([41, 124, 7, 17, -3]),
  panturrilha: pair([40, 160, 5.5, 13, -2]),
};
const SILHOUETTE = 'M50 14a10 11 0 1 1 0 .1ZM38 35h24q12 2 16 12l7 45q1 5-3 6l-6-28-2 22 2 4-3 72q0 6-6 6h-4q-4 0-4-5l-2-70h-2l-2 70q0 5-4 5h-4q-6 0-6-6l-3-72 2-4-2-22-6 28q-4-1-3-6l7-45q4-10 16-12Z';

/** Cor entre --surface-2 (#211929) e --crimson (#E5163E). */
const mix = (t: number) => {
  const a = [0x21, 0x19, 0x29], b = [0xE5, 0x16, 0x3E];
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
};

export function MuscleMap({ sessions, lib }: { sessions: Session[]; lib: Exercise[] }) {
  const today = localDay(new Date()), from = weekStart(today);
  const vol = muscleVolume(sessions, from, addDays(from, 6), lib);
  const max = Math.max(0, ...MUSCLES.map(m => vol[m]));
  const fill = (m: Muscle) => mix(max ? Math.sqrt(vol[m] / max) : 0);
  const worked = MUSCLES.filter(m => vol[m] > 0);
  const body = (paths: Partial<Record<Muscle, string>>, label: string) => (
    <figure>
      <svg viewBox="0 0 100 190" role="img" aria-label={`${label}`}>
        <path d={SILHOUETTE} className="sil" />
        {(Object.keys(paths) as Muscle[]).map(m => <path key={m} d={paths[m]} fill={fill(m)} data-muscle={m}><title>{MUSCLE_NAMES[m]}</title></path>)}
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );
  return (
    <section className="card">
      <div className="card-head"><h2>Músculos da semana</h2></div>
      <div className="bodies">{body(FRONT, 'Frente')}{body(BACK, 'Costas')}</div>
      <p className="muted">{worked.length ? worked.map(m => MUSCLE_NAMES[m]).join(', ') : 'Nenhum treino nesta semana ainda.'}</p>
    </section>
  );
}
