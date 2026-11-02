import { useState } from 'react';
import { Link } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { getShopping, saveShopping, uid } from '../../db/repo';
import { shoppingList, type ShopItem } from '../../domain/shopping';
import { Icon } from '../../ui/Icon';
import { fmtNum } from '../../ui/NumberField';

/** Lista de compras: monta das refeições salvas (quantas vezes na semana), marca o que já pegou. */
export default function Shopping() {
  const [times, setTimes] = useState<Record<string, number>>({});
  const [item, setItem] = useState('');
  const d = useLiveQuery(async () => ({ items: await getShopping(), saved: await db.savedMeals.toArray() }), []);
  if (!d) return <main className="screen" />;

  const set = (items: ShopItem[]) => saveShopping(items);
  const picks = d.saved.map(meal => ({ meal, times: times[meal.id] ?? 0 }));
  const bump = (id: string, n: number) => setTimes(t => ({ ...t, [id]: Math.max(0, Math.min(14, (t[id] ?? 0) + n)) }));
  const fromMeals = async () => {
    await set([...d.items, ...shoppingList(picks).map(x => ({ ...x, id: uid(), done: false }))]);
    setTimes({});
  };
  const addItem = async () => {
    if (!item.trim()) return;
    await set([...d.items, { id: uid(), name: item.trim(), qty: '', done: false }]);
    setItem('');
  };
  const done = d.items.filter(i => i.done).length;

  return (
    <main className="screen shopping">
      <header className="rise water-head">
        <Link to="/dieta" className="icon-btn" aria-label="Voltar para Dieta"><Icon name="back" /></Link>
        <div className="eyebrow">{d.items.length ? `${done} de ${d.items.length} no carrinho` : 'Dieta'}</div>
        <h1 className="title">Lista de compras</h1>
      </header>

      {d.saved.length > 0 && (
        <section className="card">
          <div className="card-head"><h2>Das refeições salvas</h2></div>
          <ul className="foods">
            {d.saved.map(s => (
              <li key={s.id}>
                <span><b>{s.name}</b><small className="num">{fmtNum(s.foods.reduce((n, f) => n + f.kcal, 0))} kcal · {times[s.id] ? `${times[s.id]}× na semana` : 'fora da lista'}</small></span>
                <button className="icon-btn" aria-label={`Menos ${s.name}`} disabled={!times[s.id]} onClick={() => bump(s.id, -1)}>−</button>
                <b className="num">{times[s.id] ?? 0}</b>
                <button className="icon-btn" aria-label={`Mais ${s.name}`} onClick={() => bump(s.id, 1)}><Icon name="plus" /></button>
              </li>
            ))}
          </ul>
          <button className="btn wide" disabled={!picks.some(p => p.times > 0)} onClick={fromMeals}>Adicionar à lista</button>
        </section>
      )}

      <section className="card">
        <form className="scan-code" onSubmit={e => { e.preventDefault(); void addItem(); }}>
          <label className="field"><span>Item</span><input value={item} onChange={e => setItem(e.target.value)} placeholder="Ex.: sabão, café" autoComplete="off" enterKeyHint="done" /></label>
          <button className="btn" disabled={!item.trim()}>Adicionar</button>
        </form>
        {d.items.length > 0 ? (
          <ul className="foods shop-list" aria-label="Itens">
            {d.items.map(i => (
              <li key={i.id} className={i.done ? 'done' : ''}>
                <label>
                  <input type="checkbox" checked={i.done} aria-label={i.qty ? `${i.name} ${i.qty}` : i.name}
                    onChange={() => set(d.items.map(x => (x.id === i.id ? { ...x, done: !x.done } : x)))} />
                  <span><b>{i.name}</b>{i.qty && <small className="num">{i.qty}</small>}</span>
                </label>
                <button className="icon-btn" aria-label={`Apagar ${i.name}`} onClick={() => set(d.items.filter(x => x.id !== i.id))}><Icon name="trash" /></button>
              </li>
            ))}
          </ul>
        ) : <p className="muted">{d.saved.length ? 'Escolha quantas vezes vai comer cada refeição salva, ou anote itens à mão.' : 'Anote itens à mão. Refeições salvas na Dieta também podem virar lista.'}</p>}
        {done > 0 && <button className="btn ghost wide" onClick={() => set(d.items.filter(i => !i.done))}>Limpar marcados</button>}
      </section>
    </main>
  );
}
