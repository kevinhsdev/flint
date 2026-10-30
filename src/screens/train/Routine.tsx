import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { archiveTemplate, duplicateTemplate, getActiveSession, reorderTemplates } from '../../db/repo';
import { nextTemplate } from '../../domain/routine';
import { MUSCLE_NAMES } from '../../domain/exercises';
import type { Exercise, Template } from '../../domain/types';
import { Empty } from '../../ui/Empty';
import { Icon } from '../../ui/Icon';
import { Sheet } from '../../ui/Sheet';
import { useReorder } from '../../ui/useReorder';

export const startPath = (templateId: string | null) => `/treino/sessao?start=${templateId ?? 'livre'}`;

function muscles(t: Template, ex: Map<string, Exercise>) {
  const seen = [...new Set(t.items.map(i => ex.get(i.exerciseId)?.primary).filter(Boolean))];
  return seen.map(m => MUSCLE_NAMES[m!]).join(', ');
}

export default function Routine() {
  const nav = useNavigate();
  const data = useLiveQuery(async () => ({
    templates: (await db.templates.orderBy('order').toArray()).filter(t => !t.archived),
    sessions: await db.sessions.toArray(),
    ex: new Map((await db.exercises.toArray()).map(e => [e.id, e])),
    active: await getActiveSession(),
  }), []);
  const [menu, setMenu] = useState<Template | null>(null);
  const [confirm, setConfirm] = useState(false);
  const { list, rows, dragging, grip } = useReorder(data?.templates ?? [], next => reorderTemplates(next.map(t => t.id)));

  if (!data) return <main className="screen" />;
  const next = nextTemplate(data.templates, data.sessions);
  const closeMenu = () => { setMenu(null); setConfirm(false); };

  return (
    <main className="screen">
      <header className="screen-head">
        <h1 className="title">Treino</h1>
        <Link to="/treino/historico" className="link">Histórico <Icon name="chev" /></Link>
      </header>

      {data.active && (
        <Link to="/treino/sessao" className="live-banner">
          <span className="dot" /><span><b>Treino em andamento</b><small>{data.active.name}</small></span><span className="go">Continuar</span>
        </Link>
      )}

      {rows.length === 0 ? (
        <Empty text="Bora montar sua primeira rotina?">
          <button className="btn" onClick={() => nav('/treino/editar/novo')}>Novo treino</button>
          <button className="btn ghost" onClick={() => nav(startPath(null))}>Treino livre</button>
        </Empty>
      ) : (
        <>
          <ul className="tpl-list" ref={list as React.RefObject<HTMLUListElement>}>
            {rows.map((t, i) => (
              <li key={t.id} data-reorder className={`tpl${t.id === next?.id ? ' next' : ''}${dragging === i ? ' dragging' : ''}`}>
                <span className="grip" aria-label={`Arrastar ${t.name}`} {...grip(i)}><Icon name="grip" /></span>
                <div className="tpl-body">
                  {t.id === next?.id && <span className="tag">Próximo</span>}
                  <b>{t.name}</b>
                  <small>{t.items.length} {t.items.length === 1 ? 'exercício' : 'exercícios'}{t.items.length ? ` · ${muscles(t, data.ex)}` : ''}</small>
                </div>
                <button className="icon-btn" aria-label={`Opções de ${t.name}`} onClick={() => setMenu(t)}><Icon name="more" /></button>
                <button className="play" aria-label={`Começar ${t.name}`} onClick={() => nav(startPath(t.id))}><Icon name="play" /></button>
              </li>
            ))}
          </ul>
          <div className="row-2">
            <button className="btn" onClick={() => nav('/treino/editar/novo')}><Icon name="plus" /> Novo treino</button>
            <button className="btn ghost" onClick={() => nav(startPath(null))}>Treino livre</button>
          </div>
        </>
      )}

      <Sheet open={!!menu} onClose={closeMenu} title={confirm ? `Arquivar ${menu?.name}?` : menu?.name ?? ''}>
        {menu && !confirm && (
          <div className="menu">
            <button className="menu-item" onClick={() => nav(startPath(menu.id))}><Icon name="play" /> Começar</button>
            <button className="menu-item" onClick={() => nav(`/treino/editar/${menu.id}`)}><Icon name="gear" /> Editar</button>
            <button className="menu-item" onClick={async () => { await duplicateTemplate(menu.id); closeMenu(); }}><Icon name="plus" /> Duplicar</button>
            <button className="menu-item danger" onClick={() => setConfirm(true)}><Icon name="trash" /> Arquivar</button>
          </div>
        )}
        {menu && confirm && (
          <>
            <p className="muted">Ele sai da rotina. O histórico dos treinos feitos continua salvo.</p>
            <div className="row-2">
              <button className="btn ghost" onClick={closeMenu}>Cancelar</button>
              <button className="btn" onClick={async () => { await archiveTemplate(menu.id); closeMenu(); }}>Sim, arquivar</button>
            </div>
          </>
        )}
      </Sheet>
    </main>
  );
}
