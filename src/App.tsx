import { lazy } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { TabBar } from './ui/TabBar';

const Dev = import.meta.env.DEV ? lazy(() => import('./screens/Dev')) : null;

const Placeholder = ({ title }: { title: string }) => <main className="screen"><h1 className="title">{title}</h1></main>;

export function Shell() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Placeholder title="Hoje" />} />
        <Route path="/treino" element={<Placeholder title="Treino" />} />
        <Route path="/progresso" element={<Placeholder title="Progresso" />} />
        <Route path="/time" element={<Placeholder title="Time" />} />
        {Dev && <Route path="/dev" element={<Dev />} />}
      </Routes>
      <TabBar />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Shell />
    </HashRouter>
  );
}
