import { useState } from 'react';
import { startFresh } from '../db/repo';
import { Sheet } from './Sheet';

/** Aviso do modo demo: o app abre cheio de exemplo; daqui a pessoa começa o dela. */
export function DemoBanner() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="demo">
        <span>Dados de exemplo</span>
        <button onClick={() => setOpen(true)}>Começar do zero</button>
      </div>
      <Sheet open={open} onClose={() => setOpen(false)} title="Começar do zero?">
        <p className="muted">Os treinos, a água e o peso de exemplo serão apagados. A biblioteca de exercícios continua.</p>
        <div className="row-2">
          <button className="btn ghost" onClick={() => setOpen(false)}>Cancelar</button>
          <button className="btn" onClick={async () => { await startFresh(); setOpen(false); }}>Apagar tudo</button>
        </div>
      </Sheet>
    </>
  );
}
