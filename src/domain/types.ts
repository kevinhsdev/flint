export const MUSCLES = [
  'peito', 'costas', 'ombros', 'biceps', 'triceps', 'antebraco',
  'abdomen', 'quadriceps', 'posterior', 'gluteos', 'panturrilha', 'trapezio',
] as const;
export type Muscle = (typeof MUSCLES)[number];

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export interface Exercise {
  id: string; name: string; primary: Muscle; secondary: Muscle[];
  equipment: Equipment; custom: boolean; archived: boolean;
}
export interface TemplateItem { exerciseId: string; sets: number; repMin: number; repMax: number; restSec: number }
export interface Template { id: string; name: string; order: number; items: TemplateItem[]; archived: boolean }
export interface SetLog { kg: number; reps: number; done: boolean; warmup?: boolean }

export type Goal = 'massa' | 'emagrecer' | 'condicionamento' | 'forca';
export type Level = 'iniciante' | 'intermediario' | 'avancado';
export type Place = 'completa' | 'basica' | 'casa';
/** Respostas da pesquisa inicial que alimentam o plano gerado. */
export interface Profile { goal: Goal; level: Level; days: number[]; minutes: 30 | 45 | 60 | 90; place: Place; age: number }
export interface Entry { exerciseId: string; sets: SetLog[] }
export interface Session {
  id: string; templateId: string | null; name: string;
  startedAt: number; endedAt: number | null; entries: Entry[];
}
export interface WaterLog { id: string; day: string; at: number; ml: number }
export interface WeightLog { id: string; day: string; kg: number }
export interface Photo { id: string; day: string; blob: Blob }
export type ThemePref = 'auto' | 'light' | 'dark';

export interface Settings {
  heightCm: number | null;
  waterGoalMl: number | null;
  trainDays: number[];
  trainTime: string;
  demo: boolean;
  notif: { water: boolean; train: boolean; pedra: boolean; quietStart: string; quietEnd: string };
  onboarded: boolean;
  profile: Profile | null;
  sound: boolean;
  /** carga-alvo por exercício (previsão de meta) */
  targets: Record<string, number>;
  theme: ThemePref;
}
