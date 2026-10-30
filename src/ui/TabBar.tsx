import { NavLink } from 'react-router';
import { Icon, type IconName } from './Icon';

const TABS: [string, string, IconName][] = [
  ['/', 'Hoje', 'home'],
  ['/treino', 'Treino', 'dumb'],
  ['/progresso', 'Progresso', 'chart'],
  ['/time', 'Time', 'spark'],
];

export function TabBar() {
  return (
    <nav className="tabbar">
      {TABS.map(([to, label, icon]) => (
        <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => (isActive ? 'on' : undefined)}>
          <Icon name={icon} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
