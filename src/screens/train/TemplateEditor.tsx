import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { uid, upsertTemplate } from '../../db/repo';
import { toggleGroup } from '../../domain/training';
import type { Template, TemplateItem } from '../../domain/types';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useReorder } from '../../ui/useReorder';
import { ExercisePicker } from './ExercisePicker';

const DEFAULT_ITEM = { sets: 3, repMin: 8, repMax: 12, restSec: 90 };
const clampInt = (v: string, min: number, max: number) => Math.min(max, Math.max(min, Math.round(Number(v) || min)));

export default function TemplateEditor() {
  const { id = 'novo' } = useParams();
  const nav = useNavigate();
  const names = useLiveQuery(async () => new Map((await db.exercises.toArray()).map(e => [e.id, e.name])), []);
  const [t, setT] = useState<Template | null>(null);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    (async () => {
      const found = id !== 'novo' ? await db.templates.get(id) : undefined;
      setT(found ?? { id: uid(), name: '', order: await db.templates.count(), items: [], archived: false });
    })();
  }, [id]);

  const setItems = (items: TemplateItem[]) => setT(x => x && { ...x, items });
  const { list, rows, dragging, grip } = useReorder(t?.items ?? [], setItems);
  if (!t) return <main className="screen" />;

  const patch = (i: number, p: Partial<TemplateItem>) => setItems(t.items.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const ok = t.name.trim().length > 0;

  return (
    <main className="screen">
      <header className="screen-head">
        <button className="icon-btn" aria-label="Voltar" onClick={() => nav(-1)}><Icon name="back" /></button>
        <h1 className="title sm">{id === 'novo' ? 'Novo treino' : 'Editar treino'}</h1>
        <span />
      </header>

      <label className="field">
        <span>Nome</span>
        <input type="text" value={t.name} placeholder="Ex.: A — Peito e tríceps" onChange={e => setT({ ...t, name: e.target.value })} />
      </label>

      <ul className="items" ref={list as React.RefObject<HTMLUListElement>}>
        {rows.map((it, i) => (
          <li key={`${it.exerciseId}-${i}`} data-reorder className={`item${dragging === i ? ' dragging' : ''}${it.group && rows[i + 1]?.group === it.group ? ' ss-next' : ''}`}>
            <div className="item-head">
              <span className="grip" aria-label="Arrastar" {...grip(i)}><Icon name="grip" /></span>
              <b>{names?.get(it.exerciseId) ?? '…'}</b>
              {i < rows.length - 1 && (() => {
                const on = !!it.group && rows[i + 1].group === it.group, n = names?.get(it.exerciseId) ?? 'exercício';
                return <button className={`icon-btn ss-link${on ? ' on' : ''}`} aria-pressed={on} onClick={() => setItems(toggleGroup(t.items, i, uid))}
                  aria-label={on ? `Superset: separar ${n} do próximo` : `Superset: juntar ${n} com o próximo`}><Icon name="link" /></button>;
              })()}
              <button className="icon-btn" aria-label={`Remover ${names?.get(it.exerciseId) ?? 'exercício'}`} onClick={() => setItems(t.items.filter((_, j) => j !== i))}><Icon name="trash" /></button>
            </div>
            <div className="item-fields">
              <label><span>Séries</span><input type="number" inputMode="numeric" value={it.sets} onChange={e => patch(i, { sets: clampInt(e.target.value, 1, 10) })} /></label>
              <label><span>Reps mín.</span><input type="number" inputMode="numeric" value={it.repMin} onChange={e => { const repMin = clampInt(e.target.value, 1, 50); patch(i, { repMin, repMax: Math.max(repMin, it.repMax) }); }} /></label>
              <label><span>Reps máx.</span><input type="number" inputMode="numeric" value={it.repMax} onChange={e => patch(i, { repMax: Math.max(it.repMin, clampInt(e.target.value, 1, 50)) })} /></label>
              <label><span>Descanso (s)</span><input type="number" inputMode="numeric" step={15} value={it.restSec} onChange={e => patch(i, { restSec: clampInt(e.target.value, 0, 600) })} /></label>
            </div>
          </li>
        ))}
      </ul>

      <button className="btn ghost" onClick={() => setPicking(true)}><Icon name="plus" /> Adicionar exercícios</button>
      <button className="btn wide" disabled={!ok} onClick={async () => { await upsertTemplate({ ...t, name: t.name.trim() }); nav('/treino'); }}>Salvar</button>

      <Sheet open={picking} onClose={() => setPicking(false)} title="Exercícios">
        <ExercisePicker onPick={ids => { setItems([...t.items, ...ids.map(exerciseId => ({ exerciseId, ...DEFAULT_ITEM }))]); setPicking(false); }} />
      </Sheet>
    </main>
  );
}
