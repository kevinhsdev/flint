// Todas as regras de jogo do spec (§8) num lugar só.
export const RULES = {
  xp: { workout: 100, pr: 25, waterGoal: 20, medal: 10 },
  stages: [
    { id: 'faisca', name: 'Faísca', xp: 0 },
    { id: 'chama', name: 'Chama', xp: 1500 },
    { id: 'fogueira', name: 'Fogueira', xp: 5000 },
    { id: 'forja', name: 'Forja', xp: 12000 },
  ],
  waterMlPerKg: 35,
  waterRoundMl: 250,
  waterDefaultMl: 2500,
  waterQuick: [150, 250, 500],
  sadAfterMissedTrainDays: 2,
  overloadKg: { barbell: 2.5, machine: 2.5, dumbbell: 2, cable: 1, bodyweight: 0 },
  milestones: {
    workouts: [1, 10, 50, 100, 250],
    goalWeeks: [4, 12, 26, 52],
    volumeKg: [10_000, 100_000, 1_000_000],
    waterStreakDays: 7,
  },
  notif: { maxPerDay: 4, quietStart: '22:00', quietEnd: '08:00' },
  defaults: { trainDays: [1, 2, 3, 4, 5], trainTime: '18:00' },
} as const;

export type StageId = (typeof RULES.stages)[number]['id'];
