import { useRef, useState, type PointerEvent } from 'react';

/**
 * Reordenar arrastando pela alça. A lista mostra a ordem provisória durante o arraste
 * e chama `commit` ao soltar. Cada linha precisa de `data-reorder` no elemento.
 */
export function useReorder<T>(items: T[], commit: (next: T[]) => void) {
  const [draft, setDraft] = useState<T[] | null>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const list = useRef<HTMLElement>(null);
  const cur = useRef<T[]>([]);

  const end = () => {
    if (dragging === null) return;
    const changed = cur.current.some((x, i) => x !== items[i]);
    setDraft(null); setDragging(null);
    if (changed) commit(cur.current);
  };

  const grip = (index: number) => ({
    onPointerDown(e: PointerEvent<HTMLElement>) {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      cur.current = [...items]; setDraft(cur.current); setDragging(index);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (dragging === null || !list.current) return;
      const rows = [...list.current.querySelectorAll<HTMLElement>('[data-reorder]')];
      let to = rows.findIndex(r => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; });
      if (to === -1) to = rows.length - 1;
      if (to === dragging) return;
      const next = [...cur.current];
      next.splice(to, 0, next.splice(dragging, 1)[0]);
      cur.current = next; setDraft(next); setDragging(to);
      navigator.vibrate?.(8);
    },
    onPointerUp: end,
    onPointerCancel: end,
    style: { touchAction: 'none' as const, cursor: 'grab' },
  });

  return { list, rows: draft ?? items, dragging, grip };
}
