import { useState } from 'react';
import { logMeasures } from '../../db/repo';
import { localDay } from '../../domain/dates';
import { latestMeasures, lifetimeTotals } from '../../domain/evolution';
import { MEASURE_PARTS, type Measure, type MeasurePart, type Session } from '../../domain/types';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';

export const PART_NAMES: Record<MeasurePart, string> = { peito: 'Peito', cintura: 'Cintura', quadril: 'Quadril', braco: 'Braço', coxa: 'Coxa', panturrilha: 'Panturrilha' };
const signed = (n: number) => `${n > 0 ? '+' : '−'}${fmtNum(Math.abs(n))}`;

/** Medidas corporais: a última de cada parte e quanto mudou desde a primeira. */
export function Measures({ measures }: { measures: Measure[] }) {
  const latest = latestMeasures(measures);
  const [form, setForm] = useState<Partial<Record<MeasurePart, number | null>> | null>(null);
  const open = () => setForm(Object.fromEntries(MEASURE_PARTS.map(p => [p, latest[p]?.cm ?? null])));
  const ok = form && Object.values(form).some(v => v);

  return (
    <section className="card">
      <div className="card-head">
        <h2>Medidas</h2>
        <button className="pill on" aria-label="Registrar medidas" onClick={open}>Registrar</button>
      </div>
      {measures.length ? (
        <ul className="measures">
          {MEASURE_PARTS.filter(p => latest[p]).map(p => (
            <li key={p}>
              <small>{PART_NAMES[p]}</small>
              <b className="num">{fmtNum(latest[p]!.cm)} cm</b>
              {latest[p]!.delta !== 0 && <i className="num">{signed(latest[p]!.delta)}</i>}
            </li>
          ))}
        </ul>
      ) : <p className="muted">Cintura, braço, coxa… meça com fita a cada 2–4 semanas, sempre no mesmo horário.</p>}
      <Sheet open={!!form} onClose={() => setForm(null)} title="Medidas de hoje">
        <div className="measure-form">
          {MEASURE_PARTS.map(p => (
            <label key={p} className="field"><span>{PART_NAMES[p]} (cm)</span>
              <NumberField decimal inputMode="decimal" value={form?.[p] ?? null} onValue={v => setForm(f => ({ ...f, [p]: v }))} />
            </label>
          ))}
        </div>
        <button className="btn wide" disabled={!ok} onClick={async () => {
          const cm = Object.fromEntries(Object.entries(form!).filter(([, v]) => v && v > 0 && v < 300)) as Partial<Record<MeasurePart, number>>;
          // só grava o que mudou: repetir a medida antiga não é uma medida nova
          for (const p of MEASURE_PARTS) if (cm[p] === latest[p]?.cm && latest[p]?.day !== localDay(new Date())) delete cm[p];
          await logMeasures(localDay(new Date()), cm);
          setForm(null);
        }}>Salvar medidas</button>
      </Sheet>
    </section>
  );
}

/** Seus números: tudo que você já fez no app. */
export function Lifetime({ sessions }: { sessions: Session[] }) {
  const t = lifetimeTotals(sessions);
  const items: [string, string][] = [
    [fmtNum(t.workouts), t.workouts === 1 ? 'treino' : 'treinos'],
    [fmtNum(t.sets), 'séries'],
    [`${fmtNum(t.tonnes)} t`, 'levantadas'],
    [`${fmtNum(t.hours)} h`, 'treinando'],
    [`${fmtNum(t.km)} km`, 'de cardio'],
  ];
  return (
    <section className="card">
      <div className="card-head"><h2>Seus números</h2><span className="muted">desde o começo</span></div>
      <ul className="totals">{items.map(([big, small]) => <li key={small}><b className="num">{big}</b><small>{small}</small></li>)}</ul>
    </section>
  );
}
