import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/archivo/standard.css';
import './styles/tokens.css';
import './styles/global.css';
import App from './App';

// iOS só aplica :active (feedback no toque) se existir algum listener de touch
document.addEventListener('touchstart', () => {}, { passive: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
