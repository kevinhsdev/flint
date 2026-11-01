import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getSettings } from '../../db/repo';
import { waterGoalMl } from '../../domain/body';
import { computeXP, goalWeeksStreak, mood } from '../../domain/gamification';
import { RULES } from '../../domain/rules';
import { Mascot } from '../../mascots/Mascot';
import { Icon } from '../../ui/Icon';
import { Challenges } from './Challenges';
import { Medals } from './Medals';

export default function Team() {
  const d = useLiveQuery(async () => {
    const [sessions, water, weights, library, settings] = await Promise.all([
      db.sessions.toArray(), db.water.toArray(), db.weights.toArray(), db.exercises.toArray(), getSettings(),
    ]);
    return { sessions, water, weights, library, settings, challenges: await db.challenges.toArray() };
  }, []);
  if (!d) return <main className="screen" />;

  const now = new Date();
  const { xp, stage, next } = computeXP(d, now);
  const idx = RULES.stages.findIndex(s => s.id === stage);
  const cur = RULES.stages[idx], up = RULES.stages[idx + 1];
  const pct = next ? (xp - cur.xp) / (next - cur.xp) : 1;
  const weeks = goalWeeksStreak(d.sessions, d.settings.trainDays, now);

  return (
    <main className="screen team">
      <header className="screen-head">
        <div className="hd"><div><div className="d">Seu time</div><h1>{up ? `Rumo à ${up.name}` : 'No topo da chama'}</h1></div></div>
        <Link to="/time/ajustes" className="icon-btn" aria-label="Ajustes"><Icon name="gear" /></Link>
      </header>

      <div className="spot">
        <div><Mascot kind="faisca" size={170} stage={stage} mood={mood(d.sessions, d.settings.trainDays, now)} /></div>
        <h2 className="name">{cur.name}</h2>
        <div className="lv">Estágio {idx + 1} de {RULES.stages.length} · {weeks} {weeks === 1 ? 'semana' : 'semanas'} na meta</div>
        <div className="xp">
          <div className="row num"><span>{up ? <>Faltam {next! - xp} XP para <b>{up.name}</b></> : 'Estágio máximo'}</span><span className="xp-num">{xp} {next ? `/ ${next} ` : ''}XP</span></div>
          <div className="track" role="progressbar" aria-label="XP até o próximo estágio" aria-valuenow={Math.round(pct * 100)}><i style={{ width: `${pct * 100}%` }} /></div>
        </div>
      </div>

      <ul className="evo">
        {RULES.stages.map((s, i) => (
          <li key={s.id} className={i === idx ? 'cur' : i > idx ? 'lock' : ''} aria-label={`${s.name}${i > idx ? ', bloqueado' : ''}`}>
            <span className="slot"><Mascot kind="faisca" stage={s.id} size={44 + i * 6} interactive={false} /></span>{s.name}
          </li>
        ))}
      </ul>

      <div className="pair">
        <div className="tile blue mate"><div><Mascot kind="gota" size={52} /></div><div><b>Gota</b><span>Cuida da água</span></div></div>
        <div className="tile black mate"><div><Mascot kind="pedra" size={52} /></div><div><b>Pedra</b><span>Guarda recordes</span></div></div>
      </div>

      <Challenges challenges={d.challenges} data={{ ...d, waterGoalMl: waterGoalMl(d.settings, [...d.weights].sort((a, b) => a.day.localeCompare(b.day)).at(-1)?.kg) }} />
      <Medals game={d} />
    </main>
  );
}
