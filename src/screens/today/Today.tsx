import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getActiveSession, getSettings, logWater, logWeight, undoLastWater } from '../../db/repo';
import { addDays, daysBetween, localDay, weekday } from '../../domain/dates';
import { waterGoalMl } from '../../domain/body';
import { MUSCLE_NAMES } from '../../domain/exercises';
import { computeXP, dailyMedals, goalWeeksStreak, mood, type MedalId } from '../../domain/gamification';
import { nextTemplate } from '../../domain/routine';
import { findPRs } from '../../domain/strength';
import type { Exercise, Template } from '../../domain/types';
import { Mascot } from '../../mascots/Mascot';
import { WaterCard } from '../../water/WaterCard';
import { Bar } from '../../ui/Bar';
import { DemoBanner } from '../../ui/DemoBanner';
import { Icon } from '../../ui/Icon';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';
import { startPath } from '../train/Routine';
import { useToday } from '../../ui/useToday';

export interface CoachCtx {
  hasRoutine: boolean; trainedToday: boolean; isTrainDay: boolean; mood: 'happy' | 'sad';
  next?: { name: string; muscles: string[] };
}

/** A fala da Faísca no topo do Hoje, por ordem de prioridade. */
export function coachLine(c: CoachCtx): string {
  if (!c.hasRoutine) return 'Bora montar sua primeira rotina?';
  if (c.trainedToday) return 'Treino feito! Agora é hidratar.';
  if (c.mood === 'sad') return 'Saudade de você na academia…';
  if (c.isTrainDay && c.next) {
    const letter = c.next.name.split(' — ')[0];
    return `Hoje é treino ${letter} — ${c.next.muscles.map(m => m.toLowerCase()).join(', ')}. Bora?`;
  }
  return 'Folga merecida. Bebe uma água aí.';
}

const MEDALS: Record<MedalId, string> = { treino: 'Treinou', hidratado: 'Hidratado', recorde: 'Recorde', 'dia-completo': 'Dia completo' };
const greeting = (h: number) => (h < 5 ? 'Boa noite' : h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite');
const ago = (day: string, today: string) => { const d = daysBetween(day, today); return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`; };
const musclesOf = (t: Template, lib: Map<string, Exercise>) =>
  [...new Set(t.items.map(i => lib.get(i.exerciseId)?.primary).filter(m => m !== undefined))].map(m => MUSCLE_NAMES[m]);

/** Fração da meta de água esperada até agora: o dia "de beber" vai das 8h às 22h. */
export const expectedWaterFraction = (now: Date) => Math.min(1, Math.max(0, (now.getHours() + now.getMinutes() / 60 - 8) / 14));

export default function Today() {
  const nav = useNavigate();
  const [pick, setPick] = useState(false);
  const [weighing, setWeighing] = useState(false);
  const [kg, setKg] = useState<number | null>(null);
  const today = useToday();
  const d = useLiveQuery(async () => {
    const [sessions, templates, water, weights, library, settings, active] = await Promise.all([
      db.sessions.toArray(), db.templates.orderBy('order').toArray(), db.water.toArray(), db.weights.toArray(),
      db.exercises.toArray(), getSettings(), getActiveSession(),
    ]);
    return { sessions, templates, water, weights, library, settings, active };
  }, []);
  if (!d) return <main className="screen" />;

  const now = new Date();
  const lib = new Map(d.library.map(e => [e.id, e]));
  const game = { sessions: d.sessions, water: d.water, weights: d.weights, settings: d.settings, library: d.library };
  const active = d.templates.filter(t => !t.archived);
  const next = nextTemplate(d.templates, d.sessions);
  const done = d.sessions.filter(s => s.endedAt !== null);
  const trainedToday = done.some(s => localDay(new Date(s.startedAt)) === today);
  const isTrainDay = d.settings.trainDays.includes(weekday(today));
  const faiscaMood = mood(d.sessions, d.settings.trainDays, now);
  const { stage } = computeXP(game, now);
  const weights = [...d.weights].sort((a, b) => a.day.localeCompare(b.day));
  const lastW = weights.at(-1);
  const goal = waterGoalMl(d.settings, lastW?.kg);
  const ml = d.water.filter(w => w.day === today).reduce((n, w) => n + w.ml, 0);
  const gotaMood = ml < goal * expectedWaterFraction(now) ? 'sad' : 'happy';
  const refW = [...weights].reverse().find(w => w.day <= addDays(today, -28)) ?? weights[0];
  const delta = lastW && refW && refW !== lastW ? lastW.kg - refW.kg : null;
  const recent = weights.slice(-7), lo = Math.min(...recent.map(w => w.kg)), hi = Math.max(...recent.map(w => w.kg));
  const lastPR = findPRs(d.sessions).at(-1);
  const medals = dailyMedals(today, game);
  const streak = goalWeeksStreak(d.sessions, d.settings.trainDays, now);
  const line = coachLine({ hasRoutine: active.length > 0, trainedToday, isTrainDay, mood: faiscaMood, next: next ? { name: next.name, muscles: musclesOf(next, lib) } : undefined });

  return (
    <main className="screen today">
      {d.settings.demo && <DemoBanner />}

      <header className="hd">
        <div>
          <div className="d">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
          <h1>{greeting(now.getHours())}</h1>
        </div>
        <div className="streak num" aria-label={`${streak} semanas seguidas na meta`}><Icon name="flame" />{streak}</div>
      </header>

      <div className="coach">
        <div className="glow-fire"><Mascot kind="faisca" size={76} stage={stage} mood={faiscaMood} /></div>
        <p className="bubble">{line}</p>
      </div>

      <div className="goals">
        <Bar label={trainedToday ? 'Treino ✓' : isTrainDay ? 'Treino' : 'Folga'} value={trainedToday || !isTrainDay ? 1 : 0} />
        <Bar label={`${fmtNum(ml / 1000)} / ${fmtNum(goal / 1000)} L`} value={ml / goal} tone="water" />
      </div>

      {d.active ? (
        <Link to="/treino/sessao" className="hero-cta">
          <div className="k">Em andamento</div><h2>{d.active.name}</h2>
          <div className="row"><span className="chips"><span>Continue de onde parou</span></span><span className="btn-white"><Icon name="play" />Continuar</span></div>
        </Link>
      ) : next ? (
        <div className="hero-cta">
          <div className="k">{trainedToday ? 'Próximo' : 'Hoje'}</div>
          <h2>{next.name}</h2>
          <div className="s">{musclesOf(next, lib).join(', ') || 'Sem exercícios ainda'}</div>
          <div className="row">
            <div className="chips"><span>{next.items.length} exercícios</span>{active.length > 1 && <button className="swap" onClick={() => setPick(true)}>Trocar</button>}</div>
            <button className="btn-white" onClick={() => nav(startPath(next.id))}><Icon name="play" />Começar</button>
          </div>
        </div>
      ) : (
        <div className="hero-cta">
          <div className="k">Rotina</div><h2>Monte seus treinos</h2>
          <div className="s">Do jeito que você treina: A, B, C… quantos quiser.</div>
          <div className="row"><span /><button className="btn-white" onClick={() => nav('/treino/editar/novo')}><Icon name="plus" />Montar rotina</button></div>
        </div>
      )}

      <div className="pair">
        <WaterCard ml={ml} goal={goal} onAdd={n => logWater(n)} onUndo={() => undoLastWater(localDay(new Date()))} onOpen={() => nav('/agua')}
          badge={<Mascot kind="gota" size={40} mood={gotaMood} interactive={false} />} />
        <button className="tile weight" onClick={() => { setKg(lastW?.kg ?? null); setWeighing(true); }} aria-label="Registrar peso">
          <div className="k">Peso {delta !== null && <span className={`num ${delta <= 0 ? 'down' : 'up'}`}>{delta > 0 ? '+' : delta < 0 ? '−' : ''}{fmtNum(Math.abs(Math.round(delta * 10) / 10))} kg</span>}</div>
          <div className="v num">{lastW ? fmtNum(lastW.kg) : '—'}<small> kg</small></div>
          {recent.length > 1
            ? <div className="bars" aria-hidden="true">{recent.map(w => <i key={w.id} style={{ height: `${30 + (hi > lo ? (w.kg - lo) / (hi - lo) : .5) * 70}%` }} />)}</div>
            : <div className="s">toque para registrar</div>}
        </button>
      </div>

      {lastPR && (
        <Link to={`/progresso/exercicio/${lastPR.exerciseId}`} className="tile pr">
          <div className="glow-steel"><Mascot kind="pedra" size={52} interactive={false} /></div>
          <div><div className="t">Novo recorde: {lib.get(lastPR.exerciseId)?.name ?? 'exercício'}</div>
            <div className="s num"><b>{fmtNum(lastPR.kg)} kg × {lastPR.reps}</b> · {ago(localDay(new Date(lastPR.at)), today)}</div></div>
          <Icon name="chev" className="icon chev" />
        </Link>
      )}

      {medals.length > 0 && (
        <div className="medals-today" aria-label="Medalhas de hoje">
          {medals.map(m => <span key={m} className="medal-chip"><Icon name="trophy" />{MEDALS[m]}</span>)}
        </div>
      )}

      <Sheet open={pick} onClose={() => setPick(false)} title="Qual treino hoje?">
        <div className="menu">
          {active.map(t => <button key={t.id} className="menu-item" onClick={() => nav(startPath(t.id))}><Icon name="play" />{t.name}</button>)}
        </div>
      </Sheet>

      <Sheet open={weighing} onClose={() => setWeighing(false)} title="Peso de hoje">
        <label className="field"><span>Peso (kg)</span><NumberField decimal value={kg} onValue={setKg} autoFocus /></label>
        <button className="btn wide" disabled={!kg || kg < 20 || kg > 400} onClick={async () => { await logWeight(kg!, localDay(new Date())); setWeighing(false); }}>Registrar</button>
      </Sheet>
    </main>
  );
}
