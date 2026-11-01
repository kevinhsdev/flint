import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { copyMeal, deleteFood, getSettings, logWater, saveSettings, undoLastWater } from '../../db/repo';
import { waterGoalMl } from '../../domain/body';
import { addDays } from '../../domain/dates';
import { kcalDays, mealsOfDay, totals } from '../../domain/nutrition';
import type { Macros, Meal } from '../../domain/types';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';
import { play } from '../../ui/sound';
import { useToday } from '../../ui/useToday';
import { WaterCard } from '../../water/WaterCard';
import { FoodSheet, GoalSheet, MealsSheet } from './DietSheets';

const MACROS = [['p', 'Proteína'], ['c', 'Carboidrato'], ['f', 'Gordura']] as const;
const dayName = (day: string, today: string) => day === today ? 'Hoje' : day === addDays(today, -1) ? 'Ontem'
  : new Date(`${day}T12:00`).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });

/** Dieta: kcal e macros do dia contra a meta, refeições anotadas à mão, água e a semana. */
export default function Diet() {
  const today = useToday();
  const nav = useNavigate();
  const [day, setDay] = useState(today);
  const [adding, setAdding] = useState<Meal | null>(null);
  const [sheet, setSheet] = useState<'goal' | 'meals' | null>(null);
  const d = useLiveQuery(async () => {
    const [foods, water, weights, settings] = await Promise.all([db.foods.toArray(), db.water.where('day').equals(today).toArray(), db.weights.orderBy('day').toArray(), getSettings()]);
    return { foods, water, settings, lastKg: weights.at(-1)?.kg };
  }, [today]);
  if (!d) return <main className="screen" />;

  const goal = d.settings.nutritionGoal;
  const meals = mealsOfDay(d.foods, day, d.settings.meals);
  const t = totals(meals.flatMap(m => m.foods));
  const prev = addDays(day, -1);
  const ml = d.water.reduce((n, w) => n + w.ml, 0);

  return (
    <main className="screen diet">
      <header className="rise">
        <div className="eyebrow">{new Date(`${day}T12:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        <h1 className="title">Dieta</h1>
      </header>

      <div className="day-nav">
        <button className="icon-btn" aria-label="Dia anterior" onClick={() => setDay(prev)}><Icon name="back" /></button>
        <b>{dayName(day, today)}</b>
        <button className="icon-btn" aria-label="Próximo dia" disabled={day >= today} onClick={() => setDay(addDays(day, 1))}><Icon name="chev" /></button>
      </div>

      <section className="card diet-hero">
        <div className="card-head">
          <div className="big num" aria-label={`Consumido ${day === today ? 'hoje' : 'no dia'}`}>{fmtNum(t.kcal)}<small> {goal ? `/ ${fmtNum(goal.kcal)} ` : ''}kcal</small></div>
          <button className="pill" aria-label="Definir meta" onClick={() => setSheet('goal')}>Meta</button>
        </div>
        {goal ? (
          <p className="left">{t.kcal <= goal.kcal ? <><b className="num">{fmtNum(goal.kcal - t.kcal)}</b> kcal restantes</> : <><b className="num">{fmtNum(t.kcal - goal.kcal)}</b> kcal acima da meta</>}</p>
        ) : <p className="muted">Defina uma meta de calorias e macros, ou só anote o que comeu.</p>}
        <div className="macros">
          {MACROS.map(([k, label]) => {
            const pct = goal?.[k] ? Math.min(100, Math.round((t[k] / goal[k]) * 100)) : 0;
            return (
              <div key={k} className={`macro m-${k}`}>
                <small>{label}</small>
                <b className="num">{fmtNum(t[k])}{goal ? <i> / {fmtNum(goal[k])} g</i> : <i> g</i>}</b>
                {goal && <div className="track" role="progressbar" aria-label={label} aria-valuenow={pct}><i style={{ width: `${pct}%` }} /></div>}
              </div>
            );
          })}
        </div>
      </section>

      {day === today && <WaterCard ml={ml} goal={waterGoalMl(d.settings, d.lastKg)} onAdd={n => { play('drop'); void logWater(n); }} onUndo={() => undoLastWater(today)} onOpen={() => nav('/agua')} />}

      {meals.map(({ meal, foods, total }) => {
        const again = !foods.length && meal.id && d.foods.some(f => f.day === prev && f.meal === meal.id);
        return (
          <section key={meal.id || 'outros'} className="card meal">
            <div className="card-head"><h2>{meal.name}</h2><span className="muted num">{fmtNum(total.kcal)} kcal</span></div>
            {foods.length > 0 && (
              <ul className="foods">
                {foods.map(f => (
                  <li key={f.id}>
                    <span><b>{f.name}</b><small className="num">{f.qty ? `${f.qty} · ` : ''}P {fmtNum(f.p)} · C {fmtNum(f.c)} · G {fmtNum(f.f)}</small></span>
                    <span className="num">{fmtNum(f.kcal)} kcal</span>
                    <button className="icon-btn" aria-label={`Apagar ${f.name}`} onClick={() => deleteFood(f.id)}><Icon name="trash" /></button>
                  </li>
                ))}
              </ul>
            )}
            {meal.id && (
              <div className="meal-actions">
                <button className="pill" aria-label={`Adicionar em ${meal.name}`} onClick={() => setAdding(meal)}><Icon name="plus" /> Adicionar</button>
                {again && <button className="pill" aria-label={`Repetir ${meal.name.toLowerCase()} de ontem`} onClick={() => copyMeal(prev, day, meal.id)}><Icon name="undo" /> Repetir ontem</button>}
              </div>
            )}
          </section>
        );
      })}
      <button className="btn ghost wide" onClick={() => setSheet('meals')}>Editar refeições</button>

      <Week foods={d.foods} today={today} goal={goal} />

      <FoodSheet meal={adding} day={day} foods={d.foods} onClose={() => setAdding(null)} />
      <GoalSheet open={sheet === 'goal'} onClose={() => setSheet(null)} settings={d.settings} kg={d.lastKg} />
      <MealsSheet open={sheet === 'meals'} onClose={() => setSheet(null)} meals={d.settings.meals} onSave={meals => saveSettings({ meals })} />
    </main>
  );
}

function Week({ foods, today, goal }: { foods: Parameters<typeof kcalDays>[0]; today: string; goal: Macros | null }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const kcal = kcalDays(foods, days);
  const logged = days.filter(x => kcal[x] > 0);
  const avg = logged.length ? Math.round(logged.reduce((n, x) => n + kcal[x], 0) / logged.length) : 0;
  const top = Math.max(goal?.kcal ?? 0, ...days.map(x => kcal[x]), 1);
  return (
    <section className="card">
      <div className="card-head"><h2>Semana</h2><span className="muted num">{logged.length ? `média ${fmtNum(avg)} kcal` : 'sem registros'}</span></div>
      <div className="week-bars" role="img" aria-label={`Últimos 7 dias: média de ${fmtNum(avg)} kcal por dia`}>
        {goal && <span className="goal-line" style={{ bottom: `calc(${goal.kcal / top} * (100% - 18px) + 18px)` }} />}
        {days.map(x => (
          <div key={x} className={x === today ? 'today' : ''}>
            <i style={{ height: `${(kcal[x] / top) * 100}%` }} />
            <small>{new Date(`${x}T12:00`).toLocaleDateString('pt-BR', { weekday: 'narrow' })}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
