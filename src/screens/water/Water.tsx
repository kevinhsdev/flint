import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { deleteWater, getSettings, logWater, saveSettings, undoLastWater } from '../../db/repo';
import { waterDays, waterGoalMl, waterStreak } from '../../domain/body';
import { RULES } from '../../domain/rules';
import type { MascotAct } from '../../mascots/engine';
import { Mascot } from '../../mascots/Mascot';
import { Glass } from '../../water/Glass';
import { Icon } from '../../ui/Icon';
import { NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';
import { useToday } from '../../ui/useToday';
import { Calendar } from '../progress/Calendar';
import { expectedWaterFraction } from '../today/Today';

const liters = (ml: number) => (ml / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
const clock = (at: number) => new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function Water() {
  const today = useToday();
  const [custom, setCustom] = useState<string | null>(null);
  const [gota, setGota] = useState<{ name: MascotAct; key: number }>();
  const d = useLiveQuery(async () => {
    const [water, weights, settings] = await Promise.all([db.water.toArray(), db.weights.orderBy('day').toArray(), getSettings()]);
    return { water, settings, lastKg: weights.at(-1)?.kg };
  }, []);
  const prevMl = useRef<number | null>(null);

  const goal = d ? waterGoalMl(d.settings, d.lastKg) : RULES.waterDefaultMl;
  const todayLogs = (d?.water ?? []).filter(w => w.day === today).sort((a, b) => b.at - a.at);
  const ml = todayLogs.reduce((n, w) => n + w.ml, 0);

  // a Gota comemora quando a meta é batida nesta tela
  useEffect(() => {
    if (prevMl.current !== null && prevMl.current < goal && ml >= goal) setGota({ name: 'comemorar', key: Date.now() });
    if (d) prevMl.current = ml;
  }, [ml, goal, d]);

  if (!d) return <main className="screen" />;
  const auto = waterGoalMl({ ...d.settings, waterGoalMl: null }, d.lastKg);
  const manual = d.settings.waterGoalMl !== null;
  const sad = ml < goal * expectedWaterFraction(new Date());
  const customMl = Math.round(Number(custom));
  const add = (n: number) => { setCustom(null); void logWater(n); };

  return (
    <main className="screen water-screen">
      <h1 className="title">Água</h1>

      <section className="card water-hero">
        <Glass ml={ml} goal={goal} />
        <div>
          <div className="big num" aria-label={`Bebido hoje: ${liters(ml)} de ${liters(goal)} litros`}>{liters(ml)}<small> / {liters(goal)} L</small></div>
          <div className="pct num">{Math.round((ml / goal) * 100)}% da meta</div>
          <div className="gota"><Mascot kind="gota" size={72} mood={sad ? 'sad' : 'happy'} act={gota} /></div>
        </div>
      </section>

      <div className="water-add">
        {RULES.waterQuick.map(n => <button key={n} className="chip" onClick={() => add(n)}>+{n} ml</button>)}
      </div>
      <div className="water-tools">
        <button className="btn ghost" onClick={() => setCustom('')}><Icon name="plus" /> Outro valor</button>
        <button className="btn ghost" disabled={!ml} onClick={() => undoLastWater(today)}><Icon name="undo" /> Desfazer</button>
      </div>

      {todayLogs.length > 0 && (
        <section className="card">
          <h2>Hoje</h2>
          <ul className="water-log" aria-label="Registros de hoje">
            {todayLogs.map(w => (
              <li key={w.id}>
                <span className="t">{clock(w.at)}</span><b>{w.ml} ml</b>
                <button className="icon-btn" aria-label={`Remover ${w.ml} ml`} onClick={() => deleteWater(w.id)}><Icon name="trash" /></button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="switch-row">
          <div><h2>Meta diária</h2><p className="muted">{manual ? 'Você definiu a meta.' : `${RULES.waterMlPerKg} ml por kg do seu peso: ${liters(auto)} L.`}</p></div>
          <button className="switch" role="switch" aria-checked={!manual} aria-label="Meta automática"
            onClick={() => saveSettings({ waterGoalMl: manual ? null : auto })} />
        </div>
        {manual && (
          <label className="field" style={{ marginTop: 12 }}>
            <span>Meta diária (ml)</span>
            <NumberField value={d.settings.waterGoalMl} onValue={n => { if (n && n >= 500 && n <= 8000) void saveSettings({ waterGoalMl: Math.round(n) }); }} />
          </label>
        )}
      </section>

      <Calendar trainDays={[0, 1, 2, 3, 4, 5, 6]} intensity={days => waterDays(d.water, goal, days)} unit={['dia com água', 'dias com água']} tone="water">
        <p className="streak-line"><b className="num">{waterStreak(d.water, goal, today)}</b> dias seguidos na meta</p>
      </Calendar>

      <Sheet open={custom !== null} onClose={() => setCustom(null)} title="Quanto você bebeu?">
        <form className="water-custom" onSubmit={e => { e.preventDefault(); if (customMl > 0 && customMl <= 3000) add(customMl); }}>
          <label>
            <span>Quantidade (ml)</span>
            <input type="number" inputMode="numeric" min={1} max={3000} value={custom ?? ''} onChange={e => setCustom(e.target.value)} autoFocus />
          </label>
          <button className="btn" disabled={!(customMl > 0 && customMl <= 3000)}>Adicionar</button>
        </form>
      </Sheet>
    </main>
  );
}
