import { bmi, waterGoalMl } from '../../src/domain/body';
import { DEFAULT_SETTINGS } from '../../src/db/repo';

test('IMC e faixa OMS', () => {
  expect(bmi(80, 180)).toEqual({ value: expect.closeTo(24.69, 2), band: 'normal' });
  expect(bmi(55, 180).band).toBe('abaixo');
  expect(bmi(90, 180).band).toBe('sobrepeso');
  expect(bmi(100, 180).band).toBe('obesidade');
});
test('meta de água: 35ml/kg arredondado a 250', () => {
  expect(waterGoalMl(DEFAULT_SETTINGS, 79)).toBe(2750);
  expect(waterGoalMl(DEFAULT_SETTINGS)).toBe(2500);
  expect(waterGoalMl({ ...DEFAULT_SETTINGS, waterGoalMl: 3000 }, 79)).toBe(3000);
});
