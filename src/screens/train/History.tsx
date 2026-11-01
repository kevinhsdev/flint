import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { deleteSession } from '../../db/repo';
import { sessionStats } from '../../domain/progress';
import { findPRs } from '../../domain/strength';
import { pace } from '../../domain/training';
import type { Session } from '../../domain/types';
import { Empty } from '../../ui/Empty';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';

const month = (t: number) => new Date(t).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
const day = (t: number) => new Date(t).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');

export default function History() {
  const nav = useNavigate();
  const data = useLiveQuery(async () => {
    const all = await db.sessions.toArray();
    return { all, lib: await db.exercises.toArray() };
  }, []);
  const [del, setDel] = useState<Session | null>(null);
  if (!data) return <main className="screen" />;

  const done = data.all.filter(s => s.endedAt !== null).sort((a, b) => b.startedAt - a.startedAt);
  const prCount = new Map<string, number>();
  for (const p of findPRs(data.all)) prCount.set(p.sessionId, (prCount.get(p.sessionId) ?? 0) + 1);
  const name = (id: string) => data.lib.find(e => e.id === id)?.name ?? 'Exercício removido';
  const groups = new Map<string, Session[]>();
  for (const s of done) { const k = month(s.startedAt); groups.set(k, [...(groups.get(k) ?? []), s]); }

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav('/treino')}><Icon name="back" /></button>
        <h1 className="title sm">Histórico</h1>
        <span />
      </header>

      {!done.length && <Empty kind="pedra" text="Seus treinos concluídos aparecem aqui." />}

      {[...groups].map(([m, list]) => (
        <section key={m} className="month">
          <h2 className="month-title">{m}</h2>
          <ul className="hist">
            {list.map(s => {
              const st = sessionStats(s, data.lib), prs = prCount.get(s.id) ?? 0;
              const trash = <button className="icon-btn" aria-label={`Excluir ${s.name} de ${day(s.startedAt)}`} onClick={() => setDel(s)}><Icon name="trash" /></button>;
              // registro rápido: não tem séries pra editar
              if (s.kind) return (
                <li key={s.id}>
                  <div className={`hist-item quick-${s.kind}`}>
                    <div className="hist-top"><b>{s.name}</b><span className="muted">{day(s.startedAt)}</span></div>
                    <div className="hist-meta num">
                      {s.kind === 'checkin' && <span className="kind">Check-in</span>}
                      <span>{st.durationMin} min</span>
                      {s.cardio?.km ? <span>{fmtNum(s.cardio.km)} km</span> : null}
                      {s.cardio && pace(s.cardio) && <span>{pace(s.cardio)}</span>}
                    </div>
                  </div>
                  {trash}
                </li>
              );
              return (
                <li key={s.id}>
                  <Link to={`/treino/sessao?edit=${s.id}`} className="hist-item" aria-label={`Abrir ${s.name} de ${day(s.startedAt)}`}>
                    <div className="hist-top"><b>{s.name}</b><span className="muted">{day(s.startedAt)}</span></div>
                    <div className="hist-meta num">
                      <span>{st.durationMin} min</span><span>{fmtNum(st.volumeKg)} kg</span>
                      {prs > 0 && <span className="gold">{prs} {prs === 1 ? 'recorde' : 'recordes'}</span>}
                    </div>
                    <small className="hist-ex">{s.entries.filter(e => e.sets.some(x => x.done)).map(e => name(e.exerciseId)).join(' · ')}</small>
                  </Link>
                  {trash}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <Sheet open={!!del} onClose={() => setDel(null)} title="Excluir este treino?">
        <p className="muted">{del && `${del.name}, ${day(del.startedAt)}.`} O XP, os recordes e as medalhas desse treino somem junto. Não dá pra desfazer.</p>
        <div className="row-2">
          <button className="btn ghost" onClick={() => setDel(null)}>Cancelar</button>
          <button className="btn" onClick={async () => { await deleteSession(del!.id); setDel(null); }}>Sim, excluir</button>
        </div>
      </Sheet>
    </main>
  );
}
