import { TUNING } from '../config/tuning';
import { WORLD } from '../render/materials/greyChunk';

interface Zone {
  x: number;
  z: number;
  radius: number;
  target: number;
  t: number;
  from: number;
}

/** Colour zones: restored colour grows around connected places over 3 s (ease-out quad). */
export class ColorZones {
  readonly zones: Zone[] = [];
  seconds: number = TUNING.motion.zoneGrow;

  add(x: number, z: number, radius: number, instant = false): void {
    if (this.zones.length >= TUNING.world.maxZones) this.zones.shift();
    this.zones.push({ x, z, radius, target: radius, t: instant ? 1 : 0, from: 0 });
  }

  /** Grow an existing zone (e.g. the square after each connection). */
  grow(x: number, z: number, radius: number): void {
    const zone = this.zones.find((q) => Math.hypot(q.x - x, q.z - z) < 0.5);
    if (!zone) return this.add(x, z, radius);
    zone.from = this.current(zone);
    zone.target = radius;
    zone.t = 0;
  }

  private current(z: Zone): number {
    const e = 1 - (1 - z.t) * (1 - z.t);
    return z.from + (z.target - z.from) * e;
  }

  update(dt: number): void {
    WORLD.zones.fill(0);
    this.zones.forEach((z, i) => {
      z.t = Math.min(1, z.t + dt / this.seconds);
      const r = this.current(z);
      WORLD.zones.set([z.x, z.z, r, r > 0.05 ? 1 : 0], i * 4);
    });
  }

  clear(): void {
    this.zones.length = 0;
  }
}
