import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { addCustomExercise, archiveExercise } from '../../db/repo';
import { fold, MUSCLE_NAMES } from '../../domain/exercises';
import { EQUIPMENT, MUSCLES, type Equipment, type Muscle } from '../../domain/types';
import { Icon } from '../../ui/Icon';

export const EQUIPMENT_NAMES: Record<Equipment, string> = {
  barbell: 'Barra', dumbbell: 'Halteres', machine: 'Máquina', cable: 'Polia', bodyweight: 'Peso corporal',
};

/** Biblioteca: busca sem acento, filtro por músculo, seleção múltipla e exercício próprio. */
export function ExercisePicker({ onPick }: { onPick(ids: string[]): void }) {
  const all = useLiveQuery(() => db.exercises.toArray(), []);
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const list = useMemo(() => {
    const terms = fold(q).split(/\s+/).filter(Boolean);
    return (all ?? [])
      .filter(e => !e.archived && (!muscle || e.primary === muscle))
      .filter(e => { const hay = fold(`${e.name} ${MUSCLE_NAMES[e.primary]}`); return terms.every(t => hay.includes(t)); })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }, [all, q, muscle]);

  const toggle = (id: string) => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]));

  if (creating) return <CreateExercise initialName={q} onDone={id => { setCreating(false); if (id) { setPicked(p => [...p, id]); setQ(''); } }} />;

  return (
    <div className="picker">
      <label className="search">
        <Icon name="search" />
        <input type="search" placeholder="Buscar exercício" aria-label="Buscar exercício" value={q} onChange={e => setQ(e.target.value)} />
      </label>
      <div className="chips-row" data-noswipe>
        <button className={`pill${muscle ? '' : ' on'}`} onClick={() => setMuscle(null)}>Todos</button>
        {MUSCLES.map(m => <button key={m} className={`pill${muscle === m ? ' on' : ''}`} aria-pressed={muscle === m} onClick={() => setMuscle(muscle === m ? null : m)}>{MUSCLE_NAMES[m]}</button>)}
      </div>
      <ul className="ex-list">
        {list.map(e => {
          const on = picked.includes(e.id);
          return (
            <li key={e.id} className="ex-li">
              <button className={`ex-row${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggle(e.id)}>
                <span><b>{e.name}</b><small>{MUSCLE_NAMES[e.primary]} · {EQUIPMENT_NAMES[e.equipment]}</small></span>
                <span className="tick">{on && <Icon name="check" />}</span>
              </button>
              {e.custom && <button className="icon-btn" aria-label={`Arquivar ${e.name}`} onClick={() => { setPicked(p => p.filter(x => x !== e.id)); archiveExercise(e.id); }}><Icon name="trash" /></button>}
            </li>
          );
        })}
        {all && !list.length && <li className="muted pad">Nada encontrado.</li>}
      </ul>
      <div className="picker-bar">
        <button className="btn ghost" onClick={() => setCreating(true)}><Icon name="plus" /> Criar exercício</button>
        <button className="btn" disabled={!picked.length} onClick={() => onPick(picked)}>Adicionar {picked.length || ''}</button>
      </div>
    </div>
  );
}

function CreateExercise({ initialName, onDone }: { initialName: string; onDone(id?: string): void }) {
  const [name, setName] = useState(initialName);
  const [primary, setPrimary] = useState<Muscle>('peito');
  const [equipment, setEquipment] = useState<Equipment>('dumbbell');
  const ok = name.trim().length > 1;
  return (
    <form className="form" onSubmit={async e => { e.preventDefault(); if (ok) onDone(await addCustomExercise({ name: name.trim(), primary, secondary: [], equipment })); }}>
      <label className="field"><span>Nome do exercício</span><input type="text" value={name} onChange={e => setName(e.target.value)} autoFocus /></label>
      <label className="field"><span>Músculo principal</span>
        <select value={primary} onChange={e => setPrimary(e.target.value as Muscle)}>{MUSCLES.map(m => <option key={m} value={m}>{MUSCLE_NAMES[m]}</option>)}</select>
      </label>
      <label className="field"><span>Equipamento</span>
        <select value={equipment} onChange={e => setEquipment(e.target.value as Equipment)}>{EQUIPMENT.map(q => <option key={q} value={q}>{EQUIPMENT_NAMES[q]}</option>)}</select>
      </label>
      <div className="picker-bar">
        <button type="button" className="btn ghost" onClick={() => onDone()}>Voltar</button>
        <button className="btn" disabled={!ok}>Criar</button>
      </div>
    </form>
  );
}
