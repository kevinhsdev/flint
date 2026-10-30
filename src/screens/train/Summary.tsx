import { MUSCLE_NAMES } from '../../domain/exercises';
import { sessionStats } from '../../domain/progress';
import type { PR } from '../../domain/strength';
import type { Exercise, Session } from '../../domain/types';
import type { StageId } from '../../domain/rules';
import { Mascot } from '../../mascots/Mascot';
import { prCard } from '../../share/cards';
import { shareImage } from '../../share/share';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';

const CHEER = { name: 'comemorar', key: 1 } as const;

/** Gera o cartão do recorde e abre o compartilhar do sistema. */
export async function sharePR(pr: PR, name: string, stage: StageId) {
  await shareImage(await prCard(pr, name, stage), `flint-recorde-${pr.exerciseId}.png`);
}

export function Summary({ session, lib, prs, xp, stage, onDone }: { session: Session; lib: Exercise[]; prs: PR[]; xp: number; stage: StageId; onDone(): void }) {
  const st = sessionStats(session, lib);
  const name = (id: string) => lib.find(e => e.id === id)?.name ?? id;
  return (
    <main className="screen summary">
      <div className="cheer">
        <Mascot kind="gota" size={84} act={CHEER} />
        <Mascot kind="faisca" size={110} act={CHEER} />
        <Mascot kind="pedra" size={84} act={CHEER} />
      </div>
      <h1 className="title">Treino concluído</h1>
      <p className="muted">{session.name}</p>
      <div className="stats">
        <div><small>Duração</small><b className="num">{st.durationMin} min</b></div>
        <div><small>Volume</small><b className="num">{fmtNum(st.volumeKg)} kg</b></div>
        <div className="xp-gain"><small>XP</small><b className="num">+{xp} XP</b></div>
      </div>
      {prs.length > 0 && (
        <section className="prs">
          <h2>{prs.length === 1 ? 'Novo recorde' : `${prs.length} novos recordes`}</h2>
          <ul>{prs.map((p, i) => (
            <li key={i}>
              <b>{name(p.exerciseId)}</b><span className="num">{fmtNum(p.kg)} kg × {p.reps}</span>
              <button className="icon-btn share-pr" aria-label={`Compartilhar recorde de ${name(p.exerciseId)}`} onClick={() => sharePR(p, name(p.exerciseId), stage)}><Icon name="share" /></button>
            </li>
          ))}</ul>
        </section>
      )}
      {st.muscles.length > 0 && <p className="muted">Músculos: {st.muscles.map(m => MUSCLE_NAMES[m]).join(', ')}</p>}
      <button className="btn wide" onClick={onDone}>Concluir</button>
    </main>
  );
}
