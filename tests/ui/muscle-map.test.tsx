import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MuscleMap } from '../../src/screens/progress/MuscleMap';
import { muscleSets } from '../../src/domain/progress';
import { EXERCISES } from '../../src/domain/exercises';
import { addDays, localDay, weekStart } from '../../src/domain/dates';
import { MUSCLES, type Session } from '../../src/domain/types';

const monday = weekStart(localDay(new Date()));
const at = (day: string) => { const [y, m, d] = day.split('-').map(Number); return new Date(y, m - 1, d, 12).getTime(); };
const supino = (sets: number, warmups = 0): Session => ({
  id: 's', templateId: null, name: 'A', startedAt: at(monday), endedAt: at(monday) + 3_600_000,
  entries: [{ exerciseId: 'supino-reto-barra', sets: [
    ...Array.from({ length: warmups }, () => ({ kg: 40, reps: 8, done: true, warmup: true })),
    ...Array.from({ length: sets }, () => ({ kg: 80, reps: 8, done: true })),
  ] }],
});

test('mapa cobre os 12 músculos', () => {
  const { container } = render(<MuscleMap sessions={[]} lib={EXERCISES} />);
  for (const m of MUSCLES) expect(container.querySelector(`[data-muscle="${m}"]`)).not.toBeNull();
});

test('tocar no peito mostra as séries da semana', async () => {
  const user = userEvent.setup();
  render(<MuscleMap sessions={[supino(8)]} lib={EXERCISES} />);
  await user.click(screen.getAllByRole('button', { name: /^Peito: 8 séries/ })[0]);
  expect(screen.getByRole('status')).toHaveTextContent('Peito · 8 séries esta semana');
});

test('aquecimento não acende músculo e secundário conta meia série', () => {
  const v = muscleSets([supino(4, 3)], monday, addDays(monday, 6), EXERCISES);
  expect(v.peito).toBe(4);
  expect(v.triceps).toBe(2);
  expect(v.costas).toBe(0);
});
