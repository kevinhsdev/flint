import { RULES } from './rules';
import type { Settings } from './types';

export const DEFAULT_SETTINGS: Settings = {
  heightCm: null,
  waterGoalMl: null,
  trainDays: [...RULES.defaults.trainDays],
  trainTime: RULES.defaults.trainTime,
  demo: false,
  notif: { water: true, train: true, pedra: true, quietStart: RULES.notif.quietStart, quietEnd: RULES.notif.quietEnd },
  onboarded: false,
  profile: null,
  sound: true,
  targets: {},
  theme: 'auto',
  weightGoalKg: null,
  meals: [{ id: 'cafe', name: 'Café da manhã' }, { id: 'almoco', name: 'Almoço' }, { id: 'lanche', name: 'Lanche' }, { id: 'jantar', name: 'Jantar' }],
  nutritionGoal: null,
};
