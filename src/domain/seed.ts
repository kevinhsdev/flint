// Dados de exemplo da demo: ~6 semanas de rotina A–F, relativos a "hoje" e determinísticos.
import { addDays, localDay, parseDay, weekday } from './dates';
import { RULES } from './rules';
import { EXERCISES } from './exercises';
import type { Session, Settings, Template, TemplateItem, WaterLog, WeightLog } from './types';
import { DEFAULT_SETTINGS } from './settings';

const WEEKS = 5;

// [letra, nome, [exercício, séries, carga inicial]]
const ROUTINE: [string, string, [string, number, number][]][] = [
  ['A', 'A — Peito e tríceps', [['supino-reto-barra', 4, 60], ['supino-inclinado-halter', 3, 22], ['crossover-polia', 3, 15], ['triceps-corda', 3, 20], ['triceps-frances', 3, 14]]],
  ['B', 'B — Costas e bíceps', [['puxada-frente', 4, 50], ['remada-curvada-barra', 4, 50], ['remada-baixa', 3, 45], ['rosca-direta-barra', 3, 25], ['rosca-martelo', 3, 12]]],
  ['C', 'C — Quadríceps', [['agachamento-livre', 4, 70], ['leg-press-45', 4, 160], ['cadeira-extensora', 3, 45], ['afundo', 3, 14], ['panturrilha-em-pe', 4, 60]]],
  ['D', 'D — Ombros', [['desenvolvimento-halter', 4, 20], ['elevacao-lateral', 4, 8], ['face-pull', 3, 20], ['encolhimento-halter', 3, 26], ['abdominal-polia', 3, 30]]],
  ['E', 'E — Peito e costas', [['supino-inclinado-barra', 4, 50], ['peck-deck', 3, 45], ['puxada-triangulo', 4, 50], ['remada-unilateral-halter', 3, 24], ['abdominal-maquina', 3, 35]]],
  ['F', 'F — Posterior e glúteos', [['terra-romeno', 4, 70], ['mesa-flexora', 3, 35], ['elevacao-pelvica', 4, 80], ['cadeira-abdutora', 3, 50], ['panturrilha-sentado', 4, 40]]],
];

/** PRNG mulberry32: mesmo resultado a cada chamada. */
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const at = (day: string, h: number, m = 0) => {
  const d = parseDay(day);
  d.setHours(h, m);
  return d.getTime();
};

export function makeSeed(today: Date): { templates: Template[]; sessions: Session[]; water: WaterLog[]; weights: WeightLog[]; settings: Settings } {
  const rand = rng(42);
  const todayDay = localDay(today);
  const first = addDays(todayDay, -WEEKS * 7);
  const settings: Settings = { ...DEFAULT_SETTINGS, demo: true, heightCm: 178, trainDays: [1, 2, 3, 4, 5, 6] };

  const templates: Template[] = ROUTINE.map(([letter, name, rows], order) => ({
    id: `seed-t-${letter}`, name, order, archived: false,
    items: rows.map(([exerciseId, sets]): TemplateItem => ({ exerciseId, sets, repMin: 8, repMax: 12, restSec: 90 })),
  }));

  // estado de progressão por exercício: carga atual e reps "alcançáveis"
  const prog = new Map<string, { kg: number; reps: number }>(ROUTINE.flatMap(([, , rows]) => rows.map(([id, , kg]) => [id, { kg, reps: 8 }])));
  const sessions: Session[] = [];
  let next = 0;
  for (let day = first; day < todayDay; day = addDays(day, 1)) {
    if (!settings.trainDays.includes(weekday(day)) || rand() < 0.2) continue; // ~1 falta a cada 5 dias
    const t = templates[next++ % templates.length];
    const startedAt = at(day, 18, Math.floor(rand() * 40));
    const entries = t.items.map(item => {
      const p = prog.get(item.exerciseId)!;
      const eq = EXERCISES.find(e => e.id === item.exerciseId)!.equipment;
      const sets = Array.from({ length: item.sets }, (_, i) => ({
        kg: p.kg,
        reps: Math.max(item.repMin - 2, Math.min(item.repMax, p.reps - (i > 1 && rand() < 0.5 ? 1 : 0))),
        done: true,
      }));
      if (sets.every(s => s.reps >= item.repMax)) { p.kg += RULES.overloadKg[eq]; p.reps = item.repMin; }
      else if (rand() < 0.35) p.reps++;
      return { exerciseId: item.exerciseId, sets };
    });
    sessions.push({ id: `seed-s-${day}`, templateId: t.id, name: t.name, startedAt, endedAt: startedAt + (52 + Math.floor(rand() * 25)) * 60_000, entries });
  }

  const weights: WeightLog[] = [];
  for (let day = first, i = 0; day <= todayDay; day = addDays(day, 3 + (i++ % 2))) {
    const k = (parseDay(day).getTime() - parseDay(first).getTime()) / (parseDay(todayDay).getTime() - parseDay(first).getTime());
    weights.push({ id: `seed-p-${day}`, day, kg: Math.round((82 - 2.5 * k + (rand() - 0.5) * 0.6) * 10) / 10 });
  }

  const water: WaterLog[] = [];
  const goal = 2750;
  for (let day = first; day <= todayDay; day = addDays(day, 1)) {
    const target = day === todayDay ? goal * 0.45 : goal * (0.6 + rand() * 0.6);
    for (let ml = 0, h = 8; ml < target && h < 22; h += 1 + Math.floor(rand() * 2)) {
      const cup = rand() < 0.35 ? 500 : 250;
      const t = at(day, h, Math.floor(rand() * 60));
      if (t > today.getTime()) break;
      water.push({ id: `seed-w-${day}-${h}`, day, at: t, ml: cup });
      ml += cup;
    }
  }

  return { templates, sessions, water, weights, settings };
}
