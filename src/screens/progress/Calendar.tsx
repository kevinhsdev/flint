import { addDays, localDay, weekday, weekStart } from '../../domain/dates';
import { dayIntensity } from '../../domain/progress';
import type { Session } from '../../domain/types';

const WEEKS = 26;

/** Mapa de calor das últimas 26 semanas: colunas = semanas, linhas = seg…dom. */
export function Calendar({ sessions, trainDays }: { sessions: Session[]; trainDays: number[] }) {
  const today = localDay(new Date());
  const first = addDays(weekStart(today), -7 * (WEEKS - 1));
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(first, i));
  const heat = dayIntensity(sessions, days);
  const trained = days.filter(d => heat[d] > 0).length;
  return (
    <section className="card">
      <div className="card-head"><h2>Frequência</h2><span className="muted num">{trained} treinos em 6 meses</span></div>
      <div className="heat" role="img" aria-label={`${trained} dias de treino nas últimas ${WEEKS} semanas`}>
        {days.map(d => {
          const v = heat[d], future = d > today, off = !trainDays.includes(weekday(d));
          return <i key={d} title={d} className={future ? 'future' : v ? 'on' : off ? 'off' : ''} style={v ? { opacity: .35 + v * .65 } : undefined} />;
        })}
      </div>
    </section>
  );
}
