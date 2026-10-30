import { useEffect, useState } from 'react';
import { plates } from '../../domain/strength';
import { Sheet } from '../../ui/Sheet';
import { fmtNum, NumberField } from '../../ui/NumberField';

const BARS = [20, 15, 10];
const PLATE_COLOR: Record<number, string> = { 25: '#E5163E', 20: '#3B82F6', 15: '#F5B700', 10: '#3BB273', 5: '#F5F0F7', 2.5: '#A193AA', 1.25: '#6E6177' };

/** Calculadora de anilhas: quanto colocar de cada lado da barra. */
export function PlateCalc({ open, kg, onClose, onKg }: { open: boolean; kg: number; onClose(): void; onKg(kg: number): void }) {
  const [target, setTarget] = useState<number | null>(kg || null);
  const [bar, setBar] = useState(20);
  useEffect(() => { if (open) setTarget(kg || null); }, [open, kg]);
  const p = plates(target ?? 0, bar);

  return (
    <Sheet open={open} onClose={onClose} title="Anilhas">
      <div className="plate-form">
        <label className="field"><span>Carga total (kg)</span><NumberField decimal value={target} onValue={setTarget} /></label>
        <div className="field"><span>Barra</span>
          <div className="seg">{BARS.map(b => <button key={b} className={b === bar ? 'on' : ''} onClick={() => setBar(b)}>{b} kg</button>)}</div>
        </div>
      </div>
      <div className="plates" aria-label="Anilhas de cada lado">
        <div className="bar-end" />
        {p.perSide.map((w, i) => <div key={i} className="plate" style={{ height: 40 + w * 3.2, background: PLATE_COLOR[w] }}><span>{fmtNum(w)}</span></div>)}
        {!p.perSide.length && <span className="muted">Só a barra</span>}
      </div>
      <p className="muted">
        {p.perSide.length ? `Cada lado: ${p.perSide.map(fmtNum).join(' + ')} kg` : ''}
        {p.remainder > 0 && ` · faltam ${fmtNum(p.remainder)} kg pra fechar`}
      </p>
      <button className="btn wide" disabled={!target} onClick={() => { onKg(target!); onClose(); }}>Usar {target ? `${fmtNum(target)} kg` : ''}</button>
    </Sheet>
  );
}
