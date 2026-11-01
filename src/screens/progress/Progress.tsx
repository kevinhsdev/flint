import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getSettings } from '../../db/repo';
import { MUSCLE_NAMES } from '../../domain/exercises';
import { plateau } from '../../domain/plateau';
import { exerciseSeries } from '../../domain/progress';
import { findPRs } from '../../domain/strength';
import { monthName, monthOf, monthWrapped } from '../../domain/wrapped';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';
import { BodyWeight } from './BodyWeight';
import { Calendar } from './Calendar';
import { MuscleMap } from './MuscleMap';
import { Photos } from './Photos';
import { Lifetime, Measures } from './Measures';
import { DietTrend } from './DietTrend';
import { localDay } from '../../domain/dates';

export default function Progress() {
  const d = useLiveQuery(async () => {
    const [sessions, library, weights, photos, settings] = await Promise.all([
      db.sessions.toArray(), db.exercises.toArray(), db.weights.toArray(), db.photos.toArray(), getSettings(),
    ]);
    return { sessions, library, weights, photos, settings, water: await db.water.toArray(), measures: await db.measures.toArray(), foods: await db.foods.toArray() };
  }, []);
  if (!d) return <main className="screen" />;

  // só exercícios com histórico, do mais treinado pro menos
  const exercises = d.library
    .map(e => ({ e, series: exerciseSeries(e.id, d.sessions) }))
    .filter(x => x.series.length)
    .sort((a, b) => b.series.length - a.series.length);

  // retrospectiva sob demanda: o mês passado (completo) ou, sem treino nele, o atual
  const recap = [monthOf(new Date(), -1), monthOf(new Date())].find(m => monthWrapped(m, d));

  // último recorde de cada exercício, do mais recente pro mais antigo
  const lib = new Map(d.library.map(e => [e.id, e]));
  const records = [...findPRs(d.sessions)].reverse().filter((p, i, all) => all.findIndex(q => q.exerciseId === p.exerciseId) === i).slice(0, 8);

  return (
    <main className="screen progress">
      <header className="rise">
        <div className="eyebrow">{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
        <h1 className="title">Progresso</h1>
      </header>
      {records.length > 0 && (
        <section className="rise" style={{ '--i': 1 } as CSSProperties}>
          <h2 className="sec-title">Recordes</h2>
          <ul className="pr-row" aria-label="Recordes">
            {records.map((p, i) => (
              <li key={p.exerciseId}>
                <Link to={`/progresso/exercicio/${p.exerciseId}`} className={`pr-card c${i % 4}`}>
                  <small>{lib.get(p.exerciseId)?.name ?? 'Exercício'}</small>
                  <b className="num">{fmtNum(p.kg)}<i> kg × {p.reps}</i></b>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {recap && (
        <Link to={`/progresso/retrospectiva/${recap}`} className="recap-link">
          <Icon name="flame" /><span>Sua retrospectiva de {monthName(recap)}</span><Icon name="chev" />
        </Link>
      )}
      <Calendar sessions={d.sessions} trainDays={d.settings.trainDays} />
      <Lifetime sessions={d.sessions} />
      <MuscleMap sessions={d.sessions} lib={d.library} />
      <BodyWeight weights={d.weights} heightCm={d.settings.heightCm} goalKg={d.settings.weightGoalKg} />
      <Measures measures={d.measures} />
      <DietTrend foods={d.foods} today={localDay(new Date())} />
      <section className="card">
        <div className="card-head"><h2>Exercícios</h2></div>
        {exercises.length ? (
          <ul className="ex-progress">
            {exercises.map(({ e, series }) => {
              const first = series[0].maxKg, last = series.at(-1)!.maxKg;
              const stuck = plateau(e.id, d.sessions, new Date());
              return (
                <li key={e.id}>
                  <Link to={`/progresso/exercicio/${e.id}`} aria-label={`${e.name}: ${fmtNum(last)} kg`}>
                    <span><b>{e.name}{stuck && <i className="badge-stuck">Platô</i>}</b><small>{MUSCLE_NAMES[e.primary]} · {series.length} {series.length === 1 ? 'treino' : 'treinos'}</small></span>
                    <span className="num">{fmtNum(last)} kg{last > first && <small className="down"> +{fmtNum(last - first)}</small>}</span>
                    <Icon name="chev" />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : <p className="muted">Conclua um treino e a evolução de cada exercício aparece aqui.</p>}
      </section>
      <Photos photos={d.photos} />
    </main>
  );
}
