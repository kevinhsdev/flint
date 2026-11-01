import { weeklyNutrition } from '../../domain/nutrition';
import type { Food } from '../../domain/types';
import { fmtNum } from '../../ui/NumberField';

/** Evolução da dieta: média diária de kcal por semana nas últimas 8 semanas. */
export function DietTrend({ foods, today }: { foods: Food[]; today: string }) {
  const weeks = weeklyNutrition(foods, today);
  const last = weeks.filter(w => w.days).at(-1);
  const top = Math.max(...weeks.map(w => w.kcal), 1);
  return (
    <section className="card">
      <div className="card-head"><h2>Dieta</h2><span className="muted">média por dia anotado</span></div>
      {last ? <>
        <p className="diet-avg"><b className="num">{fmtNum(last.kcal)} kcal</b> · {fmtNum(last.p)} g de proteína</p>
        <div className="diet-weeks" role="img" aria-label={`Média diária de kcal nas últimas ${weeks.length} semanas`}>
          {weeks.map(w => <i key={w.week} className={w.days ? 'on' : ''} style={{ height: `${(w.kcal / top) * 100}%` }} title={`${w.week}: ${w.kcal} kcal`} />)}
        </div>
      </> : <p className="muted">Anote suas refeições na aba Dieta e a evolução aparece aqui.</p>}
    </section>
  );
}
