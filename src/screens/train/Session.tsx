import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { db } from '../../db/db';
import { discardSession, finishSession, getActiveSession, getSettings, startSession, updateSession } from '../../db/repo';
import { computeXP, type GameData } from '../../domain/gamification';
import { lastEntryFor } from '../../domain/routine';
import { findPRs, suggestOverload, type PR } from '../../domain/strength';
import type { Exercise, Session, SetLog, Template, TemplateItem } from '../../domain/types';
import { Mascot } from '../../mascots/Mascot';
import type { MascotAct } from '../../mascots/engine';
import { Icon } from '../../ui/Icon';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';
import { ExercisePicker } from './ExercisePicker';
import { PlateCalc } from './PlateCalc';
import { RestTimer } from './RestTimer';
import { Summary } from './Summary';

const FREE_ITEM = { sets: 3, repMin: 8, repMax: 12, restSec: 90 };

interface Ctx { history: Session[]; lib: Map<string, Exercise>; tpl?: Template; game: Omit<GameData, 'sessions'> }

const sessionPRs = (s: Session, history: Session[]) =>
  findPRs([...history, { ...s, endedAt: s.endedAt ?? Date.now() }]).filter(p => p.sessionId === s.id);

export default function SessionScreen() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [s, setS] = useState<Session | null>(null);
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [rest, setRest] = useState<{ endsAt: number; total: number } | null>(null);
  const [picker, setPicker] = useState<{ swap?: number } | null>(null);
  const [exMenu, setExMenu] = useState<number | null>(null);
  const [plate, setPlate] = useState<number | null>(null);
  const [menu, setMenu] = useState(false);
  const [pedra, setPedra] = useState<{ name: MascotAct; key: number }>();
  const [summary, setSummary] = useState<{ session: Session; prs: PR[]; xp: number } | null>(null);
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return; // StrictMode roda o efeito duas vezes; a sessão só pode nascer uma
    once.current = true;
    (async () => {
      const start = params.get('start'), edit = params.get('edit');
      let active = edit ? await db.sessions.get(edit) : await getActiveSession();
      if (!active && start) { await startSession(start === 'livre' ? null : start); active = await getActiveSession(); }
      if (!active) { nav(edit ? '/treino/historico' : '/treino', { replace: true }); return; }
      if (start) nav('/treino/sessao', { replace: true });
      const [sessions, library, water, weights, settings] = await Promise.all([
        db.sessions.toArray(), db.exercises.toArray(), db.water.toArray(), db.weights.toArray(), getSettings(),
      ]);
      setCtx({
        history: sessions.filter(x => x.id !== active.id),
        lib: new Map(library.map(e => [e.id, e])),
        tpl: active.templateId ? await db.templates.get(active.templateId) : undefined,
        game: { water, weights, settings, library },
      });
      setS(active);
    })();
  }, [nav, params]);

  const endRest = useCallback(() => setRest(null), []);

  if (summary && ctx) return <Summary {...summary} lib={ctx.game.library} onDone={() => nav('/treino')} />;
  if (!s || !ctx) return <main className="screen" />;

  // em andamento grava a cada mudança; editando o histórico, só ao salvar
  const editing = s.endedAt !== null;
  const save = (next: Session) => { setS(next); if (!editing) void updateSession(next); };
  const update = (fn: (x: Session) => void) => { const next = structuredClone(s); fn(next); save(next); };
  const itemOf = (exerciseId: string): TemplateItem => ctx.tpl?.items.find(i => i.exerciseId === exerciseId) ?? { exerciseId, ...FREE_ITEM };
  const prs = sessionPRs(s, ctx.history);
  const isPR = (exerciseId: string, x: SetLog) => x.done && prs.some(p => p.exerciseId === exerciseId && p.kg === x.kg && p.reps === x.reps);
  const doneCount = s.entries.reduce((n, e) => n + e.sets.filter(x => x.done).length, 0);

  function toggle(ei: number, si: number) {
    const e = s!.entries[ei], set = e.sets[si];
    if (set.done) { update(x => { x.entries[ei].sets[si].done = false; }); return; }
    const item = itemOf(e.exerciseId), last = lastEntryFor(e.exerciseId, ctx!.history);
    const before = prs.filter(p => p.exerciseId === e.exerciseId).length;
    const next = structuredClone(s!);
    const ns = next.entries[ei].sets[si];
    if (!ns.reps) ns.reps = last?.sets[si]?.reps || item.repMin;
    ns.done = true;
    save(next);
    const after = sessionPRs(next, ctx!.history).filter(p => p.exerciseId === e.exerciseId).length;
    if (after > before) { setPedra({ name: 'flex', key: Date.now() }); navigator.vibrate?.([30, 40, 30]); }
    if (item.restSec > 0 && !editing) setRest({ endsAt: Date.now() + item.restSec * 1000, total: item.restSec });
  }

  async function finish() {
    if (!doneCount) { setMenu(true); return; }
    await finishSession(s!.id);
    const finished = { ...s!, endedAt: Date.now() };
    const today = new Date();
    const xp = computeXP({ ...ctx!.game, sessions: [...ctx!.history, finished] }, today).xp - computeXP({ ...ctx!.game, sessions: ctx!.history }, today).xp;
    setRest(null);
    setSummary({ session: finished, prs: sessionPRs(finished, ctx!.history), xp });
  }

  const addExercises = (ids: string[]) => {
    const swap = picker?.swap;
    update(x => {
      if (swap !== undefined) x.entries[swap] = { exerciseId: ids[0], sets: x.entries[swap].sets.map(() => ({ kg: 0, reps: 0, done: false })) };
      else for (const id of ids) x.entries.push({ exerciseId: id, sets: Array.from({ length: FREE_ITEM.sets }, () => ({ kg: 0, reps: 0, done: false })) });
    });
    setPicker(null);
  };

  return (
    <main className="screen session">
      <header className="screen-head">
        <div className="session-title">
          <Mascot kind="pedra" size={52} act={pedra} interactive={false} />
          <div><small className="muted">{editing ? 'Editando' : 'Em andamento'}</small><h1 className="title sm">{s.name}</h1></div>
        </div>
        {editing
          ? <button className="icon-btn" aria-label="Cancelar edição" onClick={() => nav('/treino/historico')}><Icon name="close" /></button>
          : <button className="icon-btn" aria-label="Opções do treino" onClick={() => setMenu(true)}><Icon name="more" /></button>}
      </header>

      {s.entries.map((e, ei) => {
        const ex = ctx.lib.get(e.exerciseId), item = itemOf(e.exerciseId), last = lastEntryFor(e.exerciseId, ctx.history);
        const tip = ex && suggestOverload(item, last, ex.equipment);
        return (
          <section key={ei} className="ex-card">
            <div className="ex-head">
              <b>{ex?.name ?? 'Exercício'}</b>
              {ex?.equipment === 'barbell' && <button className="icon-btn" aria-label="Calcular anilhas" onClick={() => setPlate(ei)}><span className="plate-ico" /></button>}
              <button className="icon-btn" aria-label={`Opções de ${ex?.name ?? 'exercício'}`} onClick={() => setExMenu(ei)}><Icon name="more" /></button>
            </div>
            {tip && <p className="tip"><b>Pedra:</b> {tip.text}</p>}
            <div className="sets" role="table">
              <div className="set-row head" role="row"><span>#</span><span>Última</span><span>kg</span><span>Reps</span><span /></div>
              {e.sets.map((x, si) => {
                const prev = last?.sets[si];
                return (
                  <div key={si} role="row" className={`set-row${x.done ? ' done' : ''}${isPR(e.exerciseId, x) ? ' pr' : ''}`}>
                    <span className="num">{si + 1}</span>
                    <span className="num muted">{prev ? `${fmtNum(prev.kg)}×${prev.reps}` : '—'}</span>
                    <NumberField decimal aria-label={`Carga da série ${si + 1}`} value={x.kg || null} placeholder={prev ? fmtNum(prev.kg) : '0'}
                      onValue={n => update(y => { y.entries[ei].sets[si].kg = n ?? 0; })} />
                    <NumberField aria-label={`Reps da série ${si + 1}`} value={x.reps || null} placeholder={String(prev?.reps || item.repMin)}
                      onValue={n => update(y => { y.entries[ei].sets[si].reps = Math.round(n ?? 0); })} />
                    <button className="check" aria-pressed={x.done} aria-label={`Concluir série ${si + 1}`} onClick={() => toggle(ei, si)}><Icon name="check" /></button>
                  </div>
                );
              })}
            </div>
            <button className="add-set" onClick={() => update(y => { const sets = y.entries[ei].sets; const l = sets.at(-1); sets.push({ kg: l?.kg ?? 0, reps: 0, done: false }); })}>
              <Icon name="plus" /> Série
            </button>
          </section>
        );
      })}

      <button className="btn ghost" onClick={() => setPicker({})}><Icon name="plus" /> Adicionar exercício</button>
      {editing
        ? <button className="btn wide" onClick={async () => { await updateSession(s); nav('/treino/historico'); }}>Salvar</button>
        : <button className="btn wide" onClick={finish}>Finalizar</button>}

      {rest && <RestTimer {...rest} onChange={endsAt => setRest({ ...rest, endsAt })} onDone={endRest} />}

      <Sheet open={!!picker} onClose={() => setPicker(null)} title={picker?.swap !== undefined ? 'Trocar exercício' : 'Adicionar exercício'}>
        <ExercisePicker onPick={addExercises} />
      </Sheet>

      <Sheet open={exMenu !== null} onClose={() => setExMenu(null)} title={ctx.lib.get(s.entries[exMenu ?? 0]?.exerciseId)?.name ?? ''}>
        <div className="menu">
          <button className="menu-item" onClick={() => { setPicker({ swap: exMenu! }); setExMenu(null); }}><Icon name="undo" /> Trocar exercício</button>
          <button className="menu-item danger" onClick={() => { const i = exMenu!; setExMenu(null); update(x => { x.entries.splice(i, 1); }); }}><Icon name="trash" /> Remover</button>
        </div>
      </Sheet>

      <Sheet open={menu} onClose={() => setMenu(false)} title={doneCount ? 'Treino' : 'Nenhuma série concluída'}>
        {!doneCount && <p className="muted">Marque pelo menos uma série para salvar. Ou descarte este treino.</p>}
        <div className="menu">
          <button className="menu-item danger" onClick={async () => { await discardSession(s.id); nav('/treino'); }}><Icon name="trash" /> Descartar treino</button>
        </div>
      </Sheet>

      {plate !== null && (
        <PlateCalc open kg={s.entries[plate]?.sets.find(x => !x.done)?.kg ?? 0} onClose={() => setPlate(null)}
          onKg={kg => update(x => { for (const set of x.entries[plate].sets) if (!set.done) set.kg = kg; })} />
      )}
    </main>
  );
}
