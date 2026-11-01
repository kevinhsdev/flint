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
};
