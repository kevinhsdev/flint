// Tudo aqui é derivado do histórico: nada de XP, medalha ou sequência é salvo no banco.
import { addDays, localDay, weekday, weekStart } from './dates';
import { RULES, type StageId } from './rules';
import { findPRs, isWork } from './strength';
import { waterGoalMl, weightOn } from './body';
import type { Exercise, Session, Settings, WaterLog, WeightLog } from './types';

export interface GameData {
  sessions: Session[];
  water: WaterLog[];
  weights: WeightLog[];
  settings: Settings;
  library: Exercise[];
}

export type MedalId = 'treino' | 'hidratado' | 'recorde' | 'dia-completo';
export type MilestoneId = string;

const done = (sessions: Session[]) => sessions.filter(s => s.endedAt !== null);
const dayOf = (s: Session) => localDay(new Date(s.startedAt));
const trainedDays = (sessions: Session[]) => new Set(done(sessions).map(dayOf));

const waterByDay = (water: WaterLog[]) => {
  const m = new Map<string, number>();
  for (const w of water) m.set(w.day, (m.get(w.day) ?? 0) + w.ml);
  return m;
};

const hitWaterGoal = (day: string, d: GameData, byDay = waterByDay(d.water)) =>
  (byDay.get(day) ?? 0) >= waterGoalMl(d.settings, weightOn(d.weights, day));

export function dailyMedals(day: string, d: GameData, prDays = new Set(findPRs(d.sessions).map(p => localDay(new Date(p.at))))): MedalId[] {
  const treino = trainedDays(d.sessions).has(day);
  const hidratado = hitWaterGoal(day, d);
  const out: MedalId[] = [];
  if (treino) out.push('treino');
  if (hidratado) out.push('hidratado');
  if (prDays.has(day)) out.push('recorde');
  if (treino && hidratado) out.push('dia-completo');
  return out;
}

/** Dias marcados seguidos (antes de hoje) sem treino, contando para trás até o último treino. */
export function missedTrainDays(sessions: Session[], trainDays: number[], today: Date): number {
  const trained = trainedDays(sessions);
  let missed = 0;
  let day = addDays(localDay(today), -1);
  for (let i = 0; i < 60 && !trained.has(day); i++, day = addDays(day, -1))
    if (trainDays.includes(weekday(day))) missed++;
  return missed;
}

export const mood = (sessions: Session[], trainDays: number[], today: Date): 'happy' | 'sad' =>
  missedTrainDays(sessions, trainDays, today) >= RULES.sadAfterMissedTrainDays ? 'sad' : 'happy';

const sessionsPerWeek = (sessions: Session[]) => {
  const m = new Map<string, number>();
  for (const s of done(sessions)) m.set(weekStart(dayOf(s)), (m.get(weekStart(dayOf(s))) ?? 0) + 1);
  return m;
};

/** Semanas seguidas com a meta batida; a semana atual conta se já bateu. */
export function goalWeeksStreak(sessions: Session[], trainDays: number[], today: Date): number {
  const goal = trainDays.length;
  if (!goal) return 0;
  const perWeek = sessionsPerWeek(sessions);
  const current = weekStart(localDay(today));
  let streak = 0;
  for (let w = addDays(current, -7); (perWeek.get(w) ?? 0) >= goal; w = addDays(w, -7)) streak++;
  return streak + ((perWeek.get(current) ?? 0) >= goal ? 1 : 0);
}

export const allDays = (d: GameData, today: Date) => {
  const days = [...done(d.sessions).map(dayOf), ...d.water.map(w => w.day)].filter(x => x <= localDay(today));
  return [...new Set(days)].sort();
};

export function milestones(d: GameData, today: Date): MilestoneId[] {
  const m = RULES.milestones;
  const out: MilestoneId[] = [];
  const count = done(d.sessions).length;
  for (const n of m.workouts) if (count >= n) out.push(`treinos-${n}`);

  const goal = d.settings.trainDays.length;
  const weeksMet = goal ? [...sessionsPerWeek(d.sessions).values()].filter(n => n >= goal).length : 0;
  for (const n of m.goalWeeks) if (weeksMet >= n) out.push(`semanas-${n}`);

  const volume = done(d.sessions).flatMap(s => s.entries.flatMap(e => e.sets)).filter(isWork).reduce((v, x) => v + x.kg * x.reps, 0);
  for (const n of m.volumeKg) if (volume >= n) out.push(`volume-${n}`);

  const byDay = waterByDay(d.water);
  let run = 0;
  let best = 0;
  let prev = '';
  for (const day of [...byDay.keys()].sort()) {
    run = hitWaterGoal(day, d, byDay) ? (prev && addDays(prev, 1) === day ? run + 1 : 1) : 0;
    if (run) prev = day;
    best = Math.max(best, run);
  }
  if (best >= m.waterStreakDays) out.push(`agua-${m.waterStreakDays}`);
  return out;
}

export function computeXP(d: GameData, today: Date): { xp: number; stage: StageId; next: number | null } {
  const x = RULES.xp;
  const prs = findPRs(d.sessions);
  const prDays = new Set(prs.map(p => localDay(new Date(p.at))));
  const byDay = waterByDay(d.water);
  let xp = done(d.sessions).length * x.workout + prs.length * x.pr;
  for (const day of allDays(d, today)) {
    if (hitWaterGoal(day, d, byDay)) xp += x.waterGoal;
    xp += dailyMedals(day, d, prDays).length * x.medal;
  }
  xp += milestones(d, today).length * x.medal;
  const stages = RULES.stages;
  const idx = stages.findLastIndex(s => xp >= s.xp);
  return { xp, stage: stages[idx].id, next: stages[idx + 1]?.xp ?? null };
}
