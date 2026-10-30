import { lazy, useEffect, useState } from 'react';
import { boot } from './db/repo';
import { LoadingScreen } from './ui/LoadingScreen';
import Today from './screens/today/Today';
import { HashRouter, Route, Routes } from 'react-router';
import { TabBar } from './ui/TabBar';
import Routine from './screens/train/Routine';
import TemplateEditor from './screens/train/TemplateEditor';
import SessionScreen from './screens/train/Session';
import History from './screens/train/History';

const Dev = import.meta.env.DEV ? lazy(() => import('./screens/Dev')) : null;

const Placeholder = ({ title }: { title: string }) => <main className="screen"><h1 className="title">{title}</h1></main>;

export function Shell() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/treino" element={<Routine />} />
        <Route path="/treino/editar/:id" element={<TemplateEditor />} />
        <Route path="/treino/sessao" element={<SessionScreen />} />
        <Route path="/treino/historico" element={<History />} />
        <Route path="/progresso" element={<Placeholder title="Progresso" />} />
        <Route path="/time" element={<Placeholder title="Time" />} />
        {Dev && <Route path="/dev" element={<Dev />} />}
      </Routes>
      <TabBar />
    </div>
  );
}

const MIN_LOADING_MS = 700;

export default function App() {
  const [phase, setPhase] = useState<'loading' | 'leaving' | 'ready'>('loading');
  useEffect(() => {
    // o carregamento fica pelo menos um instante, pra não piscar
    Promise.all([boot(), new Promise(r => setTimeout(r, MIN_LOADING_MS))]).then(() => {
      setPhase('leaving');
      setTimeout(() => setPhase('ready'), 260);
    });
  }, []);
  return (
    <HashRouter>
      {phase !== 'ready' && <LoadingScreen leaving={phase === 'leaving'} />}
      {phase !== 'loading' && <Shell />}
    </HashRouter>
  );
}
