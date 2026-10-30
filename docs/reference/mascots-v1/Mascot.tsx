import { useEffect, useRef } from 'react';
import { mountMascot, type MascotAct, type MascotHandle, type MascotKind } from './engine';
import type { StageId } from '../domain/rules';

interface Props {
  kind: MascotKind;
  size: number;
  stage?: StageId;
  mood?: 'happy' | 'sad';
  interactive?: boolean;
  /** muda o valor (ex.: `{ name: 'comemorar', key: Date.now() }`) para disparar de novo */
  act?: { name: MascotAct; key: number };
}

export function Mascot({ kind, size, stage, mood, interactive, act }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const h = useRef<MascotHandle>(null);

  useEffect(() => {
    h.current = mountMascot(el.current!, kind, { stage, interactive });
    return () => { h.current?.destroy(); h.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- estágio e humor mudam sem remontar
  }, [kind, interactive]);

  useEffect(() => { if (stage) h.current?.setStage(stage); }, [stage]);
  useEffect(() => { h.current?.setMood(mood ?? 'happy'); }, [mood]);
  useEffect(() => { if (act) h.current?.act(act.name); }, [act]);

  return <div ref={el} style={{ width: size, height: size * 4 / 3 }} />;
}
