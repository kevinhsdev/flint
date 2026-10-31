import { describe, expect, it } from 'vitest';
import { PLATE_COLOR } from '../../src/screens/train/PlateCalc';
import css from '../../src/styles/global.css?raw';
import tokens from '../../src/styles/tokens.css?raw';
import html from '../../index.html?raw';

const reduced = [...css.matchAll(/@media \(prefers-reduced-motion: reduce\) \{([^@]*?)\}\s*\}?/g)].map(m => m[1]).join('\n');

describe('estilos do redesign', () => {
  it('foto do card-destaque para de dar zoom com movimento reduzido', () => {
    expect(reduced).toMatch(/\.feat-ph[^{]*\{[^}]*animation: none/);
  });

  it('"compartilhar recorde" usa amarelo com texto escuro, legível no tema claro', () => {
    const chip = css.match(/\.share-pr-chip \{[^}]*\}/)![0];
    expect(chip).toContain('var(--ink-on-yellow)');
    expect(chip).not.toContain('--gold-hi');
  });

  it('azul do tema claro é escuro o bastante pra texto branco', () => {
    expect(tokens.match(/:root \{[\s\S]*?--blue: (#[0-9a-f]+)/i)![1].toLowerCase()).toBe('#1c7ed6');
  });

  it('modo escuro do sistema vale antes do tema ser aplicado (sem flash claro)', () => {
    expect(html.indexOf('prefers-color-scheme: dark')).toBeGreaterThan(-1);
    expect(html.indexOf('dataset.theme')).toBeLessThan(html.indexOf('</head>'));
  });

  it('Gota tem brilho branco atrás no bloco azul', () => {
    expect(css).toMatch(/\.mate > div:first-child \{[^}]*radial-gradient/);
  });

  it('anilhas claras não somem no cartão branco', () => {
    expect(PLATE_COLOR[5]).not.toBe('#F5F0F7');
    expect(PLATE_COLOR[1.25]).not.toBe('#6E6177');
  });
});
