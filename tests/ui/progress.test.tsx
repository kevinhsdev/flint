import { screen } from '@testing-library/react';
import { renderAt } from './render';
import { db } from '../../src/db/db';
import { boot, logWeight, saveSettings, startFresh, wipeAll } from '../../src/db/repo';
import { localDay } from '../../src/domain/dates';

vi.setConfig({ testTimeout: 30_000 });

test('IMC aparece com altura e some sem altura', async () => {
  await startFresh();
  await logWeight(80, localDay(new Date()));
  const { unmount } = renderAt('/progresso');
  expect(await screen.findByRole('link', { name: 'Informe sua altura' })).toBeInTheDocument();
  unmount();
  await saveSettings({ heightCm: 180 });
  renderAt('/progresso');
  expect(await screen.findByText('24,7 · normal')).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: 'Informe sua altura' })).toBeNull();
});

test('gráfico do supino tem um ponto por sessão', async () => {
  await wipeAll(); await boot();
  const n = (await db.sessions.toArray()).filter(s => s.endedAt && s.entries.some(e => e.exerciseId === 'supino-reto-barra' && e.sets.some(x => x.done))).length;
  expect(n).toBeGreaterThan(1);
  const { container } = renderAt('/progresso/exercicio/supino-reto-barra');
  expect(await screen.findByRole('heading', { name: 'Supino reto com barra' })).toBeInTheDocument();
  expect(container.querySelectorAll('[data-point]')).toHaveLength(n);
});

test('lista de exercícios só mostra os que têm histórico', async () => {
  await startFresh();
  await db.sessions.add({ id: 's1', templateId: null, name: 'Livre', startedAt: Date.now() - 3_600_000, endedAt: Date.now(),
    entries: [{ exerciseId: 'agachamento-livre', sets: [{ kg: 100, reps: 5, done: true }] }] });
  renderAt('/progresso');
  expect(await screen.findByRole('link', { name: /Agachamento livre/ })).toBeInTheDocument();
  expect(screen.queryByRole('link', { name: /Supino reto com barra/ })).toBeNull();
});
