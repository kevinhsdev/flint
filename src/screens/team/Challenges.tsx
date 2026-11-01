import { useState } from 'react';
import { addChallenge, deleteChallenge } from '../../db/repo';
import { localDay } from '../../domain/dates';
import { challengeProgress, type ChallengeData } from '../../domain/evolution';
import { CHALLENGE_KINDS, type Challenge, type ChallengeKind } from '../../domain/types';
import { Icon } from '../../ui/Icon';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';

const KIND: Record<ChallengeKind, { label: string; one: string; many: string; def: number }> = {
  treinos: { label: 'Treinos', one: 'treino', many: 'treinos', def: 12 },
  series: { label: 'Séries', one: 'série', many: 'séries', def: 150 },
  cardio: { label: 'Km de cardio', one: 'km de cardio', many: 'km de cardio', def: 20 },
  agua: { label: 'Dias na meta de água', one: 'dia na meta de água', many: 'dias na meta de água', def: 7 },
};
const DAYS = [7, 14, 30] as const;
const title = (c: Pick<Challenge, 'kind' | 'target' | 'days'>) => `${fmtNum(c.target)} ${c.target === 1 ? KIND[c.kind].one : KIND[c.kind].many} em ${c.days} dias`;

/** Desafios com prazo: meta, barra de progresso e dias restantes; concluídos ficam como troféu. */
export function Challenges({ challenges, data }: { challenges: Challenge[]; data: ChallengeData }) {
  const [form, setForm] = useState<{ kind: ChallengeKind; target: number | null; days: number } | null>(null);
  const [del, setDel] = useState<Challenge | null>(null);
  const today = localDay(new Date());
  const rows = challenges.map(c => ({ c, p: challengeProgress(c, data, today) }))
    .sort((a, b) => Number(a.p.done || a.p.over) - Number(b.p.done || b.p.over) || b.c.startDay.localeCompare(a.c.startDay));

  return (
    <section className="card">
      <div className="card-head">
        <h2>Desafios</h2>
        <button className="pill on" aria-label="Novo desafio" onClick={() => setForm({ kind: 'treinos', target: KIND.treinos.def, days: 30 })}><Icon name="plus" /> Novo</button>
      </div>
      {rows.length ? (
        <ul className="challenges">
          {rows.map(({ c, p }) => {
            const pct = Math.min(100, Math.round((p.value / c.target) * 100));
            const state = p.done ? 'done' : p.over ? 'over' : '';
            return (
              <li key={c.id} aria-label={title(c)} className={state}>
                <span className="ch-medal" aria-hidden="true"><Icon name="trophy" /></span>
                <div className="ch-body">
                  <b>{title(c)}</b>
                  <div className="track" role="progressbar" aria-label={`Progresso de ${title(c)}`} aria-valuenow={pct}><i style={{ width: `${pct}%` }} /></div>
                  <small className="num">
                    <span>{fmtNum(p.value)} / {fmtNum(c.target)}</span>
                    <span>{p.done ? 'Concluído' : p.over ? 'Não deu dessa vez' : `${p.daysLeft} ${p.daysLeft === 1 ? 'dia' : 'dias'} restantes`}</span>
                  </small>
                </div>
                <button className="icon-btn" aria-label={`Apagar desafio ${title(c)}`} onClick={() => setDel(c)}><Icon name="trash" /></button>
              </li>
            );
          })}
        </ul>
      ) : <p className="muted">Crie uma meta com prazo, tipo 12 treinos em 30 dias. A Faísca torce por você.</p>}

      <Sheet open={!!form} onClose={() => setForm(null)} title="Novo desafio">
        {form && <>
          <div className="sv-days" role="group" aria-label="Tipo de desafio">
            {CHALLENGE_KINDS.map(k => <button key={k} className={`pill${form.kind === k ? ' on' : ''}`} aria-pressed={form.kind === k} onClick={() => setForm({ ...form, kind: k, target: KIND[k].def })}>{KIND[k].label}</button>)}
          </div>
          <label className="field"><span>Meta</span><NumberField decimal={form.kind === 'cardio'} inputMode={form.kind === 'cardio' ? 'decimal' : 'numeric'} value={form.target} onValue={v => setForm({ ...form, target: v })} /></label>
          <div className="sv-days" role="group" aria-label="Prazo">
            {DAYS.map(n => <button key={n} className={`pill${form.days === n ? ' on' : ''}`} aria-pressed={form.days === n} onClick={() => setForm({ ...form, days: n })}>{n} dias</button>)}
          </div>
          {form.target ? <p className="muted">{title({ ...form, target: form.target })}, a partir de hoje.</p> : null}
          <button className="btn wide" disabled={!form.target || form.target <= 0} onClick={async () => {
            await addChallenge({ kind: form.kind, target: form.target!, days: form.days }, today); setForm(null);
          }}>Começar desafio</button>
        </>}
      </Sheet>

      <Sheet open={!!del} onClose={() => setDel(null)} title="Apagar este desafio?">
        <p className="muted">{del && title(del)}. Seus treinos continuam salvos.</p>
        <div className="row-2">
          <button className="btn ghost" onClick={() => setDel(null)}>Cancelar</button>
          <button className="btn" onClick={async () => { await deleteChallenge(del!.id); setDel(null); }}>Apagar</button>
        </div>
      </Sheet>
    </section>
  );
}
