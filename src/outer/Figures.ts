import type { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PALETTE } from '../config/palette';
import { PlayerVisual } from '../player/PlayerVisual';
import { groundHeight, type WalkMap } from '../logic/walkmap';
import { WorldMood } from '../logic/worldMood';
import { GeoBuilder, rgb, rng } from '../render/geometry';
import { createCardboardMaterial } from '../render/materials/cardboard';
import { createLightMaterial } from '../render/materials/light';

type PersonState = ReturnType<typeof WorldMood.personState>;

interface Person {
  v: PlayerVisual;
  x: number;
  z: number;
  heading: number;
  tx: number;
  tz: number;
  wait: number;
  speed: number;
  threshold: number;
  state: PersonState;
  sign: TransformNode;
  bolt: Mesh;
  heart: Mesh;
  signT: number;
  greet: Person | null;
  shake: number;
  late: boolean;
}

const CLOAKS = [PALETTE.restored.roof, PALETTE.restored.water, PALETTE.restored.plant, PALETTE.restored.stone, PALETTE.restored.wood, PALETTE.restored.sky];

/**
 * The people of the town. They copy the player's pace (restless player → they hurry).
 * And they follow the town's warmth, one by one (each has its own threshold):
 * grumpy (a small dark lightning above them, jerky, bumping) → neutral → kind (they stop and greet each other)
 * → warm (small hearts rise, they turn to the player). Nobody disappears; more people come out when it is warm.
 */
export class Figures {
  private list: Person[] = [];
  private rand: () => number;
  warmth = 0;
  greetBoost = 0;
  private time = 0;

  constructor(scene: Scene, private readonly map: WalkMap, count: number) {
    this.rand = rng('strollers');
    const boltMat = createCardboardMaterial(scene, 'boltMat', { ignoreGrey: true, unlit: true });
    const heartMat = createLightMaterial(scene, 'heartMat', PALETTE.disturb.person, PALETTE.player.heartCore, 0.3);
    const bolt = new GeoBuilder();
    const ink = rgb(PALETTE.outer.ink);
    // A small zigzag of dark lightning.
    const zz: [number, number][] = [[0.05, 0.42], [-0.1, 0.18], [0.06, 0.2], [-0.08, -0.05]];
    for (let i = 0; i < zz.length - 1; i++) {
      const [x0, y0] = zz[i];
      const [x1, y1] = zz[i + 1];
      bolt.card([[x0 - 0.03, y0, 0], [x0 + 0.03, y0, 0], [x1 + 0.03, y1, 0], [x1 - 0.03, y1, 0]], ink);
    }
    const heart = new GeoBuilder();
    const pink = rgb(PALETTE.disturb.person);
    heart.blob(-0.07, 0.05, 0, 0.08, 0.08, 0.05, pink, 6);
    heart.blob(0.07, 0.05, 0, 0.08, 0.08, 0.05, pink, 6);
    heart.cylinder(0, -0.14, 0, 0, 0.14, 0.18, 6, pink, { cap: false });
    const total = count + 6;
    for (let i = 0; i < total; i++) {
      const cloak = CLOAKS[i % CLOAKS.length];
      const v = new PlayerVisual(scene, `stroller${i}`, { withLight: false, color: cloak, scale: 0.85, simple: true });
      const [x, z] = this.pickPoint();
      const sign = new TransformNode(`sign${i}`, scene);
      sign.parent = v.root;
      sign.position.y = 1.75;
      const b = bolt.build(`bolt${i}`, scene, boltMat);
      b.parent = sign;
      b.scaling.setAll(1.8);
      const h = heart.build(`heart${i}`, scene, heartMat);
      h.parent = sign;
      h.scaling.setAll(1.6);
      b.setEnabled(false);
      h.setEnabled(false);
      // The first `count` people are out from the start; the others come out when the town gets warm.
      const threshold = i < count ? 0.15 + (i / count) * 0.55 : 0.55 + this.rand() * 0.3;
      const p: Person = {
        v, x, z, heading: this.rand() * 6.28, tx: x, tz: z, wait: this.rand() * 3, speed: 0,
        threshold, state: 'grumpy', sign, bolt: b, heart: h, signT: this.rand() * 3, greet: null, shake: 0, late: i >= count,
      };
      if (i >= count) v.root.setEnabled(false);
      this.list.push(p);
    }
  }

  private pickPoint(): [number, number] {
    const sq = this.map.layout.square;
    for (let k = 0; k < 40; k++) {
      const a = this.rand() * Math.PI * 2;
      const r = 3.4 + this.rand() * (sq.radius - 4.2);
      const x = sq.x + Math.cos(a) * r;
      const z = sq.z + Math.sin(a) * r;
      if (this.map.canStand(x, z)) return [x, z];
    }
    return [sq.x + 5, sq.z];
  }

  /** `restless` 0..1 from the player; player position for the warm people to turn to. */
  update(dt: number, restless: number, px = 0, pz = 0): void {
    this.time += dt;
    for (const s of this.list) {
      // People who come out later appear when the town is warm enough for them.
      const out = !s.late || this.warmth > 0.35;
      if (!out) continue;
      if (!s.v.root.isEnabled()) s.v.root.setEnabled(true);
      const state = WorldMood.personState(this.warmth, s.threshold);
      s.state = state;
      const grumpy = state === 'grumpy';
      const kind = state === 'kind' || state === 'warm';
      const pace = (grumpy ? 1.4 : state === 'neutral' ? 0.9 : 0.6) + restless * 2.2;

      // Greeting: kind people who meet stop and face each other for a moment.
      if (kind && !s.greet && s.wait <= 0) {
        for (const o of this.list) {
          if (o === s || o.greet || !o.v.root.isEnabled()) continue;
          const d = Math.hypot(o.x - s.x, o.z - s.z);
          if ((o.state === 'kind' || o.state === 'warm') && d < 2.6 + this.greetBoost * 2) {
            s.greet = o;
            o.greet = s;
            s.wait = o.wait = 2.2 + this.rand() * 1.5;
            break;
          }
        }
      }
      const dx = s.tx - s.x;
      const dz = s.tz - s.z;
      const d = Math.hypot(dx, dz);
      let want = 0;
      if (s.wait > 0) {
        s.wait -= dt * (1 + restless * 3);
        if (s.wait <= 0) {
          if (s.greet) s.greet.greet = null;
          s.greet = null;
        }
      } else if (d < 0.3) {
        s.wait = grumpy ? 0.2 : (1 - restless) * (1 + this.rand() * 4);
        [s.tx, s.tz] = this.pickPoint();
      } else want = pace;
      s.speed += (want - s.speed) * Math.min(1, dt * (grumpy ? 6 : 3));
      let face = Math.atan2(dx, dz);
      if (s.greet) face = Math.atan2(s.greet.x - s.x, s.greet.z - s.z);
      else if (state === 'warm' && Math.hypot(px - s.x, pz - s.z) < 5) face = Math.atan2(px - s.x, pz - s.z);
      if (d > 0.01 && s.speed > 0.01) {
        const step = Math.min(d, s.speed * dt);
        const [nx, nz] = this.map.move(s.x, s.z, (dx / d) * step, (dz / d) * step);
        if (Math.hypot(nx - s.x, nz - s.z) < step * 0.2) [s.tx, s.tz] = this.pickPoint();
        s.x = nx;
        s.z = nz;
        // Grumpy people bump into each other and shake it off.
        if (grumpy) {
          for (const o of this.list) {
            if (o !== s && o.v.root.isEnabled() && Math.hypot(o.x - s.x, o.z - s.z) < 0.8) {
              s.shake = 0.5;
              s.wait = 0.6;
              [s.tx, s.tz] = this.pickPoint();
              break;
            }
          }
        }
      }
      let dh = face - s.heading;
      while (dh > Math.PI) dh -= Math.PI * 2;
      while (dh < -Math.PI) dh += Math.PI * 2;
      s.heading += dh * Math.min(1, dt * (grumpy ? 9 : 4));
      s.shake = Math.max(0, s.shake - dt);
      s.v.root.position.set(s.x + Math.sin(this.time * 40) * 0.04 * s.shake, groundHeight(s.x, s.z), s.z);
      // A greeting nod, and a little bounce when warm.
      const nod = s.greet ? Math.max(0, Math.sin(this.time * 3 + s.threshold * 9)) * 0.18 : 0;
      s.v.update(dt, { speedRatio: Math.min(1, s.speed / 4.2), heading: s.heading, breath: nod, awake: 1 });

      // Signs above the head.
      s.signT += dt;
      s.bolt.setEnabled(grumpy && Math.sin(s.signT * 5) > -0.3);
      const hearts = state === 'warm';
      s.heart.setEnabled(hearts);
      if (hearts) {
        const k = (s.signT * 0.5) % 1;
        s.heart.position.y = k * 0.9;
        s.heart.scaling.setAll(Math.sin(k * Math.PI) * 1.7 + 0.01);
      }
      s.sign.rotation.y = -s.heading + Math.PI;
    }
  }

  /** Mean pace, for tests. */
  get meanSpeed(): number {
    const on = this.list.filter((s) => s.v.root.isEnabled());
    return on.reduce((a, s) => a + s.speed, 0) / Math.max(1, on.length);
  }

  /** How many people are in each state (only those who are out). */
  census(): Record<PersonState, number> {
    const c: Record<PersonState, number> = { grumpy: 0, neutral: 0, kind: 0, warm: 0 };
    for (const s of this.list) if (s.v.root.isEnabled()) c[WorldMood.personState(this.warmth, s.threshold)]++;
    return c;
  }
}
