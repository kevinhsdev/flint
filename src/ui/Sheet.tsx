import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from 'react';

interface Props { open: boolean; onClose(): void; title: string; children: ReactNode }

/** Bottom sheet. Arrastar pra baixo fecha: decide pela posição projetada com a velocidade do gesto. */
export function Sheet({ open, onClose, title, children }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y0: number; y: number; t: number; v: number } | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => { if (open) setClosing(false); }, [open]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', esc);
    return () => removeEventListener('keydown', esc);
  });

  if (!open) return null;

  function close() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || !el.current) { onClose(); return; }
    setClosing(true);
    setTimeout(onClose, 200);
  }
  const set = (y: number, anim: boolean) => {
    const s = el.current!.style;
    s.transition = anim ? 'transform 320ms var(--ease-drawer)' : 'none';
    s.transform = y ? `translateY(${y}px)` : '';
  };
  const down = (e: PointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, textarea, a, [data-noswipe]')) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { y0: e.clientY, y: 0, t: performance.now(), v: 0 };
  };
  const move = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    const now = performance.now(), raw = e.clientY - d.y0;
    const y = raw > 0 ? raw : -Math.sqrt(-raw) * 2; // pra cima: resistência crescente
    d.v = (y - d.y) / Math.max(1, now - d.t); d.y = y; d.t = now;
    set(y, false);
  };
  const up = () => {
    const d = drag.current; if (!d) return; drag.current = null;
    const projected = d.y + d.v * 200; // onde o dedo "jogaria" a folha
    if (projected > el.current!.offsetHeight * .45) close(); else set(0, true);
  };

  return (
    <div className={`sheet-scrim${closing ? ' out' : ''}`} onClick={close}>
      <div ref={el} className="sheet" role="dialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="sheet-grip" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
