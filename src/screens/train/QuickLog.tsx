import { useState } from 'react';
import { db } from '../../db/db';
import { CARDIO_NAMES, cardioSession, checkinSession, pace } from '../../domain/training';
import { CARDIO, type CardioType, type Template } from '../../domain/types';
import { play } from '../../ui/sound';
import { NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';

const DONE: Record<CardioType, string> = { corrida: 'Corrida registrada', caminhada: 'Caminhada registrada', bike: 'Bike registrada', outro: 'Cardio registrado' };

/** Registros rápidos da tela Treino: cardio digitado à mão e check-in sem séries. Viram treinos já terminados. */
export function QuickLog({ templates }: { templates: Template[] }) {
  const [open, setOpen] = useState<'cardio' | 'checkin' | null>(null);
  const [type, setType] = useState<CardioType>('corrida');
  const [min, setMin] = useState<number | null>(null);
  const [km, setKm] = useState<number | null>(null);
  const [tpl, setTpl] = useState<string | null>(null);
  const [checkMin, setCheckMin] = useState<number | null>(60);
  const [msg, setMsg] = useState('');

  const close = () => setOpen(null);
  const done = async (s: Parameters<typeof db.sessions.add>[0], text: string) => {
    await db.sessions.add(s);
    play('done');
    setMsg(text); close(); setMin(null); setKm(null);
  };
  const cardio = { type, min: min ?? 0, km };
  const p = pace(cardio);
  const tplName = templates.find(t => t.id === tpl)?.name;

  return (
    <>
      <div className="row-2 quick">
        <button className="btn ghost" onClick={() => { setMsg(''); setOpen('checkin'); }}>Check-in</button>
        <button className="btn ghost" onClick={() => { setMsg(''); setOpen('cardio'); }}>Cardio</button>
      </div>
      {msg && <p className="quick-msg" role="status">{msg} ✓</p>}

      <Sheet open={open === 'cardio'} onClose={close} title="Cardio">
        <div className="sv-days" role="group" aria-label="Tipo de cardio">
          {CARDIO.map(c => <button key={c} className={`pill${type === c ? ' on' : ''}`} aria-pressed={type === c} onClick={() => setType(c)}>{CARDIO_NAMES[c]}</button>)}
        </div>
        <div className="row-2">
          <label className="field"><span>Duração (min)</span><NumberField decimal inputMode="decimal" value={min} onValue={setMin} placeholder="30" /></label>
          <label className="field"><span>Distância (km)</span><NumberField decimal inputMode="decimal" value={km} onValue={setKm} placeholder="opcional" /></label>
        </div>
        {p && <p className="pace num"><small>Ritmo</small><b>{p}</b></p>}
        <button className="btn wide" disabled={!min} onClick={() => done(cardioSession(cardio), DONE[type])}>Registrar cardio</button>
      </Sheet>

      <Sheet open={open === 'checkin'} onClose={close} title="Check-in de treino">
        <p className="muted">Treinou e não anotou as séries? Marque o dia: conta pra sequência, XP e medalhas.</p>
        <div className="sv-days" role="group" aria-label="Qual treino">
          {templates.map(t => <button key={t.id} className={`pill${tpl === t.id ? ' on' : ''}`} aria-pressed={tpl === t.id} onClick={() => setTpl(t.id)}>{t.name}</button>)}
          <button className={`pill${tpl === null ? ' on' : ''}`} aria-pressed={tpl === null} onClick={() => setTpl(null)}>Outro</button>
        </div>
        <label className="field"><span>Duração (min)</span><NumberField inputMode="numeric" value={checkMin} onValue={setCheckMin} /></label>
        <button className="btn wide" disabled={!checkMin} onClick={() => done(checkinSession(tplName ?? 'Treino', tpl, checkMin!), 'Check-in feito')}>Fazer check-in</button>
      </Sheet>
    </>
  );
}
