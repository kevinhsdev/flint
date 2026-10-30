import { bmi, type BmiBand } from './body';
import type { Equipment, Exercise, Goal, Muscle, Place, Profile, Template, TemplateItem } from './types';

/* Gerador do plano da pesquisa inicial: regras locais e previsíveis, sem IA. */

export const PLACE_EQUIPMENT: Record<Place, Equipment[]> = {
  completa: ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight'],
  basica: ['barbell', 'dumbbell', 'machine', 'bodyweight'],
  casa: ['dumbbell', 'bodyweight'],
};

const DOSE: Record<Goal, { reps: [number, number]; restSec: number }> = {
  massa: { reps: [8, 12], restSec: 90 },
  forca: { reps: [3, 6], restSec: 180 },
  emagrecer: { reps: [12, 15], restSec: 60 },
  condicionamento: { reps: [12, 15], restSec: 60 },
};
const COUNT: Record<Profile['minutes'], number> = { 30: 4, 45: 5, 60: 6, 90: 7 };

// Preferência por músculo: compostos primeiro. A biblioteca filtra pelo equipamento disponível.
const PREF: Record<Muscle, string[]> = {
  peito: ['supino-reto-barra', 'supino-reto-halter', 'supino-inclinado-halter', 'supino-maquina', 'supino-inclinado-barra', 'crucifixo-halter', 'peck-deck', 'crossover-polia', 'flexao', 'crucifixo-inclinado-halter', 'paralelas-peito'],
  costas: ['puxada-frente', 'remada-curvada-barra', 'remada-unilateral-halter', 'remada-maquina', 'barra-fixa', 'remada-baixa', 'remada-cavalinho', 'puxada-triangulo', 'pullover-halter', 'pulldown-braco-reto', 'levantamento-terra'],
  ombros: ['desenvolvimento-halter', 'elevacao-lateral', 'desenvolvimento-maquina', 'desenvolvimento-barra', 'elevacao-lateral-polia', 'face-pull', 'crucifixo-inverso', 'voador-inverso', 'arnold-press', 'elevacao-frontal'],
  biceps: ['rosca-direta-barra', 'rosca-alternada', 'rosca-martelo', 'rosca-scott-maquina', 'rosca-polia', 'rosca-inclinada', 'rosca-concentrada', 'rosca-w'],
  triceps: ['triceps-polia-barra', 'triceps-corda', 'triceps-testa', 'triceps-frances', 'supino-fechado', 'mergulho-banco', 'triceps-coice', 'paralelas-triceps'],
  antebraco: ['rosca-inversa', 'farmer-walk', 'rosca-punho', 'rosca-punho-inversa'],
  abdomen: ['prancha', 'abdominal-crunch', 'abdominal-maquina', 'abdominal-polia', 'elevacao-pernas', 'abdominal-bicicleta', 'prancha-lateral'],
  quadriceps: ['agachamento-livre', 'leg-press-45', 'agachamento-goblet', 'agachamento-hack', 'cadeira-extensora', 'agachamento-bulgaro', 'afundo', 'agachamento-smith', 'passada', 'leg-press-horizontal', 'agachamento-frontal'],
  posterior: ['terra-romeno', 'mesa-flexora', 'stiff-halter', 'cadeira-flexora', 'stiff', 'flexora-em-pe', 'good-morning', 'nordic-curl'],
  gluteos: ['elevacao-pelvica', 'elevacao-pelvica-maquina', 'agachamento-sumo', 'ponte-gluteo', 'step-up', 'cadeira-abdutora', 'coice-polia'],
  panturrilha: ['panturrilha-em-pe', 'panturrilha-sentado', 'panturrilha-unilateral', 'panturrilha-leg-press'],
  trapezio: ['encolhimento-halter', 'encolhimento-barra', 'encolhimento-maquina'],
};
// iniciantes e 50+: guiado primeiro
const GENTLE_RANK: Record<Equipment, number> = { machine: 0, dumbbell: 1, cable: 2, barbell: 3, bodyweight: 4 };
const NOT_FIRST = new Set(['levantamento-terra', 'agachamento-livre', 'good-morning', 'nordic-curl']);

type Day = [label: string, slots: Muscle[]];
const FULL_A: Day = ['Corpo todo', ['quadriceps', 'peito', 'costas', 'ombros', 'posterior', 'biceps', 'triceps', 'abdomen']];
const FULL_B: Day = ['Corpo todo', ['posterior', 'costas', 'peito', 'quadriceps', 'ombros', 'triceps', 'biceps', 'panturrilha']];
const FULL_C: Day = ['Corpo todo', ['quadriceps', 'ombros', 'costas', 'peito', 'gluteos', 'biceps', 'triceps', 'abdomen']];
const PUSH: Day = ['Peito, ombro e tríceps', ['peito', 'ombros', 'peito', 'ombros', 'triceps', 'triceps', 'peito', 'abdomen']];
const PULL: Day = ['Costas e bíceps', ['costas', 'costas', 'costas', 'trapezio', 'biceps', 'biceps', 'antebraco', 'abdomen']];
const LEGS: Day = ['Pernas', ['quadriceps', 'posterior', 'quadriceps', 'gluteos', 'posterior', 'panturrilha', 'quadriceps', 'abdomen']];
const UP_A: Day = ['Superior', ['peito', 'costas', 'ombros', 'peito', 'costas', 'biceps', 'triceps', 'abdomen']];
const LOW_A: Day = ['Inferior', ['quadriceps', 'posterior', 'quadriceps', 'gluteos', 'panturrilha', 'posterior', 'abdomen', 'quadriceps']];
const UP_B: Day = ['Superior', ['costas', 'peito', 'ombros', 'costas', 'triceps', 'biceps', 'peito', 'trapezio']];
const LOW_B: Day = ['Inferior', ['posterior', 'quadriceps', 'gluteos', 'quadriceps', 'panturrilha', 'posterior', 'abdomen', 'gluteos']];
const FIVE: Day[] = [
  ['Peito', ['peito', 'peito', 'peito', 'peito', 'abdomen', 'peito', 'abdomen', 'peito']],
  ['Costas', ['costas', 'costas', 'costas', 'costas', 'trapezio', 'costas', 'trapezio', 'costas']],
  ['Pernas', LEGS[1]],
  ['Ombros', ['ombros', 'ombros', 'ombros', 'ombros', 'trapezio', 'ombros', 'abdomen', 'ombros']],
  ['Braços', ['biceps', 'triceps', 'biceps', 'triceps', 'antebraco', 'biceps', 'triceps', 'antebraco']],
];

function split(p: Profile): { name: string; days: Day[] } {
  const n = Math.min(6, Math.max(2, p.days.length));
  if (n === 2) return { name: 'Corpo todo A/B', days: [FULL_A, FULL_B] };
  if (n === 3) return p.level === 'iniciante' ? { name: 'Corpo todo A/B/C', days: [FULL_A, FULL_B, FULL_C] } : { name: 'ABC', days: [PUSH, PULL, LEGS] };
  if (n === 4) return { name: 'Superior/Inferior', days: [UP_A, LOW_A, UP_B, LOW_B] };
  if (n === 5) return { name: 'ABCDE', days: FIVE };
  return { name: 'Empurrar/Puxar/Pernas ×2', days: [PUSH, PULL, LEGS, PUSH, PULL, LEGS] };
}

export function generatePlan(p: Profile, lib: Exercise[]): Template[] {
  const allowed = new Set(PLACE_EQUIPMENT[p.place]);
  const gentle = p.level === 'iniciante' || p.age >= 50;
  const byId = new Map(lib.filter(e => !e.archived && allowed.has(e.equipment)).map(e => [e.id, e]));
  const candidates = (m: Muscle) => {
    const xs = PREF[m].map(id => byId.get(id)).filter((e): e is Exercise => !!e);
    for (const e of byId.values()) if (e.primary === m && !xs.includes(e)) xs.push(e); // exercícios próprios no fim
    return gentle ? xs.map((e, i) => [e, i] as const).sort((a, b) => GENTLE_RANK[a[0].equipment] - GENTLE_RANK[b[0].equipment] || a[1] - b[1]).map(x => x[0]) : xs;
  };
  const { reps, restSec } = DOSE[p.goal];
  const n = COUNT[p.minutes];
  const { days } = split(p);
  // dias repetidos (PPL ×2) usam a 2ª opção de cada músculo para variar
  const seen = new Map<string, number>();
  return days.map(([label, slots], order) => {
    const round = seen.get(label) ?? 0; seen.set(label, round + 1);
    const ids: string[] = [];
    // percorre os slots; se faltar candidato, segue para os próximos músculos do mesmo dia (dando a volta)
    for (let i = 0; ids.length < n && i < slots.length * 3; i++) {
      const pool = candidates(slots[i % slots.length]).filter(e => !ids.includes(e.id));
      const pick = pool[Math.min(round, pool.length - 1)];
      if (pick) ids.push(pick.id);
    }
    if (gentle && NOT_FIRST.has(ids[0])) {
      const j = ids.findIndex(id => !NOT_FIRST.has(id));
      if (j > 0) [ids[0], ids[j]] = [ids[j], ids[0]];
    }
    const letter = String.fromCharCode(65 + order);
    const items: TemplateItem[] = ids.map((exerciseId, i) => ({
      exerciseId, repMin: reps[0], repMax: reps[1], restSec,
      sets: p.level === 'iniciante' ? 3 : i < 2 ? Math.max(3, 4 - (p.age >= 50 ? 1 : 0)) : 3,
    }));
    return { id: `plan-${letter}`, name: `${letter} — ${label}`, order, archived: false, items };
  });
}

const WHY: Record<Goal, string> = {
  massa: 'Séries de 8 a 12 repetições com carga que desafia: a faixa que mais faz o músculo crescer.',
  forca: 'Poucas repetições com carga alta e descanso longo, para ficar mais forte a cada semana.',
  emagrecer: 'Mais repetições e descanso curto: o treino gasta mais energia e preserva o músculo enquanto você perde gordura.',
  condicionamento: 'Ritmo alto e descanso curto para ganhar fôlego, resistência e disposição no dia a dia.',
};

export function planSummary(p: Profile): { split: string; why: string; reps: [number, number]; restSec: number } {
  const { reps, restSec } = DOSE[p.goal];
  return { split: `${split(p).name} · ${p.days.length}x por semana`, why: WHY[p.goal], reps, restSec };
}

const BMI_TEXT: Record<BmiBand, string> = {
  abaixo: 'Você está abaixo da faixa de referência. Treino de força com constância ajuda a ganhar massa e energia.',
  normal: 'Você está na faixa de referência. Agora é construir força e manter a constância.',
  sobrepeso: 'Você está um pouco acima da faixa de referência. Treinar com regularidade já muda esse número com o tempo.',
  obesidade: 'Você está acima da faixa de referência. Cada treino conta, e o seu plano começa num ritmo que dá para manter.',
};

/** IMC para a tela de diagnóstico: o número é um ponto de partida, não um julgamento. */
export function bmiCopy(kg: number, cm: number, age: number): { value: number; band: BmiBand; text: string } {
  const { value, band } = bmi(kg, cm);
  const note = age >= 60 ? ' Depois dos 60, o IMC diz menos sobre saúde: força e mobilidade importam mais.' : '';
  return { value, band, text: BMI_TEXT[band] + note };
}
