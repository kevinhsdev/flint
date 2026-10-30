import { useEffect, useReducer } from 'react';

export const mmss = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

/**
 * Descanso flutuante. Conta a partir de um timestamp de fim (`endsAt`), não de um contador,
 * então continua certo depois do app ficar em segundo plano.
 */
export function RestTimer({ endsAt, total, onChange, onDone }: { endsAt: number; total: number; onChange(endsAt: number): void; onDone(): void }) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const left = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

  useEffect(() => {
    const id = setInterval(tick, 250);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, []);
  useEffect(() => {
    if (left > 0) return;
    navigator.vibrate?.([200, 100, 200]);
    onDone();
  }, [left, onDone]);

  return (
    <div className="rest" style={{ ['--p' as string]: String(Math.min(1, left / Math.max(1, total))) }}>
      <div className="rest-bar" />
      <span className="rest-label">Descanso</span>
      <b role="timer" aria-live="off" className="num">{mmss(left)}</b>
      <button onClick={() => onChange(Math.max(Date.now(), endsAt - 15_000))}>−15 s</button>
      <button onClick={() => onChange(endsAt + 15_000)}>+15 s</button>
      <button className="skip" onClick={onDone}>Pular</button>
    </div>
  );
}
