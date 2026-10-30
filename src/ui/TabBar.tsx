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

/** Barra de abas estilo iOS: translúcida, fixa embaixo, ícone com rótulo; troca de aba com view transition. */
export function TabBar() {
  const { pathname } = useLocation();
  if (HIDDEN.some(p => pathname.startsWith(p))) return null;
  return (
    <nav aria-label="Principal" className="tabbar">
      {TABS.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end={to === '/'} viewTransition className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <span className={`ti ti-${icon}`}><Icon name={icon} /></span>
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
