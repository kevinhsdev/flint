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
/** `group`: itens seguidos com o mesmo grupo formam um superset. */
export interface TemplateItem { exerciseId: string; sets: number; repMin: number; repMax: number; restSec: number; group?: string }
export interface Template { id: string; name: string; order: number; items: TemplateItem[]; archived: boolean }
/** `rir`: reps que sobraram (0–5, 5 = 5+); RPE = 10 − RIR. */
export interface SetLog { kg: number; reps: number; done: boolean; warmup?: boolean; rir?: number }

export type Goal = 'massa' | 'emagrecer' | 'condicionamento' | 'forca';
export type Level = 'iniciante' | 'intermediario' | 'avancado';
export type Place = 'completa' | 'basica' | 'casa';
/** Respostas da pesquisa inicial que alimentam o plano gerado. */
export interface Profile { goal: Goal; level: Level; days: number[]; minutes: 30 | 45 | 60 | 90; place: Place; age: number }
export interface Entry { exerciseId: string; sets: SetLog[]; group?: string }
export const CARDIO = ['corrida', 'caminhada', 'bike', 'outro'] as const;
export type CardioType = (typeof CARDIO)[number];
export interface Cardio { type: CardioType; min: number; km: number | null }
/** Sem `kind`: treino de musculação. `checkin` e `cardio` são registros rápidos, já terminados e sem séries. */
export interface Session {
  id: string; templateId: string | null; name: string;
  startedAt: number; endedAt: number | null; entries: Entry[];
  kind?: 'checkin' | 'cardio'; cardio?: Cardio;
}
export interface WaterLog { id: string; day: string; at: number; ml: number }
export interface WeightLog { id: string; day: string; kg: number }
export interface Photo { id: string; day: string; blob: Blob }
export const MEASURE_PARTS = ['peito', 'cintura', 'quadril', 'braco', 'coxa', 'panturrilha'] as const;
export type MeasurePart = (typeof MEASURE_PARTS)[number];
/** Uma medida por parte por dia: registrar de novo substitui. */
export interface Measure { id: string; day: string; part: MeasurePart; cm: number }
export const CHALLENGE_KINDS = ['treinos', 'series', 'cardio', 'agua'] as const;
export type ChallengeKind = (typeof CHALLENGE_KINDS)[number];
/** Meta com prazo: `target` dentro de `days` dias a partir de `startDay`. O progresso sai dos registros. */
export interface Challenge { id: string; kind: ChallengeKind; target: number; startDay: string; days: number }
export interface Macros { kcal: number; p: number; c: number; f: number }
/** Alimento anotado à mão numa refeição; qty é texto livre ("150 g", "2 un"). */
export interface Food extends Macros { id: string; day: string; at: number; meal: string; name: string; qty: string }
export interface Meal { id: string; name: string }
/** Refeição pronta ("marmita"): vários alimentos adicionados de uma vez. */
export interface SavedMeal { id: string; name: string; foods: Pick<Food, 'name' | 'qty' | 'kcal' | 'p' | 'c' | 'f'>[] }
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
  /** meta de peso corporal (kg) */
  weightGoalKg: number | null;
  /** refeições do dia, na ordem */
  meals: Meal[];
  nutritionGoal: Macros | null;
}
