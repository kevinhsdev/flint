import { useEffect, useRef, useState } from 'react';
import { createWaterSim, type WaterSim } from './waterSim';
import { Sheet } from '../ui/Sheet';
import { Icon } from '../ui/Icon';

interface Props { ml: number; goal: number; onAdd(ml: number): void; onUndo(): void }

const liters = (ml: number) => (ml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const LONG_PRESS = 450;

export function WaterCard({ ml, goal, onAdd, onUndo }: Props) {
  const cv = useRef<HTMLCanvasElement>(null);
  const sim = useRef<WaterSim>(null);
  const timer = useRef(0), held = useRef(false);
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState('');
  const first = useRef(true);

  useEffect(() => {
    sim.current = createWaterSim(cv.current!, ml / goal);
    return () => sim.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o nível é atualizado pelo efeito abaixo
  }, []);
  useEffect(() => {
    sim.current?.setLevel(ml / goal);
    if (!first.current) sim.current?.splash();
    first.current = false;
  }, [ml, goal]);

  const add = (n: number) => { setOpen(false); setCustom(''); onAdd(n); };
  const down = () => { held.current = false; timer.current = window.setTimeout(() => { held.current = true; setOpen(true); }, LONG_PRESS); };
  const cancel = () => clearTimeout(timer.current);
  const customMl = Math.round(Number(custom));

  return (
    <>
      <div
        className="tile water" role="button" tabIndex={0} aria-label={`Água: ${liters(ml)} de ${liters(goal)} litros. Toque para +250 ml, segure para outras opções`}
        onPointerDown={down} onPointerUp={cancel} onPointerLeave={cancel} onPointerCancel={cancel}
        onClick={() => { if (!held.current) add(250); held.current = false; }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); add(250); } }}
        onContextMenu={e => e.preventDefault()}
      >
        <canvas ref={cv} className="liquid" aria-hidden="true" />
        <div className="k">Água</div>
        <div className="v num">{liters(ml)}<small> / {liters(goal)} L</small></div>
        <div className="s">toque +250 ml</div>
        <span className="add" aria-hidden="true"><Icon name="plus" /></span>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Quanto você bebeu?">
        <div className="water-opts">
          {[150, 250, 500].map(n => <button key={n} className="chip" onClick={() => add(n)}>{n} ml</button>)}
        </div>
        <form className="water-custom" onSubmit={e => { e.preventDefault(); if (customMl > 0 && customMl <= 3000) add(customMl); }}>
          <label>
            <span>Outro valor (ml)</span>
            <input type="number" inputMode="numeric" min={1} max={3000} value={custom} onChange={e => setCustom(e.target.value)} />
          </label>
          <button className="btn" disabled={!(customMl > 0 && customMl <= 3000)}>Adicionar</button>
        </form>
        <button className="btn ghost" disabled={ml === 0} onClick={() => { setOpen(false); onUndo(); }}>Desfazer</button>
      </Sheet>
    </>
  );
}
