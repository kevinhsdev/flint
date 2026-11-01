import { lazy, useEffect, useRef, useState } from 'react';
import { HashRouter, Route, Routes, useNavigate } from 'react-router';
import { boot, getSettings } from './db/repo';
import { setSoundEnabled } from './ui/sound';
import { applyTheme } from './ui/theme';
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
import Diet from './screens/diet/Diet';
import WrappedScreen from './screens/progress/Wrapped';
import Survey from './screens/welcome/Survey';
import YourPlan from './screens/welcome/YourPlan';

const Dev = import.meta.env.DEV ? lazy(() => import('./screens/Dev')) : null;

export function Shell({ survey = false }: { survey?: boolean }) {
  const nav = useNavigate();
  const sent = useRef(false);
  // primeira abertura: manda pra pesquisa UMA vez (o `nav` muda a cada navegação; sem o ref, prendia a pessoa na pesquisa)
  useEffect(() => {
    if (!survey || sent.current) return;
    sent.current = true;
    nav('/bem-vindo', { replace: true });
  }, [survey, nav]);
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Today />} />
        <Route path="/treino" element={<Routine />} />
        <Route path="/treino/editar/:id" element={<TemplateEditor />} />
        <Route path="/treino/sessao" element={<SessionScreen />} />
        <Route path="/treino/historico" element={<History />} />
        <Route path="/dieta" element={<Diet />} />
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
  const [survey, setSurvey] = useState(false);
  useEffect(() => {
    // o carregamento fica pelo menos um instante, pra não piscar
    Promise.all([boot(), new Promise(r => setTimeout(r, MIN_LOADING_MS))]).then(([next]) => {
      setSurvey(next === 'survey');
      void getSettings().then(s => { setSoundEnabled(s.sound); applyTheme(s.theme); });
      setPhase('leaving');
      setTimeout(() => setPhase('ready'), 260);
    });
  }, []);
  return (
    <HashRouter>
      {phase !== 'ready' && <LoadingScreen leaving={phase === 'leaving'} />}
      {phase !== 'loading' && <ErrorBoundary><Shell survey={survey} /></ErrorBoundary>}
    </HashRouter>
  );
}
