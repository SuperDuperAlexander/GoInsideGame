import type { Scene } from '@babylonjs/core/scene';
import { PALETTE } from '../config/palette';
import { PlayerVisual } from '../player/PlayerVisual';
import { groundHeight, type WalkMap } from '../logic/walkmap';
import { rng } from '../render/geometry';

interface Stroller {
  v: PlayerVisual;
  x: number;
  z: number;
  heading: number;
  tx: number;
  tz: number;
  wait: number;
  speed: number;
}

/**
 * Grey figures strolling through the square. They copy the player's pace:
 * calm player → they stroll and pause; restless player → they hurry and pause less.
 */
export class Figures {
  private list: Stroller[] = [];
  private rand: () => number;

  constructor(scene: Scene, private readonly map: WalkMap, count: number) {
    this.rand = rng('strollers');
    const sq = map.layout.square;
    for (let i = 0; i < count; i++) {
      const v = new PlayerVisual(scene, `stroller${i}`, { withLight: false, color: PALETTE.outer.card400, scale: 0.85, simple: true });
      const [x, z] = this.pickPoint();
      this.list.push({ v, x, z, heading: this.rand() * 6.28, tx: x, tz: z, wait: this.rand() * 3, speed: 0 });
      void sq;
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

  /** `restless` 0..1 from the player. */
  update(dt: number, restless: number): void {
    const pace = 0.7 + restless * 2.2;
    for (const s of this.list) {
      const dx = s.tx - s.x;
      const dz = s.tz - s.z;
      const d = Math.hypot(dx, dz);
      let want = 0;
      if (s.wait > 0) {
        s.wait -= dt * (1 + restless * 3);
      } else if (d < 0.3) {
        s.wait = (1 - restless) * (1 + this.rand() * 4);
        [s.tx, s.tz] = this.pickPoint();
      } else {
        want = pace;
      }
      s.speed += (want - s.speed) * Math.min(1, dt * 3);
      if (d > 0.01 && s.speed > 0.01) {
        const step = Math.min(d, s.speed * dt);
        const [nx, nz] = this.map.move(s.x, s.z, (dx / d) * step, (dz / d) * step);
        if (Math.hypot(nx - s.x, nz - s.z) < step * 0.2) [s.tx, s.tz] = this.pickPoint();
        s.x = nx;
        s.z = nz;
        let dh = Math.atan2(dx, dz) - s.heading;
        while (dh > Math.PI) dh -= Math.PI * 2;
        while (dh < -Math.PI) dh += Math.PI * 2;
        s.heading += dh * Math.min(1, dt * 5);
      }
      s.v.root.position.set(s.x, groundHeight(s.x, s.z), s.z);
      s.v.update(dt, { speedRatio: Math.min(1, s.speed / 4.2), heading: s.heading, breath: 0, awake: 1 });
    }
  }

  /** Mean pace, for tests. */
  get meanSpeed(): number {
    return this.list.reduce((a, s) => a + s.speed, 0) / Math.max(1, this.list.length);
  }
}
