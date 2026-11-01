import type { Exercise, Muscle } from './types';

/** Capas (fotos do Unsplash em public/photos): uma por grupo muscular. 'corpo' é do treino livre. */
export type PhotoId = 'peito' | 'costas' | 'pernas' | 'ombros' | 'bracos' | 'abdomen' | 'corpo' | 'geral';

const GROUP: Record<Muscle, PhotoId> = {
  peito: 'peito', costas: 'costas', trapezio: 'costas', ombros: 'ombros',
  biceps: 'bracos', triceps: 'bracos', antebraco: 'bracos', abdomen: 'abdomen',
  quadriceps: 'pernas', posterior: 'pernas', gluteos: 'pernas', panturrilha: 'pernas',
};

export const photoFor = (m: Muscle | undefined): PhotoId => (m ? GROUP[m] : 'geral');

/** O grupo que mais aparece entre os exercícios; empate fica com o que aparece primeiro. */
export function templatePhoto(items: { exerciseId: string }[], lib: Map<string, Exercise>): PhotoId {
  const count = new Map<PhotoId, number>();
  for (const i of items) {
    const m = lib.get(i.exerciseId)?.primary;
    if (m) count.set(photoFor(m), (count.get(photoFor(m)) ?? 0) + 1);
  }
  let best: PhotoId = 'geral', n = 0;
  for (const [id, c] of count) if (c > n) { best = id; n = c; }
  return best;
}

export const photoUrl = (id: PhotoId) => `${import.meta.env.BASE_URL}photos/${id}.webp`;
