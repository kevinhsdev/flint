import type { Goal, Level, Place, Profile } from '../../domain/types';

/* Perguntas da pesquisa como dados: a tela só desenha. */

export type Option<T> = { value: T; label: string; hint: string };

export const GOALS: Option<Goal>[] = [
  { value: 'massa', label: 'Ganhar massa', hint: 'Mais músculo e volume' },
  { value: 'emagrecer', label: 'Emagrecer', hint: 'Perder gordura sem perder músculo' },
  { value: 'condicionamento', label: 'Condicionamento e saúde', hint: 'Fôlego e disposição no dia a dia' },
  { value: 'forca', label: 'Ficar mais forte', hint: 'Carga maior a cada semana' },
];

export const LEVELS: Option<Level>[] = [
  { value: 'iniciante', label: 'Começando', hint: 'Menos de 6 meses' },
  { value: 'intermediario', label: 'Intermediário', hint: 'De 6 meses a 2 anos' },
  { value: 'avancado', label: 'Avançado', hint: 'Mais de 2 anos' },
];

export const MINUTES: Option<Profile['minutes']>[] = [
  { value: 30, label: '30 min', hint: 'Rápido e direto' },
  { value: 45, label: '45 min', hint: 'O suficiente pra render' },
  { value: 60, label: '60 min', hint: 'O treino clássico' },
  { value: 90, label: '90 min', hint: 'Sem pressa' },
];

export const PLACES: Option<Place>[] = [
  { value: 'completa', label: 'Academia completa', hint: 'Barras, halteres, máquinas e polias' },
  { value: 'basica', label: 'Academia básica', hint: 'Sem polia' },
  { value: 'casa', label: 'Em casa', hint: 'Halteres e peso do corpo' },
];

export const WEEKDAYS: [number, string][] = [[1, 'Seg'], [2, 'Ter'], [3, 'Qua'], [4, 'Qui'], [5, 'Sex'], [6, 'Sáb'], [0, 'Dom']];

export const RANGES = { kg: [30, 300], cm: [120, 230], age: [13, 100] } as const;
export const inRange = (n: number | null, [lo, hi]: readonly [number, number]) => n !== null && n >= lo && n <= hi;

export const STEP_TITLES = {
  goal: 'Qual é o seu objetivo?',
  level: 'Há quanto tempo você treina?',
  days: 'Em quais dias você pode treinar?',
  minutes: 'Quanto tempo por treino?',
  place: 'Onde você treina?',
  own: 'Você já tem um treino?',
  body: 'Agora, sobre você',
  time: 'Que horas você costuma treinar?',
} as const;
export type StepId = keyof typeof STEP_TITLES;

/** Fala da Faísca em cada passo. */
export const STEP_LINES: Record<StepId, string> = {
  goal: 'Oi! Sou a Faísca. Me conta o que você quer, que eu monto o caminho.',
  level: 'Sem julgamento: isso só ajusta o volume.',
  days: 'Escolha de 2 a 6 dias. Constância vale mais que quantidade.',
  minutes: 'Isso define quantos exercícios cabem em cada treino.',
  place: 'Só entram exercícios com o que você tem.',
  own: 'Se você já tem o seu, eu não atrapalho.',
  body: 'Peso e altura dão a meta de água e o ponto de partida.',
  time: 'Uso isso pros lembretes, quando eles chegarem.',
};

/** Marcos de 4, 8 e 12 semanas por objetivo. */
export const MILESTONES: Record<Goal, [string, string, string]> = {
  massa: ['Técnica firme e as primeiras cargas subindo.', 'Roupas mais justas nos braços e no peito.', 'Diferença visível no espelho e nas fotos.'],
  emagrecer: ['Mais disposição e o hábito instalado.', 'Medidas caindo, com força mantida.', 'Mudança clara no corpo e no fôlego.'],
  condicionamento: ['Escadas e treinos ficam mais leves.', 'Recuperação mais rápida entre séries.', 'Fôlego e resistência de outro nível.'],
  forca: ['Os movimentos ficam automáticos.', 'Recordes novos quase toda semana.', 'Cargas que pareciam impossíveis no começo.'],
};
