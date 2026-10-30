// "Dia" é sempre o dia no fuso local do aparelho (YYYY-MM-DD). Nunca usar toISOString, que é UTC.
const pad = (n: number) => String(n).padStart(2, '0');

export const localDay = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseDay = (day: string): Date => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addDays = (day: string, n: number): string => {
  const d = parseDay(day);
  d.setDate(d.getDate() + n);
  return localDay(d);
};

/** 0 = domingo … 6 = sábado */
export const weekday = (day: string): number => parseDay(day).getDay();

/** Segunda-feira da semana do dia. */
export const weekStart = (day: string): string => addDays(day, -((weekday(day) + 6) % 7));

export const daysBetween = (a: string, b: string): number =>
  Math.round((parseDay(b).getTime() - parseDay(a).getTime()) / 86_400_000);
