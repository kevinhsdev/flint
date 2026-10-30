import { useEffect, useRef } from 'react';
import { createWaterSim, type WaterSim } from './waterSim';

/** Copo com a mesma água de molas do card; a marca tracejada é a meta. */
export function Glass({ ml, goal, size = 'lg' }: { ml: number; goal: number; size?: 'lg' | 'sm' }) {
  const cv = useRef<HTMLCanvasElement>(null);
  const sim = useRef<WaterSim>(null);
  const first = useRef(true);
  useEffect(() => {
    sim.current = createWaterSim(cv.current!, ml / goal);
    return () => sim.current?.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o nível é atualizado pelo efeito abaixo
  }, []);
  useEffect(() => {
    sim.current?.setLevel((ml / goal) * 0.9); // 90% da altura = meta; passar da meta sobe um pouco mais
    if (!first.current) sim.current?.splash();
    first.current = false;
  }, [ml, goal]);
  return (
    <div className={`glass ${size}`} aria-hidden="true">
      <div className="glass-in"><canvas ref={cv} /></div>
      <svg className="glass-rim" viewBox="0 0 100 130" preserveAspectRatio="none">
        <path d="M4 3 L96 3 L86 124 Q85 127 82 127 L18 127 Q15 127 14 124 Z" fill="none" stroke="rgba(220,240,255,.35)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        <path d="M11 12 L18 110" stroke="rgba(255,255,255,.22)" strokeWidth="4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        <path d="M9 15.6 L91 15.6" stroke="rgba(255,255,255,.4)" strokeWidth="1.2" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
