import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getSettings } from '../../db/repo';
import { waterGoalMl } from '../../domain/body';
import { bmiCopy, planSummary } from '../../domain/plan';
import { Mascot } from '../../mascots/Mascot';
import { fmtNum } from '../../ui/NumberField';
import { Glass } from '../../water/Glass';
import { startPath } from '../train/Routine';
import { MILESTONES } from './steps';

const GOTA_ACT = { name: 'gotinha', key: 1 } as const;
const CHEER = { name: 'comemorar', key: 1 } as const;
type Screen = 'diag' | 'strategy' | 'water' | 'expect' | 'start';
const BANDS = ['Abaixo', 'Referência', 'Sobrepeso', 'Obesidade'];
// posição do IMC no medidor: 15 → 0%, 40 → 100%
const meterPct = (v: number) => Math.min(100, Math.max(0, ((v - 15) / 25) * 100));

export default function YourPlan() {
  const nav = useNavigate();
  const mode = (useLocation().state as { mode?: 'generate' | 'keep' | 'own' } | null)?.mode ?? 'generate';
  const screens: Screen[] = mode === 'generate' ? ['diag', 'strategy', 'water', 'expect', 'start'] : ['diag', 'water', 'expect', 'start'];
  const [i, setI] = useState(0);
  const [glassMl, setGlassMl] = useState(0);
  const d = useLiveQuery(async () => ({
    s: await getSettings(),
    kg: (await db.weights.orderBy('day').last())?.kg,
    templates: (await db.templates.toArray()).filter(t => !t.archived).sort((a, b) => a.order - b.order),
  }), []);
  const screen = screens[i];
  const goal = d ? waterGoalMl(d.s, d.kg) : 0;

  // o copo enche até a meta logo depois que a tela entra
  useEffect(() => {
    if (screen !== 'water') return;
    const t = setTimeout(() => setGlassMl(goal), 250);
    return () => clearTimeout(t);
  }, [screen, goal]);

  if (!d?.s.profile) return <main className="screen" />;
  const p = d.s.profile;
  const bmi = d.kg && d.s.heightCm ? bmiCopy(d.kg, d.s.heightCm, p.age) : null;
  const sum = planSummary(p);
  const first = d.templates[0];

  return (
    <main className="screen your-plan">
      <div className="sv-bar" role="progressbar" aria-label="Seu plano" aria-valuemin={1} aria-valuemax={screens.length} aria-valuenow={i + 1}>
        <i style={{ width: `${((i + 1) / screens.length) * 100}%` }} />
      </div>

      <section className="yp-screen" key={screen}>
        {screen === 'diag' && (
          <>
            <p className="yp-kicker">Diagnóstico</p>
            <h1 className="title">Seu ponto de partida</h1>
            {bmi && (
              <>
                <div className="yp-bmi"><b className="num">{bmi.value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</b><span>IMC</span></div>
                <div className="yp-meter" aria-hidden="true"><i style={{ left: `${meterPct(bmi.value)}%` }} /></div>
                <div className="yp-meter-labels" aria-hidden="true">{BANDS.map(b => <span key={b}>{b}</span>)}</div>
                <p className="yp-text">{bmi.text}</p>
              </>
            )}
          </>
        )}

        {screen === 'strategy' && (
          <>
            <p className="yp-kicker">Sua estratégia</p>
            <h1 className="title">{sum.split}</h1>
            <p className="yp-text">{sum.why}</p>
            <p className="muted">{sum.reps[0]} a {sum.reps[1]} repetições · {sum.restSec} s de descanso</p>
            <ul className="yp-list">{d.templates.map(t => <li key={t.id}><b>{t.name}</b><span>{t.items.length} exercícios</span></li>)}</ul>
          </>
        )}

        {screen === 'water' && (
          <>
            <p className="yp-kicker">Sua água</p>
            <h1 className="title">{fmtNum(goal / 1000)} L por dia</h1>
            <div className="yp-water">
              <Glass ml={glassMl} goal={goal} size="sm" />
              <Mascot kind="gota" size={84} act={GOTA_ACT} />
            </div>
            <p className="yp-text">35 ml por kg do seu peso, até 4,5 L. A Gota lembra você ao longo do dia, e a meta se ajusta quando o peso muda.</p>
          </>
        )}

        {screen === 'expect' && (
          <>
            <p className="yp-kicker">O que esperar</p>
            <h1 className="title">Os próximos 3 meses</h1>
            <ol className="yp-steps">
              {MILESTONES[p.goal].map((m, k) => <li key={k}><b>{(k + 1) * 4} semanas</b><span>{m}</span></li>)}
            </ol>
            <p className="yp-text">O Flint sugere a próxima carga a cada treino, comemora seus recordes e guarda a sua sequência.</p>
          </>
        )}

        {screen === 'start' && (
          <>
            <div className="yp-hero"><Mascot kind="faisca" size={120} act={CHEER} /></div>
            <h1 className="title">Tudo pronto</h1>
            <p className="yp-text">{mode === 'own' ? 'Monte seus treinos na aba Treino. O resto já está ajustado.' : 'Seu primeiro treino já está esperando.'}</p>
          </>
        )}
      </section>

      <footer className="sv-foot">
        {screen !== 'start' && <button className="btn wide" onClick={() => setI(i + 1)}>Continuar</button>}
        {screen === 'start' && mode !== 'own' && first && (
          <button className="btn wide" onClick={() => nav(startPath(first.id))}>Começar meu primeiro treino</button>
        )}
        {screen === 'start' && (
          <button className={`btn wide${mode !== 'own' && first ? ' ghost' : ''}`} onClick={() => nav('/treino')}>{mode === 'own' ? 'Montar meu treino' : 'Ver minha rotina'}</button>
        )}
      </footer>
    </main>
  );
}
