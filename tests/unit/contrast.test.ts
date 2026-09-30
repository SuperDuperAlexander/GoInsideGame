import { describe, expect, it } from 'vitest';
import { hexToRgb, PALETTE } from '../../src/config/palette';

function lin(c: number) {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function lum([r, g, b]: [number, number, number]) {
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function ratio(a: [number, number, number], b: [number, number, number]) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}
function rgba(s: string): [number, number, number, number] {
  const m = s.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)!;
  return [Number(m[1]) / 255, Number(m[2]) / 255, Number(m[3]) / 255, Number(m[4])];
}
/** A translucent panel over a backdrop. */
function over(panel: string, backdrop: string): [number, number, number] {
  const [r, g, b, a] = rgba(panel);
  const [br, bg, bb] = hexToRgb(backdrop);
  return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)];
}

describe('WCAG AA contrast (4.5:1) of UI text on its panels', () => {
  const U = PALETTE.ui;
  it('dark text on the ivory panel, over the darkest and lightest outer backdrops', () => {
    for (const bd of [PALETTE.outer.ink, PALETTE.outer.card700, PALETTE.outer.card100, PALETTE.inner.night])
      expect(ratio(hexToRgb(U.text), over(U.panel, bd))).toBeGreaterThanOrEqual(4.5);
  });
  it('light text on the dark panel, over light and dark inner backdrops', () => {
    for (const bd of [PALETTE.inner.ivory, PALETTE.inner.gold, PALETTE.inner.night, PALETTE.inner.amber])
      expect(ratio(hexToRgb(U.textLight), over(U.panelDark, bd))).toBeGreaterThanOrEqual(4.5);
  });
  it('button text (light on dark text colour) and seed card', () => {
    expect(ratio(hexToRgb(U.textLight), hexToRgb(U.text))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(hexToRgb(PALETTE.outer.ink), hexToRgb(PALETTE.inner.ivory))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(hexToRgb(U.text), hexToRgb(PALETTE.inner.gold))).toBeGreaterThanOrEqual(4.5);
  });
});
