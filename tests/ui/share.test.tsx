import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Summary } from '../../src/screens/train/Summary';
import { EXERCISES } from '../../src/domain/exercises';
import type { Session } from '../../src/domain/types';

// jsdom não tem canvas: o desenho fica atrás de cards.ts
vi.mock('../../src/share/cards', () => ({
  prCard: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
  wrappedCard: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
}));

const session: Session = { id: 's', templateId: null, name: 'A', startedAt: Date.now() - 3600e3, endedAt: Date.now(),
  entries: [{ exerciseId: 'supino-reto-barra', sets: [{ kg: 100, reps: 5, done: true }] }] };
const pr = { sessionId: 's', exerciseId: 'supino-reto-barra', kind: 'e1rm' as const, kg: 100, reps: 5, at: Date.now() };

afterEach(() => { vi.unstubAllGlobals(); Reflect.deleteProperty(navigator, 'share'); Reflect.deleteProperty(navigator, 'canShare'); });

test('Compartilhar chama navigator.share com um PNG', async () => {
  const share = vi.fn(async () => {});
  Object.assign(navigator, { share, canShare: () => true });
  render(<Summary session={session} lib={EXERCISES} prs={[pr]} xp={10} stage="faisca" onDone={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Compartilhar recorde de Supino reto com barra' }));
  await vi.waitFor(() => expect(share).toHaveBeenCalled());
  const file = (share.mock.calls[0] as unknown as [{ files: File[] }])[0].files[0];
  expect(file.type).toBe('image/png');
  expect(file.name).toMatch(/\.png$/);
});

test('sem Web Share faz download', async () => {
  const createObjectURL = vi.fn(() => 'blob:x');
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  render(<Summary session={session} lib={EXERCISES} prs={[pr]} xp={10} stage="faisca" onDone={() => {}} />);
  await userEvent.click(screen.getByRole('button', { name: 'Compartilhar recorde de Supino reto com barra' }));
  await vi.waitFor(() => expect(click).toHaveBeenCalled());
  expect(createObjectURL).toHaveBeenCalled();
});
