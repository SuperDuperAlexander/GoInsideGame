import { PALETTE } from '../config/palette';
import { GeoBuilder, rgb, rng, type RGB } from '../render/geometry';

/**
 * The 8 disturbance types × 3 forms (CONTENT §3) as simple procedural shapes.
 * Local frame: standing on y = 0, facing −z (towards the player coming up the lane), about 3 m wide.
 * Soft and melancholic or tempting, never horror.
 */
export interface FormGeometry {
  body: GeoBuilder;
  ink: GeoBuilder;
  /** Height of the form, for the echo text and the choice pair. */
  height: number;
}

const INK = rgb(PALETTE.outer.ink);

function shades(hex: string) {
  const c = rgb(hex);
  const mix = (t: number, to: number): RGB => [c[0] + (to - c[0]) * t, c[1] + (to - c[1]) * t, c[2] + (to - c[2]) * t];
  return { base: c, light: mix(0.45, 1), pale: mix(0.7, 1), dark: mix(0.45, 0), deep: mix(0.7, 0) };
}

type Kit = ReturnType<typeof makeKit>;

function makeKit(body: GeoBuilder, ink: GeoBuilder) {
  return {
    box(x: number, y: number, z: number, w: number, h: number, d: number, c: RGB, rot = 0, outline = true) {
      body.box(x, y, z, w, h, d, rot, c);
      if (outline) ink.box(x, y, z, w, h, d, rot, INK, { inflate: 0.035, inside: true });
    },
    cyl(x: number, y: number, z: number, r0: number, r1: number, h: number, n: number, c: RGB, outline = true) {
      body.cylinder(x, y, z, r0, r1, h, n, c);
      if (outline) ink.cylinder(x, y, z, r0, r1, h, n, INK, { inflate: 0.035, inside: true });
    },
    blob(x: number, y: number, z: number, rx: number, ry: number, rz: number, c: RGB, outline = true) {
      body.blob(x, y, z, rx, ry, rz, c);
      if (outline) ink.blob(x, y, z, rx, ry, rz, INK, 7, 0.035, true);
    },
    fig(x: number, y: number, z: number, h: number, c: RGB, head?: RGB) {
      body.figure(x, y, z, h, c, head);
      ink.cylinder(x, y, z, h * 0.22, h * 0.07, h * 0.72, 7, INK, { inflate: 0.03, inside: true });
      ink.blob(x, y + h * 0.84, z, h * 0.13, h * 0.15, h * 0.13, INK, 7, 0.03, true);
    },
    roof(x: number, y: number, z: number, w: number, d: number, rise: number, c: RGB) {
      body.roof(x, y, z, w, d, rise, 0, c);
      ink.roof(x, y, z, w, d, rise, 0, INK, { inflate: 0.04, inside: true });
    },
  };
}

type FormFn = (k: Kit, s: ReturnType<typeof shades>, r: () => number) => number;

const FORMS: Record<string, [FormFn, FormFn, FormFn]> = {
  money: [
    // Slot machine.
    (k, s) => {
      k.box(0, 0, 0, 1.6, 2.3, 1.1, s.base);
      k.box(0, 2.3, 0, 1.3, 0.35, 0.9, s.light);
      for (let i = -1; i <= 1; i++) k.box(i * 0.4, 1.3, -0.58, 0.32, 0.5, 0.06, s.pale, 0, false);
      k.box(0, 0.7, -0.6, 1.2, 0.12, 0.2, s.dark);
      k.cyl(0.95, 1.2, 0, 0.05, 0.05, 1, 5, s.dark);
      k.blob(0.95, 2.25, 0, 0.16, 0.16, 0.16, s.light);
      return 2.8;
    },
    // Lottery booth.
    (k, s) => {
      k.box(0, 0, 0, 2.4, 1.2, 1.6, s.base);
      k.box(-1.1, 1.2, 0, 0.2, 1.1, 1.6, s.dark);
      k.box(1.1, 1.2, 0, 0.2, 1.1, 1.6, s.dark);
      k.box(0, 1.2, 0.7, 2.0, 1.1, 0.15, s.light, 0, false);
      k.roof(0, 2.3, 0, 2.6, 1.8, 0.6, s.dark);
      k.box(0, 2.95, -0.2, 1.8, 0.6, 0.1, s.pale);
      return 3.2;
    },
    // Pile of coins.
    (k, s, r) => {
      const piles = [[0, 0, 9], [-0.8, 0.3, 6], [0.8, 0.2, 7], [-0.3, -0.7, 4], [0.5, -0.6, 3], [-1.2, -0.3, 2], [1.2, -0.4, 3]];
      for (const [x, z, n] of piles)
        for (let i = 0; i < n; i++) k.cyl(x + (r() - 0.5) * 0.08, i * 0.16, z + (r() - 0.5) * 0.08, 0.4, 0.4, 0.14, 10, i % 2 ? s.base : s.light, i === n - 1 || i === 0);
      return 1.8;
    },
  ],
  phone: [
    // Glowing phone.
    (k, s) => {
      k.box(0, 0, 0, 1.5, 2.8, 0.3, s.dark);
      k.box(0, 0.25, -0.17, 1.25, 2.3, 0.04, s.pale, 0, false);
      k.box(0, 2.62, -0.17, 0.4, 0.06, 0.04, s.deep, 0, false);
      k.box(0, 0, 0.2, 0.9, 0.15, 0.8, s.dark);
      return 3;
    },
    // Wall of screens.
    (k, s) => {
      for (let i = -1; i <= 1; i++)
        for (let j = 0; j < 3; j++) {
          k.box(i * 1.0, 0.2 + j * 0.9, 0, 0.9, 0.8, 0.25, s.dark);
          k.box(i * 1.0, 0.27 + j * 0.9, -0.14, 0.76, 0.66, 0.04, j % 2 ? s.light : s.pale, 0, false);
        }
      k.box(0, 0, 0.1, 3.2, 0.2, 0.6, s.deep);
      return 2.9;
    },
    // Cloud of message bubbles.
    (k, s, r) => {
      const b = [[-0.8, 0.6, 0], [0.7, 1.2, 0.2], [-0.3, 1.9, -0.1], [0.9, 2.5, 0], [-0.9, 2.7, 0.2]];
      for (const [x, y, z] of b) {
        const w = 0.8 + r() * 0.4;
        k.box(x, y, z, w, 0.55, 0.25, r() < 0.5 ? s.light : s.pale);
        k.box(x - w * 0.3, y - 0.18, z, 0.18, 0.2, 0.2, s.light, 0.7, false);
      }
      k.cyl(0, 0, 0, 0.05, 0.05, 2.7, 5, s.dark);
      return 3.2;
    },
  ],
  person: [
    // Figure at a window.
    (k, s) => {
      k.box(0, 0, 0.3, 3, 2.8, 0.4, s.dark);
      k.box(0, 1.1, 0.05, 1.4, 1.3, 0.1, s.pale, 0, false);
      k.fig(0, 0.9, 0.2, 1.3, s.base, s.light);
      k.box(0, 1.0, -0.05, 1.6, 0.12, 0.35, s.base);
      return 2.9;
    },
    // Two figures on a bench.
    (k, s) => {
      k.box(0, 0.45, 0, 2.6, 0.12, 0.7, s.dark);
      k.box(0, 0.57, 0.33, 2.6, 0.6, 0.08, s.dark);
      k.box(-1.1, 0, 0, 0.12, 0.45, 0.6, s.deep);
      k.box(1.1, 0, 0, 0.12, 0.45, 0.6, s.deep);
      k.fig(-0.6, 0.5, 0, 1.3, s.base, s.light);
      k.fig(0.6, 0.5, 0, 1.2, s.light, s.pale);
      return 2;
    },
    // Figure walking away.
    (k, s) => {
      k.fig(0.2, 0, 0.6, 2.1, s.base, s.light);
      k.box(0.2, 0, -0.6, 0.6, 0.02, 2.2, s.dark, 0, false);
      k.box(-1.2, 0, 0.8, 0.2, 0.9, 0.2, s.dark);
      return 2.2;
    },
  ],
  recognition: [
    // Trophy on a pedestal.
    (k, s) => {
      k.box(0, 0, 0, 1.2, 1.2, 1.2, s.dark);
      k.cyl(0, 1.2, 0, 0.3, 0.12, 0.3, 8, s.base);
      k.cyl(0, 1.5, 0, 0.1, 0.55, 0.8, 10, s.light);
      k.blob(-0.6, 2.0, 0, 0.12, 0.2, 0.06, s.base);
      k.blob(0.6, 2.0, 0, 0.12, 0.2, 0.06, s.base);
      return 2.5;
    },
    // Spotlight on a small stage.
    (k, s) => {
      k.box(0, 0, 0, 3, 0.5, 2, s.dark);
      k.cyl(0, 0.5, 0, 0.9, 0.9, 0.02, 12, s.pale, false);
      k.cyl(1.3, 0.5, 0.8, 0.06, 0.06, 2.6, 5, s.deep);
      k.cyl(0, 0.52, 0, 0.9, 0.1, 2.4, 10, s.light, false);
      k.blob(1.2, 3.1, 0.7, 0.3, 0.2, 0.3, s.base);
      return 3.2;
    },
    // Clapping cut-out crowd.
    (k, s, r) => {
      for (let i = 0; i < 6; i++) {
        const x = -1.25 + i * 0.5;
        const z = (i % 2) * 0.4;
        const h = 1.3 + r() * 0.4;
        k.box(x, 0, z, 0.36, h * 0.7, 0.06, i % 2 ? s.base : s.light);
        k.blob(x, h * 0.82, z, 0.15, 0.17, 0.05, s.pale);
        k.box(x, h * 0.62, z - 0.1, 0.5, 0.08, 0.05, s.dark, 0.3, false);
      }
      return 1.9;
    },
  ],
  closedDoor: [
    // Locked door.
    (k, s) => {
      k.box(0, 0, 0.1, 3, 3, 0.4, s.dark);
      k.box(0, 0, -0.12, 1.3, 2.3, 0.1, s.base);
      k.box(0.4, 1.0, -0.2, 0.25, 0.35, 0.1, s.pale);
      k.cyl(0.4, 1.1, -0.26, 0.05, 0.03, 0.12, 5, s.deep, false);
      return 3;
    },
    // High gate.
    (k, s) => {
      k.box(-1.35, 0, 0, 0.35, 3.8, 0.35, s.dark);
      k.box(1.35, 0, 0, 0.35, 3.8, 0.35, s.dark);
      for (let i = -3; i <= 3; i++) k.box(i * 0.33, 0, 0, 0.07, 3.3 + (i % 2) * 0.2, 0.07, s.base, 0, false);
      k.box(0, 1.4, 0, 2.5, 0.1, 0.08, s.base);
      k.box(0, 3.0, 0, 2.5, 0.1, 0.08, s.base);
      return 3.8;
    },
    // Wall with a keyhole.
    (k, s) => {
      k.box(0, 0, 0, 3.2, 2.6, 0.6, s.base);
      k.cyl(0, 1.45, -0.32, 0.22, 0.22, 0.04, 10, s.deep, false);
      k.box(0, 0.85, -0.32, 0.22, 0.6, 0.04, s.deep, 0, false);
      return 2.6;
    },
  ],
  crowd: [
    // Dense crowd.
    (k, s, r) => {
      for (let i = 0; i < 11; i++) {
        const x = (r() - 0.5) * 2.8;
        const z = (r() - 0.5) * 1.8;
        k.fig(x, 0, z, 1.3 + r() * 0.5, i % 3 ? s.base : s.dark, s.light);
      }
      return 1.9;
    },
    // Many masks.
    (k, s, r) => {
      for (let i = 0; i < 7; i++) {
        const x = -1.3 + i * 0.43;
        const h = 1.4 + r() * 0.9;
        const z = (r() - 0.5) * 0.8;
        k.cyl(x, 0, z, 0.04, 0.04, h, 4, s.dark, false);
        k.blob(x, h + 0.2, z, 0.2, 0.28, 0.08, i % 2 ? s.light : s.pale);
        k.box(x - 0.08, h + 0.24, z - 0.07, 0.06, 0.05, 0.04, s.deep, 0, false);
        k.box(x + 0.08, h + 0.24, z - 0.07, 0.06, 0.05, 0.04, s.deep, 0, false);
      }
      return 2.6;
    },
    // Long queue.
    (k, s, r) => {
      for (let i = 0; i < 7; i++) k.fig(-1.2 + i * 0.4, 0, -0.6 + i * 0.25, 1.4 + r() * 0.3, i % 2 ? s.base : s.dark, s.light);
      k.box(1.5, 0, 1.2, 0.2, 2, 0.2, s.dark);
      k.box(1.5, 2, 1.2, 0.8, 0.5, 0.1, s.pale);
      return 2.5;
    },
  ],
  house: [
    // Golden house.
    (k, s) => {
      k.box(0, 0, 0.2, 2.6, 1.9, 1.8, s.base);
      k.roof(0, 1.9, 0.2, 2.6, 1.8, 1.1, s.dark);
      k.box(0, 0, -0.72, 0.6, 1.1, 0.06, s.light, 0, false);
      k.box(-0.8, 0.9, -0.72, 0.5, 0.5, 0.06, s.pale, 0, false);
      k.box(0.8, 0.9, -0.72, 0.5, 0.5, 0.06, s.pale, 0, false);
      k.box(0.7, 3.0, 0.4, 0.3, 0.6, 0.3, s.dark);
      return 3.4;
    },
    // Palace front.
    (k, s) => {
      k.box(0, 0, 0.4, 3.2, 2.6, 0.4, s.light);
      for (let i = 0; i < 4; i++) k.cyl(-1.2 + i * 0.8, 0, -0.1, 0.14, 0.14, 2.6, 8, s.pale);
      k.box(0, 2.6, 0.1, 3.3, 0.3, 0.9, s.base);
      k.roof(0, 2.9, 0.1, 3.3, 0.6, 0.7, s.base);
      k.box(0, 0, -0.5, 3.4, 0.18, 0.5, s.dark);
      return 3.6;
    },
    // Perfect garden.
    (k, s, r) => {
      k.box(0, 0, 0.6, 3, 0.6, 0.4, s.dark);
      for (let i = -1; i <= 1; i++) {
        k.cyl(i * 1.1, 0, -0.3, 0.08, 0.08, 0.8, 5, s.deep, false);
        k.blob(i * 1.1, 1.1, -0.3, 0.42, 0.42 + r() * 0.1, 0.42, s.base);
      }
      k.box(-1.3, 0, 0, 0.14, 2.2, 0.14, s.light);
      k.box(1.3, 0, 0, 0.14, 2.2, 0.14, s.light);
      k.box(0, 2.2, 0, 2.74, 0.14, 0.14, s.light);
      return 2.4;
    },
  ],
  conflict: [
    // Storm cloud.
    (k, s, r) => {
      for (let i = 0; i < 6; i++) k.blob((r() - 0.5) * 2.2, 2.5 + r() * 0.5, (r() - 0.5) * 0.9, 0.6 + r() * 0.3, 0.4, 0.5, i % 2 ? s.base : s.dark);
      const bolt: [number, number, number][] = [[0.1, 2.3, -0.2], [-0.25, 1.4, -0.2], [0.15, 1.35, -0.2], [-0.2, 0.2, -0.2]];
      for (let i = 0; i < bolt.length - 1; i++) {
        const [x0, y0] = bolt[i];
        const [x1, y1] = bolt[i + 1];
        const len = Math.hypot(x1 - x0, y1 - y0);
        const ang = Math.atan2(x1 - x0, y1 - y0);
        void ang;
        k.box((x0 + x1) / 2, Math.min(y0, y1), -0.2, 0.1 + Math.abs(x1 - x0), len * 0.9, 0.06, s.pale, 0, false);
      }
      k.cyl(0, 0, 0, 1.4, 1.4, 0.03, 12, s.deep, false);
      return 3.2;
    },
    // Two shouting figures.
    (k, s) => {
      k.fig(-0.8, 0, 0, 1.8, s.base, s.light);
      k.fig(0.8, 0, 0, 1.8, s.dark, s.light);
      for (let i = 0; i < 3; i++) {
        k.box(-0.25 + i * 0.25, 1.4 + (i % 2) * 0.25, -0.1, 0.18, 0.18, 0.05, s.pale, 0.8, false);
      }
      return 2.2;
    },
    // Thorn hedge.
    (k, s, r) => {
      k.box(0, 0, 0, 3.2, 1.4, 1.2, s.dark);
      for (let i = 0; i < 18; i++) {
        const x = (r() - 0.5) * 3;
        const y = 0.3 + r() * 1.1;
        k.cyl(x, y, -0.6, 0.06, 0, 0.35, 3, s.light, false);
        k.cyl(x * 0.9, 1.4, (r() - 0.5) * 1, 0.07, 0, 0.4, 3, s.base, false);
      }
      return 1.8;
    },
  ],
};

export function buildForm(type: string, formIndex: number): FormGeometry {
  const body = new GeoBuilder();
  const ink = new GeoBuilder();
  const color = (PALETTE.disturb as Record<string, string>)[type] ?? PALETTE.disturb.money;
  const fns = FORMS[type] ?? FORMS.money;
  const height = fns[formIndex % 3](makeKit(body, ink), shades(color), rng(`${type}-${formIndex}`));
  return { body, ink, height };
}

export const FORM_TYPES = Object.keys(FORMS);
