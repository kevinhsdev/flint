import { act, fireEvent, render, screen } from '@testing-library/react';
import { WaterCard } from '../../src/water/WaterCard';

const setup = () => {
  const onAdd = vi.fn(), onUndo = vi.fn();
  render(<WaterCard ml={1750} goal={3000} onAdd={onAdd} onUndo={onUndo} />);
  return { onAdd, onUndo, card: screen.getByRole('button', { name: /água/i }) };
};

test('mostra o total em litros e um toque adiciona 250 ml', () => {
  const { onAdd, card } = setup();
  expect(card).toHaveTextContent('1,75');
  fireEvent.pointerDown(card); fireEvent.pointerUp(card); fireEvent.click(card);
  expect(onAdd).toHaveBeenCalledWith(250);
  expect(onAdd).toHaveBeenCalledTimes(1);
});

test('segurar 450 ms abre as opções e não adiciona 250', () => {
  vi.useFakeTimers();
  const { onAdd, card } = setup();
  fireEvent.pointerDown(card);
  act(() => { vi.advanceTimersByTime(460); });
  fireEvent.pointerUp(card); fireEvent.click(card);
  vi.useRealTimers();
  expect(onAdd).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: '500 ml' }));
  expect(onAdd).toHaveBeenCalledWith(500);
});

test('valor personalizado e desfazer', () => {
  vi.useFakeTimers();
  const { onAdd, onUndo, card } = setup();
  fireEvent.pointerDown(card);
  act(() => { vi.advanceTimersByTime(460); });
  fireEvent.change(screen.getByLabelText('Outro valor (ml)'), { target: { value: '330' } });
  fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
  expect(onAdd).toHaveBeenCalledWith(330);
  fireEvent.pointerDown(card);
  act(() => { vi.advanceTimersByTime(460); });
  vi.useRealTimers();
  fireEvent.click(screen.getByRole('button', { name: 'Desfazer' }));
  expect(onUndo).toHaveBeenCalled();
});
