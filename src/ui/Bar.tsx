/** Meta do dia: rótulo e barrinha de progresso (0–1). */
export function Bar({ label, value, tone = 'fire' }: { label: string; value: number; tone?: 'fire' | 'water' }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className={`goal${tone === 'water' ? ' w' : ''}`}>
      <b className="num">{label}</b>
      <div className="t" role="progressbar" aria-label={label} aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><i style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
