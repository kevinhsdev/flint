import { photoFor, photoUrl, templatePhoto } from '../../src/domain/photos';
import type { Exercise, Muscle } from '../../src/domain/types';

const ex = (id: string, primary: Muscle): Exercise => ({ id, name: id, primary, secondary: [], equipment: 'barbell', custom: false, archived: false });
const lib = new Map([ex('sup', 'peito'), ex('cru', 'peito'), ex('tri', 'triceps'), ex('rem', 'costas')].map(e => [e.id, e]));
const items = (...ids: string[]) => ids.map(exerciseId => ({ exerciseId }));

test('músculo vira o grupo da foto', () => {
  expect(photoFor('gluteos')).toBe('pernas');
  expect(photoFor('trapezio')).toBe('costas');
  expect(photoFor('antebraco')).toBe('bracos');
  expect(photoFor(undefined)).toBe('geral');
});

test('foto do treino é o grupo que mais aparece', () => {
  expect(templatePhoto(items('sup', 'tri', 'cru'), lib)).toBe('peito');
});

test('empate fica com o grupo do primeiro exercício', () => {
  expect(templatePhoto(items('rem', 'sup'), lib)).toBe('costas');
  expect(templatePhoto(items('sup', 'rem'), lib)).toBe('peito');
});

test('treino vazio ou com exercício desconhecido cai na genérica', () => {
  expect(templatePhoto([], lib)).toBe('geral');
  expect(templatePhoto(items('sumiu'), lib)).toBe('geral');
  expect(templatePhoto(items('sumiu', 'tri'), lib)).toBe('bracos');
});

test('url da foto respeita a base do app', () => {
  expect(photoUrl('peito')).toMatch(/photos\/peito\.webp$/);
});
