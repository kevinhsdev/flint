import { useId, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { parseDay } from '../../domain/dates';
import { exerciseSeries } from '../../domain/progress';
import { findPRs } from '../../domain/strength';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';

const W = 320, H = 150, PX = 10, PY = 16;

/** Curva suave (Catmull-Rom → Bézier) passando por todos os pontos. */
function smooth(p: [number, number][]) {
  if (p.length < 2) return '';
  let d = `M${p[0][0]},${p[0][1]}`;
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i - 1] ?? p[i], [x1, y1] = p[i], [x2, y2] = p[i + 1], [x3, y3] = p[i + 2] ?? p[i + 1];
    d += `C${x1 + (x2 - x0) / 6},${y1 + (y2 - y0) / 6} ${x2 - (x3 - x1) / 6},${y2 - (y3 - y1) / 6} ${x2},${y2}`;
  }
  return d;
}

/** Gráfico de linha + área em SVG. `avg` desenha uma segunda linha (média móvel). */
export function LineChart({ values, avg, label, unit = 'kg' }: { values: number[]; avg?: number[]; label: string; unit?: string }) {
  const id = useId();
  if (!values.length) return null;
  const all = [...values, ...(avg ?? [])];
  let lo = Math.min(...all), hi = Math.max(...all);
  if (hi === lo) { hi += 1; lo -= 1; }
  const x = (i: number) => PX + (values.length === 1 ? (W - 2 * PX) / 2 : (i / (values.length - 1)) * (W - 2 * PX));
  const y = (v: number) => PY + (1 - (v - lo) / (hi - lo)) * (H - 2 * PY);
  const pts = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smooth(pts);
  const last = pts.at(-1)!;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label}: de ${fmtNum(values[0])} a ${fmtNum(values.at(-1)!)} ${unit}`}>
      <defs>
        <linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E5163E" stopOpacity=".35" /><stop offset="1" stopColor="#E5163E" stopOpacity="0" /></linearGradient>
      </defs>
      {[.25, .5, .75].map(f => <line key={f} x1={PX} x2={W - PX} y1={PY + f * (H - 2 * PY)} y2={PY + f * (H - 2 * PY)} className="grid" />)}
      {line && <path d={`${line}L${last[0]},${H}L${pts[0][0]},${H}Z`} fill={`url(#a${id})`} />}
      {line && <path d={line} className={avg ? 'raw' : 'ln'} />}
      {avg && <path d={smooth(avg.map((v, i) => [x(i), y(v)]))} className="ln" />}
      {pts.map(([px, py], i) => <circle key={i} data-point cx={px} cy={py} r={i === pts.length - 1 ? 4.5 : 2.6} className={i === pts.length - 1 ? 'pt last' : 'pt'} />)}
      <text x={last[0] - 8} y={last[1] < 28 ? last[1] + 18 : last[1] - 9} className="lbl" textAnchor="end">{fmtNum(values.at(-1)!)}</text>
    </svg>
  );
}

const METRICS = [['maxKg', 'Carga máx'], ['e1rm', '1RM'], ['volume', 'Volume']] as const;
const day = (d: string) => parseDay(d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace('.', '');

export default function ExerciseScreen() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [metric, setMetric] = useState<(typeof METRICS)[number][0]>('maxKg');
  const d = useLiveQuery(async () => ({ ex: await db.exercises.get(id), sessions: await db.sessions.toArray() }), [id]);
  if (!d) return <main className="screen" />;
  const series = exerciseSeries(id, d.sessions);
  const prs = findPRs(d.sessions).filter(p => p.exerciseId === id).reverse();
  const values = series.map(p => Math.round(p[metric] * 10) / 10);

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav(-1)}><Icon name="back" /></button>
        <h1 className="title sm">{d.ex?.name ?? 'Exercício'}</h1>
        <span />
      </header>
      <div className="seg" role="tablist">
        {METRICS.map(([k, l]) => <button key={k} role="tab" aria-selected={metric === k} className={metric === k ? 'on' : ''} onClick={() => setMetric(k)}>{l}</button>)}
      </div>
      <section className="card">
        {series.length ? <>
          <div className="big num">{fmtNum(values.at(-1)!)}<small> kg</small></div>
          <LineChart values={values} label={METRICS.find(m => m[0] === metric)![1]} />
          <div className="axis muted"><span>{day(series[0].day)}</span><span>{day(series.at(-1)!.day)}</span></div>
        </> : <p className="muted">Ainda sem séries concluídas deste exercício.</p>}
      </section>
      {prs.length > 0 && (
        <section className="prs">
          <h2>Recordes</h2>
          <ul>{prs.map((p, i) => <li key={i}><span>{new Date(p.at).toLocaleDateString('pt-BR')}</span><span className="num">{fmtNum(p.kg)} kg × {p.reps}</span></li>)}</ul>
        </section>
      )}
    </main>
  );
}
