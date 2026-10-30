import { useEffect, useState, type CSSProperties } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Icon, type IconName } from './Icon';

const TABS: [string, string, IconName][] = [
  ['/', 'Hoje', 'home'],
  ['/treino', 'Treino', 'dumb'],
  ['/agua', 'Água', 'drop'],
  ['/progresso', 'Progresso', 'chart'],
  ['/time', 'Time', 'spark'],
];
// pesquisa inicial: tela cheia, sem barra (na sessão a barra fica: é a saída para registrar água etc.)
const HIDDEN = ['/bem-vindo', '/progresso/retrospectiva'];

/** Pílula flutuante de vidro: o destaque desliza com mola e a barra recua ao rolar para baixo. */
export function TabBar() {
  const { pathname } = useLocation();
  const [away, setAway] = useState(false);

  useEffect(() => {
    setAway(false);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let last = scrollY, idle = 0;
    const onScroll = () => {
      const y = scrollY;
      if (y > last + 8 && y > 60) setAway(true);
      else if (y < last - 4) setAway(false);
      last = y;
      clearTimeout(idle); idle = window.setTimeout(() => setAway(false), 600);
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => { removeEventListener('scroll', onScroll); clearTimeout(idle); };
  }, [pathname]);

  if (HIDDEN.some(p => pathname.startsWith(p))) return null;
  const active = TABS.findIndex(([to]) => (to === '/' ? pathname === '/' : pathname.startsWith(to)));
  return (
    <nav aria-label="Principal" className={`tabbar${away ? ' away' : ''}`} style={{ '--i': Math.max(0, active) } as CSSProperties}>
      {active >= 0 && <span className="tab-pill" aria-hidden="true" />}
      {TABS.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <span className={`ti ti-${icon}`}><Icon name={icon} /></span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
