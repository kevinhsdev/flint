import type { ReactNode } from 'react';
import { Mascot } from '../mascots/Mascot';
import type { MascotKind } from '../mascots/engine';

const WAVE = { name: 'acenar', key: 1 } as const;

/** Estado vazio: um mascote acena e convida pra próxima ação. */
export function Empty({ kind = 'faisca', text, children }: { kind?: MascotKind; text: string; children?: ReactNode }) {
  return (
    <div className="empty">
      <Mascot kind={kind} size={140} act={WAVE} />
      <p className="bubble">{text}</p>
      {children}
    </div>
  );
}
