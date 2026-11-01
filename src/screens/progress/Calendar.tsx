import { addDays, weekday, weekStart } from '../../domain/dates';
import { dayIntensity } from '../../domain/progress';
import type { Session } from '../../domain/types';
import { useToday } from '../../ui/useToday';
import { useState, type ReactNode } from 'react';

const RANGES = [[26, '6 meses'], [53, '1 ano']] as const;

interface Props {
  trainDays: number[];
  sessions?: Session[];
  /** intensidade 0–1 por dia; sem ela, usa o volume dos treinos */
  intensity?: (days: string[]) => Record<string, number>;
  unit?: [one: string, many: string];
  tone?: 'water';
  children?: ReactNode;
}

/** Mapa de calor de 6 meses ou do ano: colunas = semanas, linhas = seg…dom. */
export function Calendar({ sessions = [], trainDays, intensity, unit = ['treino', 'treinos'], tone, children }: Props) {
  const today = useToday();
  const [[WEEKS, span], setRange] = useState<(typeof RANGES)[number]>(RANGES[0]);
  const first = addDays(weekStart(today), -7 * (WEEKS - 1));
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDays(first, i));
  const heat = intensity ? intensity(days) : dayIntensity(sessions, days);
  const trained = days.filter(d => heat[d] > 0).length;
  return (
    <section className="card">
      <div className="card-head"><h2>Frequência</h2><span className="muted num">{trained} {trained === 1 ? unit[0] : unit[1]} em {span}</span></div>
      <div className="seg sm" role="group" aria-label="Período">
        {RANGES.map(r => <button key={r[0]} className={r[0] === WEEKS ? 'on' : ''} aria-pressed={r[0] === WEEKS} onClick={() => setRange(r)}>{r[1]}</button>)}
      </div>
      {children}
      <div className={`heat${tone ? ` ${tone}` : ''}${WEEKS > 26 ? ' year' : ''}`} role="img" aria-label={`${trained} ${trained === 1 ? unit[0] : unit[1]} nas últimas ${WEEKS} semanas`}>
        {days.map(d => {
          const v = heat[d], future = d > today, off = !trainDays.includes(weekday(d));
          return <i key={d} title={d} className={future ? 'future' : v ? 'on' : off ? 'off' : ''} style={v ? { opacity: .35 + v * .65 } : undefined} />;
        })}
      </div>
    </section>
  );
}
