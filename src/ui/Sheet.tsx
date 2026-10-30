import type { ReactNode } from 'react';

// ponytail: sheet mínimo para o WaterCard; arraste para fechar entra na Task 7
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose(): void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()}>
        <div className="sheet-grip" />
        <h2 className="sheet-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}
