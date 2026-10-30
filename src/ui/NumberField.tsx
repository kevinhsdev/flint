import { useEffect, useState, type InputHTMLAttributes } from 'react';

/** "22,5" ou "22.5" → 22.5; vazio, inválido ou negativo → null. */
export function parseKg(input: string): number | null {
  const t = input.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export const fmtNum = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | null;
  onValue(n: number | null): void;
  decimal?: boolean;
};

/** Campo numérico que aceita vírgula e mantém o texto enquanto a pessoa digita. */
export function NumberField({ value, onValue, decimal = false, ...rest }: Props) {
  const [text, setText] = useState(value ? fmtNum(value) : '');
  useEffect(() => { if (parseKg(text) !== value) setText(value ? fmtNum(value) : ''); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <input
      type="text" inputMode={decimal ? 'decimal' : 'numeric'} autoComplete="off" {...rest}
      value={text}
      onChange={e => { setText(e.target.value); onValue(parseKg(e.target.value)); }}
      onFocus={e => e.currentTarget.select()}
    />
  );
}
