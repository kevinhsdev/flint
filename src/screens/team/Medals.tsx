import { allDays, dailyMedals, milestones, type GameData, type MedalId } from '../../domain/gamification';
import { findPRs } from '../../domain/strength';
import { localDay } from '../../domain/dates';
import { RULES } from '../../domain/rules';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';

const DAILY: [MedalId, string][] = [['treino', 'Treinou'], ['hidratado', 'Hidratado'], ['recorde', 'Recorde'], ['dia-completo', 'Dia completo']];

/** Todos os marcos possíveis, na ordem em que costumam vir. */
const CATALOG: [string, string][] = [
  ...RULES.milestones.workouts.map(n => [`treinos-${n}`, n === 1 ? 'Primeiro treino' : `${n} treinos`] as [string, string]),
  [`agua-${RULES.milestones.waterStreakDays}`, `${RULES.milestones.waterStreakDays} dias hidratado`],
  ...RULES.milestones.goalWeeks.map(n => [`semanas-${n}`, `${n} semanas na meta`] as [string, string]),
  ...RULES.milestones.volumeKg.map(n => [`volume-${n}`, `${fmtNum(n / 1000)} t levantadas`] as [string, string]),
];

export function Medals({ game }: { game: GameData }) {
  const today = new Date();
  const prDays = new Set(findPRs(game.sessions).map(p => localDay(new Date(p.at))));
  const count = Object.fromEntries(DAILY.map(([id]) => [id, 0])) as Record<MedalId, number>;
  for (const day of allDays(game, today)) for (const m of dailyMedals(day, game, prDays)) count[m]++;
  const got = new Set(milestones(game, today));

  return (
    <section className="card">
      <div className="card-head"><h2>Medalhas</h2><span className="muted num">{got.size} de {CATALOG.length} marcos</span></div>
      <ul className="medals">
        {DAILY.map(([id, label]) => (
          <li key={id} className={count[id] ? 'got' : ''} aria-label={`${label}: ${count[id]} vezes`}>
            <span className="medal"><Icon name="trophy" /></span><b>{label}</b><small className="num">{count[id]}×</small>
          </li>
        ))}
      </ul>
      <ul className="milestones">
        {CATALOG.map(([id, label]) => (
          <li key={id} className={got.has(id) ? 'got' : ''} aria-label={`${label}${got.has(id) ? '' : ', bloqueado'}`}>
            <span className="medal"><Icon name={got.has(id) ? 'spark' : 'trophy'} /></span><small>{label}</small>
          </li>
        ))}
      </ul>
    </section>
  );
}
