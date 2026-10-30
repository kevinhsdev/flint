import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { db } from '../../db/db';
import { applySurvey, getSettings, loadDemo } from '../../db/repo';
import { DEFAULT_SETTINGS } from '../../domain/settings';
import type { Goal, Level, Place, Profile } from '../../domain/types';
import type { MascotAct } from '../../mascots/engine';
import { Mascot } from '../../mascots/Mascot';
import { Icon } from '../../ui/Icon';
import { NumberField } from '../../ui/NumberField';
import { GOALS, inRange, LEVELS, MINUTES, PLACES, RANGES, STEP_LINES, STEP_TITLES, WEEKDAYS, type Option, type StepId } from './steps';

interface Draft {
  goal?: Goal; level?: Level; days: number[]; minutes?: Profile['minutes']; place?: Place; own?: boolean;
  kg: number | null; cm: number | null; age: number | null; trainTime: string;
}
type Mode = 'generate' | 'keep' | 'own';

const FIRST: StepId[] = ['goal', 'level', 'days', 'minutes', 'place', 'own', 'body', 'time'];
// refazendo, "já tem treino?" vira a escolha final entre gerar e manter
const REDO: StepId[] = FIRST.filter(s => s !== 'own');

function Cards<T>({ options, value, onPick }: { options: Option<T>[]; value?: T; onPick(v: T): void }) {
  return (
    <div className="sv-opts">
      {options.map(o => (
        <button key={String(o.value)} className={`sv-opt${o.value === value ? ' on' : ''}`} aria-pressed={o.value === value} onClick={() => onPick(o.value)}>
          <b>{o.label}</b><span>{o.hint}</span>
        </button>
      ))}
    </div>
  );
}

function BodyField({ label, value, range, unit, decimal, onValue }: { label: string; value: number | null; range: readonly [number, number]; unit: string; decimal?: boolean; onValue(n: number | null): void }) {
  const bad = value !== null && !inRange(value, range);
  return (
    <label className="field">
      <span>{label}</span>
      <NumberField value={value} decimal={decimal} onValue={onValue} aria-invalid={bad} />
      {bad && <small className="sv-err">Entre {range[0]} e {range[1]} {unit}</small>}
    </label>
  );
}

export default function Survey() {
  const nav = useNavigate();
  const redo = useSearchParams()[0].has('refazer');
  const steps = redo ? REDO : FIRST;
  const [i, setI] = useState(0);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [d, setD] = useState<Draft>({ days: [], kg: null, cm: null, age: null, trainTime: DEFAULT_SETTINGS.trainTime });
  const set = (p: Partial<Draft>) => setD(x => ({ ...x, ...p }));

  useEffect(() => {
    void (async () => {
      const s = await getSettings();
      setDemo(s.demo);
      if (!redo || !s.profile) return;
      const kg = (await db.weights.orderBy('day').last())?.kg ?? null;
      setD({ ...s.profile, kg, cm: s.heightCm, trainTime: s.trainTime });
    })();
  }, [redo]);

  const step = steps[i];
  const last = i === steps.length - 1;
  const act = useMemo<{ name: MascotAct; key: number } | undefined>(
    () => (i === 0 ? { name: 'acenar', key: i } : last ? { name: 'comemorar', key: i } : undefined), [i, last]);

  const valid: Record<StepId, boolean> = {
    goal: !!d.goal, level: !!d.level, days: d.days.length >= 2 && d.days.length <= 6, minutes: !!d.minutes, place: !!d.place,
    own: d.own !== undefined,
    body: inRange(d.kg, RANGES.kg) && inRange(d.cm, RANGES.cm) && inRange(d.age, RANGES.age),
    time: /^\d{2}:\d{2}$/.test(d.trainTime),
  };

  async function finish(mode: Mode) {
    setBusy(true);
    const p: Profile = { goal: d.goal!, level: d.level!, days: d.days, minutes: d.minutes!, place: d.place!, age: Math.round(d.age!) };
    await applySurvey(p, { kg: d.kg!, cm: Math.round(d.cm!), trainTime: d.trainTime }, mode);
    nav('/bem-vindo/plano', { state: { mode } });
  }

  const toggleDay = (n: number) => set({ days: d.days.includes(n) ? d.days.filter(x => x !== n) : d.days.length < 6 ? [...d.days, n] : d.days });

  return (
    <main className="screen survey">
      <header className="sv-top">
        {i > 0 || redo
          ? <button className="icon-btn" aria-label="Voltar" onClick={() => (i > 0 ? setI(i - 1) : nav(-1))}><Icon name="back" /></button>
          : <span className="icon-btn" />}
        <div className="sv-bar" role="progressbar" aria-label="Progresso da pesquisa" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1}>
          <i style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
        </div>
      </header>

      <div className="sv-guide">
        <Mascot kind="faisca" size={64} act={act} />
        <p className="sv-bubble" key={step}>{STEP_LINES[step]}</p>
      </div>

      <section className="sv-step" key={step}>
        <h1 className="title">{STEP_TITLES[step]}</h1>
        {step === 'goal' && <Cards options={GOALS} value={d.goal} onPick={goal => set({ goal })} />}
        {step === 'level' && <Cards options={LEVELS} value={d.level} onPick={level => set({ level })} />}
        {step === 'minutes' && <Cards options={MINUTES} value={d.minutes} onPick={minutes => set({ minutes })} />}
        {step === 'place' && <Cards options={PLACES} value={d.place} onPick={place => set({ place })} />}
        {step === 'own' && <Cards options={[
          { value: false, label: 'Monte um para mim', hint: 'Treino pronto pelo seu objetivo' },
          { value: true, label: 'Tenho meu treino, quero montar eu mesmo', hint: 'Você começa com a rotina vazia' },
        ]} value={d.own} onPick={own => set({ own })} />}
        {step === 'days' && (
          <>
            <div className="sv-days">
              {WEEKDAYS.map(([n, l]) => {
                const on = d.days.includes(n);
                return <button key={n} className={`pill${on ? ' on' : ''}`} aria-pressed={on} onClick={() => toggleDay(n)}>{l}</button>;
              })}
            </div>
            <p className="muted">{d.days.length} {d.days.length === 1 ? 'dia' : 'dias'} por semana</p>
          </>
        )}
        {step === 'body' && (
          <div className="sv-body">
            <BodyField label="Peso (kg)" value={d.kg} range={RANGES.kg} unit="kg" decimal onValue={kg => set({ kg })} />
            <BodyField label="Altura (cm)" value={d.cm} range={RANGES.cm} unit="cm" onValue={cm => set({ cm })} />
            <BodyField label="Idade" value={d.age} range={RANGES.age} unit="anos" onValue={age => set({ age })} />
          </div>
        )}
        {step === 'time' && (
          <label className="field"><span>Horário</span>
            <input type="time" value={d.trainTime} onChange={e => set({ trainTime: e.target.value })} />
          </label>
        )}
      </section>

      <footer className="sv-foot">
        {!last && <button className="btn wide" disabled={!valid[step]} onClick={() => setI(i + 1)}>Continuar</button>}
        {last && !redo && <button className="btn wide" disabled={!valid.time || busy} onClick={() => finish(d.own ? 'own' : 'generate')}>Ver meu plano</button>}
        {last && redo && (
          <>
            <button className="btn wide" disabled={!valid.time || busy} onClick={() => finish('generate')}>Gerar novo plano</button>
            <button className="btn ghost wide" disabled={!valid.time || busy} onClick={() => finish('keep')}>Manter minha rotina</button>
          </>
        )}
        {i === 0 && !redo && !demo && (
          <button className="sv-skip" onClick={async () => { await loadDemo(); nav('/'); }}>Só quero explorar</button>
        )}
      </footer>
    </main>
  );
}
