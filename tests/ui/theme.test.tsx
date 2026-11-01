import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { DEFAULT_SETTINGS, getSettings, startFresh } from '../../src/db/repo';
import { applyTheme } from '../../src/ui/theme';

const meta = () => {
  let m = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.append(m); }
  return m;
};

function stubDark(matches: boolean) {
  const listeners: ((e: { matches: boolean }) => void)[] = [];
  const mq = { matches, media: '', addEventListener: (_: string, f: (e: { matches: boolean }) => void) => listeners.push(f), removeEventListener: vi.fn() };
  vi.stubGlobal('matchMedia', () => mq);
  return (m: boolean) => { mq.matches = m; listeners.forEach(f => f({ matches: m })); };
}

afterEach(() => { vi.unstubAllGlobals(); applyTheme('light'); });

test('tema padrão é automático', () => {
  expect(DEFAULT_SETTINGS.theme).toBe('auto');
});

test('escuro marca o html e a barra de status', () => {
  const m = meta();
  applyTheme('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(m.content).toBe('#000000');
  applyTheme('light');
  expect(m.content).toBe('#f2f2f7');
});

test('automático segue o iPhone e reage quando ele muda', () => {
  const change = stubDark(true);
  applyTheme('auto');
  expect(document.documentElement.dataset.theme).toBe('dark');
  change(false);
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('trocar o tema em Ajustes salva e aplica', async () => {
  await startFresh();
  const { user } = renderAt('/time/ajustes');
  await user.click(await screen.findByRole('button', { name: 'Escuro' }));
  await vi.waitFor(async () => expect((await getSettings()).theme).toBe('dark'));
  expect(document.documentElement.dataset.theme).toBe('dark');
  expect(await screen.findByRole('button', { name: 'Escuro', pressed: true })).toBeInTheDocument();
});
