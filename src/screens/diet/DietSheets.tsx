import { useEffect, useState } from 'react';
import { addSavedMeal, deleteSavedMeal, logFood, saveMeal, saveSettings, uid } from '../../db/repo';
import { frequentFoods, kcalFrom, suggestGoal } from '../../domain/nutrition';
import type { Food, Macros, Meal, SavedMeal, Settings } from '../../domain/types';
import { Icon } from '../../ui/Icon';
import { fmtNum, NumberField } from '../../ui/NumberField';
import { Sheet } from '../../ui/Sheet';

type Draft = { name: string; qty: string; kcal: number | null; p: number | null; c: number | null; f: number | null };
const EMPTY: Draft = { name: '', qty: '', kcal: null, p: null, c: null, f: null };
const GRAMS = [['p', 'Proteína (g)'], ['c', 'Carboidrato (g)'], ['f', 'Gordura (g)']] as const;

/** Anotar um alimento: nome, porção e macros; kcal em branco sai dos macros. Frequentes preenchem tudo num toque. */
export function FoodSheet({ meal, day, foods, saved, onClose }: { meal: Meal | null; day: string; foods: Food[]; saved: SavedMeal[]; onClose(): void }) {
  const [x, setX] = useState<Draft>(EMPTY);
  useEffect(() => { if (meal) setX(EMPTY); }, [meal]);
  const kcal = x.kcal ?? kcalFrom(x.p ?? 0, x.c ?? 0, x.f ?? 0);
  const ok = x.name.trim() && kcal > 0;
  const quick = frequentFoods(foods);

  return (
    <Sheet open={!!meal} onClose={onClose} title={meal ? `Adicionar em ${meal.name}` : ''}>
      {saved.length > 0 && (
        <ul className="saved-meals" role="group" aria-label="Refeições salvas">
          {saved.map(s => (
            <li key={s.id}>
              <button onClick={async () => { await addSavedMeal(s, day, meal!.id); onClose(); }}>
                <b>{s.name}</b><small className="num">{s.foods.length} {s.foods.length === 1 ? 'item' : 'itens'} · {fmtNum(s.foods.reduce((n, f) => n + f.kcal, 0))} kcal</small>
              </button>
              <button className="icon-btn" aria-label={`Apagar refeição salva ${s.name}`} onClick={() => deleteSavedMeal(s.id)}><Icon name="trash" /></button>
            </li>
          ))}
        </ul>
      )}
      {quick.length > 0 && (
        <div className="quick-foods" role="group" aria-label="Frequentes">
          {quick.map(f => (
            <button key={f.id} className="chip" onClick={() => setX({ name: f.name, qty: f.qty, kcal: f.kcal, p: f.p, c: f.c, f: f.f })}>
              {f.name} <small className="num">{fmtNum(f.kcal)} kcal</small>
            </button>
          ))}
        </div>
      )}
      <label className="field"><span>Alimento</span><input value={x.name} onChange={e => setX({ ...x, name: e.target.value })} placeholder="Ex.: arroz, frango, whey" autoComplete="off" enterKeyHint="next" autoFocus /></label>
      <label className="field"><span>Quantidade</span><input value={x.qty} onChange={e => setX({ ...x, qty: e.target.value })} placeholder="Ex.: 150 g, 2 un" autoComplete="off" /></label>
      <div className="macro-fields">
        {GRAMS.map(([k, label]) => <label key={k} className="field"><span>{label}</span><NumberField decimal value={x[k]} onValue={v => setX({ ...x, [k]: v })} /></label>)}
      </div>
      <label className="field"><span>Calorias (kcal)</span><NumberField value={x.kcal} onValue={v => setX({ ...x, kcal: v })} placeholder="calculada pelos macros" /></label>
      <p className="muted num food-kcal">{`${fmtNum(kcal)} kcal`}</p>
      <button className="btn wide" disabled={!ok} onClick={async () => {
        await logFood({ day, meal: meal!.id, name: x.name.trim(), qty: x.qty.trim(), kcal: Math.round(kcal), p: x.p ?? 0, c: x.c ?? 0, f: x.f ?? 0 });
        onClose();
      }}>Adicionar</button>
    </Sheet>
  );
}

/** Meta de kcal e macros: digitada ou sugerida pelo perfil (peso, altura, idade, dias de treino, objetivo). */
export function GoalSheet({ open, onClose, settings, kg }: { open: boolean; onClose(): void; settings: Settings; kg?: number }) {
  const [g, setG] = useState<Record<keyof Macros, number | null>>({ kcal: null, p: null, c: null, f: null });
  useEffect(() => { if (open) setG(settings.nutritionGoal ?? { kcal: null, p: null, c: null, f: null }); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const canSuggest = !!kg && !!settings.heightCm;
  const suggest = (sex: 'm' | 'f') => setG(suggestGoal({
    kg: kg!, cm: settings.heightCm!, age: settings.profile?.age ?? 30, sex, trainDays: settings.trainDays.length, goal: settings.profile?.goal ?? 'condicionamento',
  }));

  return (
    <Sheet open={open} onClose={onClose} title="Meta diária">
      {canSuggest ? (
        <>
          <p className="muted">Sugerir pelo seu perfil ({fmtNum(kg!)} kg, {settings.heightCm} cm, {settings.trainDays.length} treinos por semana):</p>
          <div className="row-2">
            <button className="pill" onClick={() => suggest('m')}>Masculino</button>
            <button className="pill" onClick={() => suggest('f')}>Feminino</button>
          </div>
        </>
      ) : <p className="muted">Registre peso e altura pra receber uma sugestão, ou digite sua meta.</p>}
      <label className="field"><span>Calorias (kcal)</span><NumberField value={g.kcal} onValue={v => setG({ ...g, kcal: v })} /></label>
      <div className="macro-fields">
        {GRAMS.map(([k, label]) => <label key={k} className="field"><span>{label}</span><NumberField value={g[k]} onValue={v => setG({ ...g, [k]: v })} /></label>)}
      </div>
      {g.p !== null && g.c !== null && g.f !== null && <p className="muted num">Macros somam {fmtNum(kcalFrom(g.p, g.c, g.f))} kcal.</p>}
      <p className="muted small">É um ponto de partida, não substitui nutricionista.</p>
      <button className="btn wide" disabled={!g.kcal} onClick={async () => {
        await saveSettings({ nutritionGoal: { kcal: Math.round(g.kcal!), p: g.p ?? 0, c: g.c ?? 0, f: g.f ?? 0 } }); onClose();
      }}>Salvar meta</button>
      {settings.nutritionGoal && <button className="btn ghost wide" onClick={async () => { await saveSettings({ nutritionGoal: null }); onClose(); }}>Remover meta</button>}
    </Sheet>
  );
}

/** Quantas refeições, nomes e ordem. Apagar uma refeição não apaga o que foi anotado nela (vai pra "Outros"). */
export function MealsSheet({ open, onClose, meals, onSave }: { open: boolean; onClose(): void; meals: Meal[]; onSave(m: Meal[]): Promise<unknown> }) {
  const [list, setList] = useState(meals);
  useEffect(() => { if (open) setList(meals); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = list.filter(m => m.name.trim());
  const move = (i: number) => setList(l => { const n = [...l]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; });

  return (
    <Sheet open={open} onClose={onClose} title="Refeições do dia">
      <ul className="meal-edit">
        {list.map((m, i) => (
          <li key={m.id}>
            <input aria-label={`Nome da refeição ${i + 1}`} value={m.name} onChange={e => setList(l => l.map(x => x.id === m.id ? { ...x, name: e.target.value } : x))} />
            <button className="icon-btn" aria-label={`Subir ${m.name}`} disabled={i === 0} onClick={() => move(i)}><Icon name="back" className="icon up" /></button>
            <button className="icon-btn" aria-label={`Remover ${m.name}`} disabled={list.length === 1} onClick={() => setList(l => l.filter(x => x.id !== m.id))}><Icon name="trash" /></button>
          </li>
        ))}
      </ul>
      <button className="btn ghost wide" onClick={() => setList(l => [...l, { id: uid(), name: '' }])}><Icon name="plus" /> Nova refeição</button>
      <button className="btn wide" disabled={!valid.length} onClick={async () => { await onSave(valid.map(m => ({ ...m, name: m.name.trim() }))); onClose(); }}>Salvar refeições</button>
    </Sheet>
  );
}

/** Guardar a refeição do dia como pronta, pra adicionar tudo de uma vez outro dia. */
export function SaveMealSheet({ meal, foods, onClose }: { meal: Meal | null; foods: Food[]; onClose(): void }) {
  const [name, setName] = useState('');
  useEffect(() => { if (meal) setName(meal.name); }, [meal]);
  return (
    <Sheet open={!!meal} onClose={onClose} title="Salvar refeição pronta">
      <p className="muted">{foods.map(f => f.name).join(', ')}</p>
      <label className="field"><span>Nome</span><input value={name} onChange={e => setName(e.target.value)} placeholder="Ex.: marmita, pré-treino" autoComplete="off" /></label>
      <button className="btn wide" disabled={!name.trim()} onClick={async () => { await saveMeal(name.trim(), foods); onClose(); }}>Salvar</button>
    </Sheet>
  );
}
