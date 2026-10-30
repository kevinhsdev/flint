import type { Equipment, Exercise, Muscle } from './types';

// [id, nome, músculo primário, secundários, equipamento]
type Row = [string, string, Muscle, Muscle[], Equipment];

const ROWS: Row[] = [
  // peito
  ['supino-reto-barra', 'Supino reto com barra', 'peito', ['triceps', 'ombros'], 'barbell'],
  ['supino-inclinado-barra', 'Supino inclinado com barra', 'peito', ['ombros', 'triceps'], 'barbell'],
  ['supino-declinado-barra', 'Supino declinado com barra', 'peito', ['triceps'], 'barbell'],
  ['supino-reto-halter', 'Supino reto com halteres', 'peito', ['triceps', 'ombros'], 'dumbbell'],
  ['supino-inclinado-halter', 'Supino inclinado com halteres', 'peito', ['ombros', 'triceps'], 'dumbbell'],
  ['crucifixo-halter', 'Crucifixo com halteres', 'peito', ['ombros'], 'dumbbell'],
  ['crucifixo-inclinado-halter', 'Crucifixo inclinado', 'peito', ['ombros'], 'dumbbell'],
  ['crossover-polia', 'Crossover na polia', 'peito', ['ombros'], 'cable'],
  ['peck-deck', 'Peck deck (voador)', 'peito', [], 'machine'],
  ['supino-maquina', 'Supino na máquina', 'peito', ['triceps'], 'machine'],
  ['flexao', 'Flexão de braço', 'peito', ['triceps', 'ombros'], 'bodyweight'],
  ['paralelas-peito', 'Paralelas (peito)', 'peito', ['triceps'], 'bodyweight'],
  // costas
  ['barra-fixa', 'Barra fixa', 'costas', ['biceps'], 'bodyweight'],
  ['barra-fixa-supinada', 'Barra fixa supinada', 'costas', ['biceps'], 'bodyweight'],
  ['puxada-frente', 'Puxada frontal', 'costas', ['biceps'], 'cable'],
  ['puxada-triangulo', 'Puxada com triângulo', 'costas', ['biceps'], 'cable'],
  ['puxada-supinada', 'Puxada supinada', 'costas', ['biceps'], 'cable'],
  ['remada-curvada-barra', 'Remada curvada com barra', 'costas', ['biceps', 'posterior'], 'barbell'],
  ['remada-pendlay', 'Remada Pendlay', 'costas', ['biceps'], 'barbell'],
  ['remada-unilateral-halter', 'Remada unilateral com halter', 'costas', ['biceps'], 'dumbbell'],
  ['remada-baixa', 'Remada baixa na polia', 'costas', ['biceps'], 'cable'],
  ['remada-maquina', 'Remada na máquina', 'costas', ['biceps'], 'machine'],
  ['remada-cavalinho', 'Remada cavalinho (T-bar)', 'costas', ['biceps'], 'barbell'],
  ['pulldown-braco-reto', 'Pulldown com braço reto', 'costas', [], 'cable'],
  ['pullover-halter', 'Pullover com halter', 'costas', ['peito'], 'dumbbell'],
  ['levantamento-terra', 'Levantamento terra', 'costas', ['posterior', 'gluteos', 'trapezio'], 'barbell'],
  ['hiperextensao', 'Hiperextensão lombar', 'costas', ['gluteos', 'posterior'], 'bodyweight'],
  // ombros
  ['desenvolvimento-barra', 'Desenvolvimento com barra', 'ombros', ['triceps'], 'barbell'],
  ['desenvolvimento-halter', 'Desenvolvimento com halteres', 'ombros', ['triceps'], 'dumbbell'],
  ['desenvolvimento-maquina', 'Desenvolvimento na máquina', 'ombros', ['triceps'], 'machine'],
  ['arnold-press', 'Arnold press', 'ombros', ['triceps'], 'dumbbell'],
  ['elevacao-lateral', 'Elevação lateral', 'ombros', [], 'dumbbell'],
  ['elevacao-lateral-polia', 'Elevação lateral na polia', 'ombros', [], 'cable'],
  ['elevacao-frontal', 'Elevação frontal', 'ombros', [], 'dumbbell'],
  ['crucifixo-inverso', 'Crucifixo inverso', 'ombros', ['costas'], 'dumbbell'],
  ['face-pull', 'Face pull', 'ombros', ['trapezio'], 'cable'],
  ['voador-inverso', 'Voador inverso (máquina)', 'ombros', ['costas'], 'machine'],
  ['remada-alta', 'Remada alta', 'ombros', ['trapezio'], 'barbell'],
  // trapézio
  ['encolhimento-barra', 'Encolhimento com barra', 'trapezio', [], 'barbell'],
  ['encolhimento-halter', 'Encolhimento com halteres', 'trapezio', [], 'dumbbell'],
  ['encolhimento-maquina', 'Encolhimento na máquina', 'trapezio', [], 'machine'],
  // bíceps
  ['rosca-direta-barra', 'Rosca direta com barra', 'biceps', ['antebraco'], 'barbell'],
  ['rosca-w', 'Rosca com barra W', 'biceps', ['antebraco'], 'barbell'],
  ['rosca-alternada', 'Rosca alternada com halteres', 'biceps', ['antebraco'], 'dumbbell'],
  ['rosca-martelo', 'Rosca martelo', 'biceps', ['antebraco'], 'dumbbell'],
  ['rosca-concentrada', 'Rosca concentrada', 'biceps', [], 'dumbbell'],
  ['rosca-scott', 'Rosca Scott', 'biceps', [], 'barbell'],
  ['rosca-scott-maquina', 'Rosca Scott na máquina', 'biceps', [], 'machine'],
  ['rosca-polia', 'Rosca na polia', 'biceps', ['antebraco'], 'cable'],
  ['rosca-inclinada', 'Rosca inclinada com halteres', 'biceps', [], 'dumbbell'],
  // tríceps
  ['triceps-polia-barra', 'Tríceps na polia (barra)', 'triceps', [], 'cable'],
  ['triceps-corda', 'Tríceps corda', 'triceps', [], 'cable'],
  ['triceps-testa', 'Tríceps testa', 'triceps', [], 'barbell'],
  ['triceps-frances', 'Tríceps francês', 'triceps', [], 'dumbbell'],
  ['triceps-coice', 'Tríceps coice', 'triceps', [], 'dumbbell'],
  ['triceps-overhead-polia', 'Tríceps acima da cabeça na polia', 'triceps', [], 'cable'],
  ['supino-fechado', 'Supino fechado', 'triceps', ['peito'], 'barbell'],
  ['mergulho-banco', 'Mergulho no banco', 'triceps', ['peito'], 'bodyweight'],
  ['paralelas-triceps', 'Paralelas (tríceps)', 'triceps', ['peito'], 'bodyweight'],
  // antebraço
  ['rosca-punho', 'Rosca de punho', 'antebraco', [], 'barbell'],
  ['rosca-punho-inversa', 'Rosca de punho inversa', 'antebraco', [], 'barbell'],
  ['rosca-inversa', 'Rosca inversa', 'antebraco', ['biceps'], 'barbell'],
  ['farmer-walk', 'Caminhada do fazendeiro', 'antebraco', ['trapezio'], 'dumbbell'],
  // quadríceps
  ['agachamento-livre', 'Agachamento livre', 'quadriceps', ['gluteos', 'posterior'], 'barbell'],
  ['agachamento-frontal', 'Agachamento frontal', 'quadriceps', ['gluteos'], 'barbell'],
  ['agachamento-smith', 'Agachamento no Smith', 'quadriceps', ['gluteos'], 'machine'],
  ['agachamento-hack', 'Agachamento hack', 'quadriceps', ['gluteos'], 'machine'],
  ['agachamento-goblet', 'Agachamento goblet', 'quadriceps', ['gluteos'], 'dumbbell'],
  ['agachamento-bulgaro', 'Agachamento búlgaro', 'quadriceps', ['gluteos'], 'dumbbell'],
  ['leg-press-45', 'Leg press 45°', 'quadriceps', ['gluteos'], 'machine'],
  ['leg-press-horizontal', 'Leg press horizontal', 'quadriceps', ['gluteos'], 'machine'],
  ['cadeira-extensora', 'Cadeira extensora', 'quadriceps', [], 'machine'],
  ['cadeira-adutora', 'Cadeira adutora', 'quadriceps', [], 'machine'],
  ['afundo', 'Afundo', 'quadriceps', ['gluteos'], 'dumbbell'],
  ['passada', 'Passada (avanço)', 'quadriceps', ['gluteos'], 'dumbbell'],
  ['sissy-squat', 'Sissy squat', 'quadriceps', [], 'bodyweight'],
  // posterior
  ['stiff', 'Stiff', 'posterior', ['gluteos', 'costas'], 'barbell'],
  ['terra-romeno', 'Levantamento terra romeno', 'posterior', ['gluteos'], 'barbell'],
  ['stiff-halter', 'Stiff com halteres', 'posterior', ['gluteos'], 'dumbbell'],
  ['mesa-flexora', 'Mesa flexora', 'posterior', [], 'machine'],
  ['cadeira-flexora', 'Cadeira flexora', 'posterior', [], 'machine'],
  ['flexora-em-pe', 'Flexora em pé', 'posterior', [], 'machine'],
  ['good-morning', 'Good morning', 'posterior', ['costas', 'gluteos'], 'barbell'],
  ['nordic-curl', 'Flexão nórdica', 'posterior', [], 'bodyweight'],
  // glúteos
  ['elevacao-pelvica', 'Elevação pélvica (hip thrust)', 'gluteos', ['posterior'], 'barbell'],
  ['elevacao-pelvica-maquina', 'Elevação pélvica na máquina', 'gluteos', ['posterior'], 'machine'],
  ['ponte-gluteo', 'Ponte de glúteo', 'gluteos', ['posterior'], 'bodyweight'],
  ['cadeira-abdutora', 'Cadeira abdutora', 'gluteos', [], 'machine'],
  ['coice-polia', 'Coice na polia', 'gluteos', ['posterior'], 'cable'],
  ['agachamento-sumo', 'Agachamento sumô', 'gluteos', ['quadriceps', 'posterior'], 'dumbbell'],
  ['step-up', 'Subida no banco', 'gluteos', ['quadriceps'], 'dumbbell'],
  // panturrilha
  ['panturrilha-em-pe', 'Panturrilha em pé', 'panturrilha', [], 'machine'],
  ['panturrilha-sentado', 'Panturrilha sentado', 'panturrilha', [], 'machine'],
  ['panturrilha-leg-press', 'Panturrilha no leg press', 'panturrilha', [], 'machine'],
  ['panturrilha-unilateral', 'Panturrilha unilateral', 'panturrilha', [], 'dumbbell'],
  // abdômen
  ['abdominal-crunch', 'Abdominal crunch', 'abdomen', [], 'bodyweight'],
  ['abdominal-polia', 'Abdominal na polia', 'abdomen', [], 'cable'],
  ['abdominal-maquina', 'Abdominal na máquina', 'abdomen', [], 'machine'],
  ['elevacao-pernas', 'Elevação de pernas', 'abdomen', [], 'bodyweight'],
  ['elevacao-pernas-barra', 'Elevação de pernas na barra', 'abdomen', ['antebraco'], 'bodyweight'],
  ['prancha', 'Prancha', 'abdomen', ['ombros'], 'bodyweight'],
  ['prancha-lateral', 'Prancha lateral', 'abdomen', [], 'bodyweight'],
  ['abdominal-bicicleta', 'Abdominal bicicleta', 'abdomen', [], 'bodyweight'],
  ['roda-abdominal', 'Roda abdominal', 'abdomen', ['ombros'], 'bodyweight'],
  ['pallof-press', 'Pallof press', 'abdomen', [], 'cable'],
];

export const EXERCISES: Exercise[] = ROWS.map(([id, name, primary, secondary, equipment]) => ({
  id, name, primary, secondary, equipment, custom: false, archived: false,
}));

export const MUSCLE_NAMES: Record<Muscle, string> = {
  peito: 'Peito', costas: 'Costas', ombros: 'Ombros', biceps: 'Bíceps', triceps: 'Tríceps',
  antebraco: 'Antebraço', abdomen: 'Abdômen', quadriceps: 'Quadríceps', posterior: 'Posterior',
  gluteos: 'Glúteos', panturrilha: 'Panturrilha', trapezio: 'Trapézio',
};

/** Para busca sem acento e sem diferença de maiúsculas. */
export const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
