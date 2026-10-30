import { useState } from 'react';
import { addDays, weekStart } from '../../domain/dates';
import { MUSCLE_NAMES } from '../../domain/exercises';
import { muscleSets } from '../../domain/progress';
import { MUSCLES, type Exercise, type Muscle, type Session } from '../../domain/types';
import { useToday } from '../../ui/useToday';
import { BACK, BACK_LINES, FRONT, FRONT_LINES, SILHOUETTE } from './anatomy';

// escala por séries na semana (referência comum: ~10–20 séries por músculo é volume alto)
const LEVELS = [
  { min: 0, label: '0', cls: 'l0' },
  { min: 1, label: '1–5', cls: 'l1' },
  { min: 6, label: '6–11', cls: 'l2' },
  { min: 12, label: '12+', cls: 'l3' },
];
const level = (n: number) => LEVELS.findLast(l => n >= l.min)!.cls;
const series = (n: number) => { const r = Math.round(n); return `${r} ${r === 1 ? 'série' : 'séries'}`; };

/** Corpo anatômico, frente e costas: cada músculo acende pelas séries feitas na semana. */
export function MuscleMap({ sessions, lib }: { sessions: Session[]; lib: Exercise[] }) {
  const today = useToday(), from = weekStart(today);
  const sets = muscleSets(sessions, from, addDays(from, 6), lib);
  const [picked, setPicked] = useState<Muscle | null>(null);
  const worked = MUSCLES.filter(m => sets[m] > 0).sort((a, b) => sets[b] - sets[a]);

  const body = (paths: Partial<Record<Muscle, string>>, label: string) => (
    <figure>
      <svg viewBox="30 6 140 388" aria-label={label} role="group">
        <path d={SILHOUETTE} className="sil" />
        {(Object.keys(paths) as Muscle[]).map(m => (
          <path key={m} d={paths[m]} data-muscle={m} className={`mus ${level(sets[m])}${picked === m ? ' picked' : ''}`}
            role="button" tabIndex={0} aria-label={`${MUSCLE_NAMES[m]}: ${series(sets[m])}`}
            onClick={() => setPicked(p => (p === m ? null : m))}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPicked(p => (p === m ? null : m)); } }} />
        ))}
        <path d={paths === FRONT ? FRONT_LINES : BACK_LINES} className="abs-lines" />
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  );

  return (
    <section className="card muscle-card">
      <div className="card-head"><h2>Músculos da semana</h2></div>
      <div className="bodies">{body(FRONT, 'Frente')}{body(BACK, 'Costas')}</div>
      <p className="mm-pick" role="status">
        {picked ? <><b>{MUSCLE_NAMES[picked]}</b> · {series(sets[picked])} esta semana</>
          : worked.length ? <>Mais treinado: <b>{MUSCLE_NAMES[worked[0]]}</b> · toque num músculo para ver as séries</>
            : 'Nenhum treino nesta semana ainda.'}
      </p>
      <div className="mm-legend" aria-label="Escala de séries na semana">
        {LEVELS.map(l => <span key={l.cls}><i className={`mus ${l.cls}`} />{l.label}</span>)}
      </div>
    </section>
  );
}
