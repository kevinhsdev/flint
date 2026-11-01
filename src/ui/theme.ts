import type { ThemePref } from '../domain/types';

const BAR = { light: '#f2f2f7', dark: '#000000' };
let unlisten = () => {};

/** Aplica o tema no <html> e na barra de status; "auto" segue o iPhone e acompanha quando ele muda. */
export function applyTheme(pref: ThemePref) {
  unlisten();
  unlisten = () => {};
  const set = (dark: boolean) => {
    const t = dark ? 'dark' : 'light';
    document.documentElement.dataset.theme = t;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', BAR[t]);
  };
  if (pref !== 'auto') return set(pref === 'dark');
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const on = (e: { matches: boolean }) => set(e.matches);
  set(mq.matches);
  mq.addEventListener('change', on);
  unlisten = () => mq.removeEventListener('change', on);
}
