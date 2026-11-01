import { useState } from 'react';
import { Link } from 'react-router';
import { logWeight, saveSettings } from '../../db/repo';
import { bmi } from '../../domain/body';
import { localDay } from '../../domain/dates';
import { weeklyTrend, weightGoal } from '../../domain/evolution';
import type { WeightLog } from '../../domain/types';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';
import { LineChart } from './ExerciseChart';

/** Média móvel dos últimos 7 registros (ou menos, no começo). */
export const movingAvg = (v: number[], n = 7) => v.map((_, i) => { const w = v.slice(Math.max(0, i - n + 1), i + 1); return w.reduce((a, b) => a + b, 0) / w.length; });

const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${fmtNum(Math.abs(Math.round(n * 10) / 10))}`;

export function BodyWeight({ weights, heightCm, goalKg }: { weights: WeightLog[]; heightCm: number | null; goalKg: number | null }) {
  const [open, setOpen] = useState<'peso' | 'meta' | null>(null);
  const [kg, setKg] = useState<number | null>(null);
  const sorted = [...weights].sort((a, b) => a.day.localeCompare(b.day));
  const last = sorted.at(-1);
  const values = sorted.map(w => w.kg);
  const b = last && heightCm ? bmi(last.kg, heightCm) : null;
  const g = weightGoal(weights, goalKg);
  const trend = weeklyTrend(weights, localDay(new Date()));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Peso</h2>
        <span className="head-btns">
          <button className="pill" onClick={() => { setKg(goalKg); setOpen('meta'); }}>Meta</button>
          <button className="pill on" onClick={() => { setKg(last?.kg ?? null); setOpen('peso'); }}>Registrar</button>
        </span>
      </div>
      {last ? <div className="big num">{fmtNum(last.kg)}<small> kg</small>{trend !== null && <small className="trend"> {signed(trend)} kg/semana</small>}</div>
        : <p className="muted">Registre seu peso pra ver a tendência.</p>}
      {values.length > 1 && <LineChart values={values} avg={movingAvg(values)} label="Peso" />}
      {g && (
        <div className="wgoal" role="group" aria-label="Meta de peso">
          <div className="wgoal-row num">
            <span><small>Início</small><b>{fmtNum(g.start)}</b></span>
            <span><small>Agora</small><b>{fmtNum(g.current)}</b></span>
            <span><small>Meta</small><b>{fmtNum(g.goal)}</b></span>
          </div>
          <div className="track" role="progressbar" aria-label="Caminho até a meta de peso" aria-valuenow={Math.round(g.done * 100)}><i style={{ width: `${g.done * 100}%` }} /></div>
          <p className="muted">{g.left ? `${Math.round(g.done * 100)}% do caminho · faltam ${fmtNum(g.left)} kg` : 'Meta alcançada!'}</p>
        </div>
      )}
      {last && (b
        ? <p className="bmi">IMC <b className="num">{`${fmtNum(Math.round(b.value * 10) / 10)} · ${b.band}`}</b></p>
        : !heightCm && <p className="muted">Pra ver o IMC: <Link to="/time/ajustes" className="inline-link">Informe sua altura</Link></p>)}
      <Sheet open={open === 'peso'} onClose={() => setOpen(null)} title="Peso de hoje">
        <label className="field"><span>Peso (kg)</span><NumberField decimal value={kg} onValue={setKg} autoFocus /></label>
        <button className="btn wide" disabled={!kg || kg < 20 || kg > 400} onClick={async () => { await logWeight(kg!, localDay(new Date())); setOpen(null); }}>Registrar</button>
      </Sheet>
      <Sheet open={open === 'meta'} onClose={() => setOpen(null)} title="Meta de peso">
        <label className="field"><span>Meta de peso (kg)</span><NumberField decimal value={kg} onValue={setKg} autoFocus /></label>
        <div className="row-2">
          {goalKg !== null && <button className="btn ghost" onClick={async () => { await saveSettings({ weightGoalKg: null }); setOpen(null); }}>Remover meta</button>}
          <button className="btn" disabled={!kg || kg < 20 || kg > 400} onClick={async () => { await saveSettings({ weightGoalKg: kg }); setOpen(null); }}>Salvar meta</button>
        </div>
      </Sheet>
    </section>
  );
}
