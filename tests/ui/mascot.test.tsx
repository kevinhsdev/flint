import { render } from '@testing-library/react';
import { Mascot } from '../../src/mascots/Mascot';
import { activeMascotCount } from '../../src/mascots/engine';

test('Mascot monta SVG e limpa no unmount', () => {
  const { container, unmount } = render(<Mascot kind="gota" size={120} />);
  expect(container.querySelector('svg[aria-label="gota"]')).toBeTruthy();
  unmount(); expect(activeMascotCount()).toBe(0);
});
