import { useState } from 'react';
import { Mascot } from '../mascots/Mascot';
import type { MascotAct, MascotKind } from '../mascots/engine';
import { WaterCard } from '../water/WaterCard';

// Página só de desenvolvimento: confere mascotes e água contra o mockup.
const ACTS: MascotAct[] = ['danca', 'acenar', 'comemorar', 'bravo', 'dormir', 'boxe', 'polichinelo', 'gotinha', 'balanco', 'rosca', 'flex'];
const KINDS: MascotKind[] = ['faisca', 'gota', 'pedra'];

export default function Dev() {
  const [act, setAct] = useState<{ name: MascotAct; key: number }>();
  const [sad, setSad] = useState(false);
  const [ml, setMl] = useState(1750);
  return (
    <main className="screen">
      <h1 className="title">Dev</h1>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {KINDS.map(k => <Mascot key={k} kind={k} size={120} act={act} mood={sad ? 'sad' : 'happy'} />)}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
        {ACTS.map(a => <button key={a} className="chip" style={{ padding: '0 12px', height: 36 }} onClick={() => setAct({ name: a, key: Date.now() })}>{a}</button>)}
        <button className="chip" style={{ padding: '0 12px', height: 36 }} onClick={() => setSad(s => !s)}>triste</button>
      </div>
      <div className="pair">
        <WaterCard ml={ml} goal={3000} onAdd={n => setMl(m => m + n)} onUndo={() => setMl(m => Math.max(0, m - 250))} />
      </div>
    </main>
  );
}
