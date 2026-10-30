import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getSettings } from '../../db/repo';
import { MUSCLE_NAMES } from '../../domain/exercises';
import { computeXP } from '../../domain/gamification';
import { monthName, monthWrapped } from '../../domain/wrapped';
import { Mascot } from '../../mascots/Mascot';
import type { MascotKind } from '../../mascots/engine';
import { wrappedCard } from '../../share/cards';
import { shareImage } from '../../share/share';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';

const CHEER = { name: 'comemorar', key: 1 } as const;

interface Panel { kicker: string; big: string; text: string; who: MascotKind; tone?: 'water' }

/** Retrospectiva do mês em telas cheias, estilo Stories: toque à direita avança, à esquerda volta. */
export default function WrappedScreen() {
  const { month = '' } = useParams();
  const nav = useNavigate();
  const [i, setI] = useState(0);
  const [card, setCard] = useState<{ blob: Blob; url: string } | null>(null);
  const d = useLiveQuery(async () => {
    const [sessions, water, weights, library, settings] = await Promise.all([
      db.sessions.toArray(), db.water.toArray(), db.weights.toArray(), db.exercises.toArray(), getSettings()]);
    return { sessions, water, weights, library, settings };
  }, []);
  const w = useMemo(() => (d ? monthWrapped(month, d) : null), [d, month]);
  const stage = d ? computeXP(d, new Date()).stage : 'faisca';
  const name = monthName(month);
  const panels: Panel[] = !w ? [] : [
    { kicker: `Seu ${name}`, big: String(w.workouts), text: `${w.workouts === 1 ? 'treino' : 'treinos'}, ${fmtNum(w.minutes)} minutos de ferro.`, who: 'faisca' },
    { kicker: 'Volume', big: w.volumeKg >= 1000 ? `${fmtNum(Math.round(w.volumeKg / 100) / 10)} t` : `${fmtNum(w.volumeKg)} kg`, text: 'levantados no mês, somando cada série.', who: 'pedra' },
    { kicker: 'Recordes', big: String(w.prs.length), text: w.prs.length ? 'vezes que você foi mais longe do que nunca.' : 'recordes desta vez. O próximo mês é seu.', who: 'faisca' },
    { kicker: 'Sequência', big: String(w.bestStreakDays), text: 'treinos seguidos sem faltar num dia marcado.', who: 'faisca' },
    { kicker: 'Água', big: String(w.waterGoalDays), text: `${w.waterGoalDays === 1 ? 'dia' : 'dias'} batendo a meta de água.`, who: 'gota', tone: 'water' },
    { kicker: 'Mais treinado', big: w.topMuscle ? MUSCLE_NAMES[w.topMuscle] : '—', text: 'o músculo que mais recebeu séries.', who: 'pedra' },
  ];
  const last = !!w && i === panels.length; // depois dos 6 painéis: o cartão

  useEffect(() => {
    if (!last || !w || card) return;
    wrappedCard(w, name, stage).then(blob => setCard({ blob, url: URL.createObjectURL(blob) })).catch(() => {});
  }, [last, w, card, name, stage]);
  useEffect(() => () => { if (card) URL.revokeObjectURL(card.url); }, [card]);

  if (!d) return <main className="wrapped" />;
  if (!w) return (
    <main className="screen pad">
      <h1 className="title">Nada em {name}</h1>
      <p className="muted">A retrospectiva aparece quando o mês tem pelo menos um treino.</p>
      <button className="btn wide" onClick={() => nav('/progresso')}>Voltar</button>
    </main>
  );

  const p = panels[i];
  const go = (n: number) => setI(Math.max(0, Math.min(panels.length, n)));
  return (
    <main className={`wrapped${p?.tone === 'water' ? ' water' : ''}`}
      onClick={e => { if (!last) go(e.clientX - e.currentTarget.getBoundingClientRect().left < e.currentTarget.clientWidth / 3 ? i - 1 : i + 1); }}>
      <div className="wr-bars" aria-hidden="true">{[...panels, null].map((_, k) => <i key={k} className={k < i ? 'full' : k === i ? 'now' : ''} />)}</div>
      <button className="icon-btn wr-close" aria-label="Fechar" onClick={e => { e.stopPropagation(); nav('/progresso'); }}><Icon name="close" /></button>
      {p && (
        <section className="wr-panel" key={i} aria-live="polite">
          <div className="wr-mascot"><Mascot kind={p.who} size={150} stage={p.who === 'faisca' ? stage : undefined} act={CHEER} interactive={false} /></div>
          <p className="wr-kicker">{p.kicker}</p>
          <b className="wr-big num">{p.big}</b>
          <p className="wr-text">{p.text}</p>
          <p className="wr-hint">Toque para continuar</p>
        </section>
      )}
      {last && (
        <section className="wr-panel wr-final" key="card">
          {card ? <img className="wr-card" src={card.url} alt={`Retrospectiva de ${name}`} /> : <div className="wr-card" aria-busy="true" />}
          <button className="btn wide" disabled={!card} onClick={() => card && shareImage(card.blob, `flint-${month}.png`)}><Icon name="share" /> Compartilhar</button>
          <button className="btn ghost wide" onClick={() => go(0)}>Ver de novo</button>
        </section>
      )}
    </main>
  );
}
