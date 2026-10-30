import { lazy, useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router';
import { boot } from './db/repo';
import { LoadingScreen } from './ui/LoadingScreen';
import { TabBar } from './ui/TabBar';
import { ErrorBoundary } from './ui/ErrorBoundary';
import Today from './screens/today/Today';
import Routine from './screens/train/Routine';
import TemplateEditor from './screens/train/TemplateEditor';
import SessionScreen from './screens/train/Session';
import History from './screens/train/History';
import Progress from './screens/progress/Progress';
import ExerciseScreen from './screens/progress/ExerciseChart';
import Team from './screens/team/Team';
import Settings from './screens/team/Settings';
import Water from './screens/water/Water';
import WrappedScreen from './screens/progress/Wrapped';
import Survey from './screens/welcome/Survey';
import YourPlan from './screens/welcome/YourPlan';

const Dev = import.meta.env.DEV ? lazy(() => import('./screens/Dev')) : null;

export function Shell() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/treino" element={<Routine />} />
        <Route path="/treino/editar/:id" element={<TemplateEditor />} />
        <Route path="/treino/sessao" element={<SessionScreen />} />
        <Route path="/treino/historico" element={<History />} />
        <Route path="/agua" element={<Water />} />
        <Route path="/bem-vindo" element={<Survey />} />
        <Route path="/bem-vindo/plano" element={<YourPlan />} />
        <Route path="/progresso" element={<Progress />} />
        <Route path="/progresso/exercicio/:id" element={<ExerciseScreen />} />
        <Route path="/progresso/retrospectiva/:month" element={<WrappedScreen />} />
        <Route path="/time" element={<Team />} />
        <Route path="/time/ajustes" element={<Settings />} />
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
    Promise.all([boot(), new Promise(r => setTimeout(r, MIN_LOADING_MS))]).then(([next]) => {
      if (next === 'survey') window.location.hash = '#/bem-vindo';
      setPhase('leaving');
      setTimeout(() => setPhase('ready'), 260);
    });
  }, []);
  return (
    <HashRouter>
      {phase !== 'ready' && <LoadingScreen leaving={phase === 'leaving'} />}
      {phase !== 'loading' && <ErrorBoundary><Shell /></ErrorBoundary>}
    </HashRouter>
  );
}
