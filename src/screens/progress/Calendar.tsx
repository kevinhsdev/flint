import { addDays, weekday, weekStart } from '../../domain/dates';
import { dayIntensity } from '../../domain/progress';
import type { Session } from '../../domain/types';
import { useToday } from '../../ui/useToday';
import type { ReactNode } from 'react';

const WEEKS = 26;

interface Props {
  trainDays: number[];
  sessions?: Session[];
  /** intensidade 0–1 por dia; sem ela, usa o volume dos treinos */
  intensity?: (days: string[]) => Record<string, number>;
  unit?: [one: string, many: string];
  tone?: 'water';
  children?: ReactNode;
}

/** Mapa de calor das últimas 26 semanas: colunas = semanas, linhas = seg…dom. */
export function Calendar({ sessions = [], trainDays, intensity, unit = ['treino', 'treinos'], tone, children }: Props) {
  const today = useToday();
  const first = addDays(weekStart(today), -7 * (WEEKS - 1));
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(first, i));
  const heat = intensity ? intensity(days) : dayIntensity(sessions, days);
  const trained = days.filter(d => heat[d] > 0).length;
  return (
    <section className="card">
      <div className="card-head"><h2>Frequência</h2><span className="muted num">{trained} {trained === 1 ? unit[0] : unit[1]} em 6 meses</span></div>
      {children}
      <div className={`heat${tone ? ` ${tone}` : ''}`} role="img" aria-label={`${trained} ${trained === 1 ? unit[0] : unit[1]} nas últimas ${WEEKS} semanas`}>
        {days.map(d => {
          const v = heat[d], future = d > today, off = !trainDays.includes(weekday(d));
          return <i key={d} title={d} className={future ? 'future' : v ? 'on' : off ? 'off' : ''} style={v ? { opacity: .35 + v * .65 } : undefined} />;
        })}
      </div>
    </section>
  );
}
