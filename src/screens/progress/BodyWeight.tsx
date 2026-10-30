import { useState } from 'react';
import { Link } from 'react-router';
import { logWeight } from '../../db/repo';
import { bmi } from '../../domain/body';
import { localDay } from '../../domain/dates';
import type { WeightLog } from '../../domain/types';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';
import { LineChart } from './ExerciseChart';

/** Média móvel dos últimos 7 registros (ou menos, no começo). */
export const movingAvg = (v: number[], n = 7) => v.map((_, i) => { const w = v.slice(Math.max(0, i - n + 1), i + 1); return w.reduce((a, b) => a + b, 0) / w.length; });

export function BodyWeight({ weights, heightCm }: { weights: WeightLog[]; heightCm: number | null }) {
  const [open, setOpen] = useState(false);
  const [kg, setKg] = useState<number | null>(null);
  const sorted = [...weights].sort((a, b) => a.day.localeCompare(b.day));
  const last = sorted.at(-1);
  const values = sorted.map(w => w.kg);
  const b = last && heightCm ? bmi(last.kg, heightCm) : null;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Peso</h2>
        <button className="pill on" onClick={() => { setKg(last?.kg ?? null); setOpen(true); }}>Registrar</button>
      </div>
      {last ? <div className="big num">{fmtNum(last.kg)}<small> kg</small></div> : <p className="muted">Registre seu peso pra ver a tendência.</p>}
      {values.length > 1 && <LineChart values={values} avg={movingAvg(values)} label="Peso" />}
      {last && (b
        ? <p className="bmi">IMC <b className="num">{`${fmtNum(Math.round(b.value * 10) / 10)} · ${b.band}`}</b></p>
        : !heightCm && <p className="muted">Pra ver o IMC: <Link to="/time/ajustes" className="inline-link">Informe sua altura</Link></p>)}
      <Sheet open={open} onClose={() => setOpen(false)} title="Peso de hoje">
        <label className="field"><span>Peso (kg)</span><NumberField decimal value={kg} onValue={setKg} autoFocus /></label>
        <button className="btn wide" disabled={!kg || kg < 20 || kg > 400} onClick={async () => { await logWeight(kg!, localDay(new Date())); setOpen(false); }}>Registrar</button>
      </Sheet>
    </section>
  );
}
