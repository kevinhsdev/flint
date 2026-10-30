import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getSettings } from '../../db/repo';
import { MUSCLE_NAMES } from '../../domain/exercises';
import { plateau } from '../../domain/plateau';
import { exerciseSeries } from '../../domain/progress';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';
import { BodyWeight } from './BodyWeight';
import { Calendar } from './Calendar';
import { MuscleMap } from './MuscleMap';
import { Photos } from './Photos';

export default function Progress() {
  const d = useLiveQuery(async () => {
    const [sessions, library, weights, photos, settings] = await Promise.all([
      db.sessions.toArray(), db.exercises.toArray(), db.weights.toArray(), db.photos.toArray(), getSettings(),
    ]);
    return { sessions, library, weights, photos, settings };
  }, []);
  if (!d) return <main className="screen" />;

  // só exercícios com histórico, do mais treinado pro menos
  const exercises = d.library
    .map(e => ({ e, series: exerciseSeries(e.id, d.sessions) }))
    .filter(x => x.series.length)
    .sort((a, b) => b.series.length - a.series.length);

  return (
    <main className="screen progress">
      <h1 className="title">Progresso</h1>
      <Calendar sessions={d.sessions} trainDays={d.settings.trainDays} />
      <MuscleMap sessions={d.sessions} lib={d.library} />
      <BodyWeight weights={d.weights} heightCm={d.settings.heightCm} />
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
