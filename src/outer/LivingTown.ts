import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector4 } from '@babylonjs/core/Maths/math.vector';
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { PALETTE } from '../config/palette';
import { groundHeight, LANE_HALF, type WalkMap } from '../logic/walkmap';
import type { Mood, WorldEvent } from '../logic/worldMood';
import { GeoBuilder, rgb, rng, type RGB } from '../render/geometry';
import { createCardboardMaterial } from '../render/materials/cardboard';
import { createLightMaterial, type LightMaterial } from '../render/materials/light';
import { WORLD } from '../render/materials/greyChunk';
import type { Town } from './Town';

interface Deco {
  root: TransformNode;
  meshes: Mesh[];
  /** Seconds until it grows in (the bloom wave reaches it). */
  delay: number;
  grow: number;
  animate?: (t: number) => void;
}

const R = PALETTE.restored;
const WAVE_SPEED = 9;

/**
 * The living town. It shows the mood: a storm with lightning over the town at first, dark windows,
 * nothing cared for. Each connection sends a warm wave from the connected lane over the town; the world
 * events of the found theme grow where the wave passes (flowers, lanterns, garlands, benches, kites, birds,
 * a shared table, lit windows…). Nothing is removed: things are added and warmed.
 */
export class LivingTown {
  private windows: Mesh;
  private windowMat: ShaderMaterial;
  private cloud: TransformNode;
  private cloudParts: Mesh[] = [];
  private flashes: Mesh[] = [];
  private flashMat: LightMaterial;
  private sun: Mesh;
  private sunMat: LightMaterial;
  private mat: ShaderMaterial;
  private ink: ShaderMaterial;
  private decos: Deco[] = [];
  readonly built = new Set<WorldEvent>();
  private time = 0;
  private waveT = -1;
  private wavePos = { x: 0, z: 0 };
  private flashT = 3;
  /** Displayed mood (eases towards the target). */
  shown: Mood = { warmth: 0, light: 0.1, care: 0, storm: 1 };
  target: Mood = { warmth: 0, light: 0.1, care: 0, storm: 1 };

  constructor(private readonly scene: Scene, private readonly map: WalkMap, town: Town, private readonly glow: (m: Mesh) => void) {
    this.mat = town.cardMat;
    this.ink = town.inkMat;
    this.windowMat = createCardboardMaterial(scene, 'windowMat', { windows: true, ignoreGrey: true, unlit: true });
    this.windows = town.windows.build('windows', scene, this.windowMat);
    this.windows.freezeWorldMatrix();

    // The storm cloud over the town, with dark lightning flashes.
    const L = map.layout;
    this.cloud = new TransformNode('storm', scene);
    this.cloud.position.set(L.square.x, 11, L.square.z + 26);
    const rand = rng('storm');
    const cloudMat = createCardboardMaterial(scene, 'cloudMat', { unlit: true });
    for (let i = 0; i < 3; i++) {
      const b = new GeoBuilder();
      for (let k = 0; k < 7; k++) {
        const x = (rand() - 0.5) * 46;
        const z = (rand() - 0.5) * 34;
        b.blob(x, (rand() - 0.5) * 2.5, z, 6 + rand() * 5, 2.2 + rand() * 1.4, 5 + rand() * 4, rgb(k % 2 ? PALETTE.outer.card700 : PALETTE.outer.card600), 8);
      }
      const m = b.build(`cloud${i}`, scene, cloudMat);
      m.parent = this.cloud;
      this.cloudParts.push(m);
    }
    this.flashMat = createLightMaterial(scene, 'flashMat', PALETTE.inner.white, PALETTE.inner.white, 0);
    for (let i = 0; i < 3; i++) {
      const b = new GeoBuilder();
      let x = (rand() - 0.5) * 30;
      let y = 0;
      const z = (rand() - 0.5) * 20;
      for (let k = 0; k < 5; k++) {
        const nx = x + (rand() - 0.5) * 2.5;
        const ny = y - 1.8 - rand() * 1.2;
        b.card([[x - 0.12, y, z], [x + 0.12, y, z], [nx + 0.12, ny, z], [nx - 0.12, ny, z]], [1, 1, 1]);
        x = nx;
        y = ny;
      }
      const m = b.build(`flash${i}`, scene, this.flashMat as never);
      m.parent = this.cloud;
      m.setEnabled(false);
      this.flashes.push(m);
    }
    this.sunMat = createLightMaterial(scene, 'sunMat', PALETTE.light.bridge, PALETTE.player.heartCore, 0.6);
    const sb = new GeoBuilder();
    sb.blob(0, 0, 0, 6, 6, 6, [1, 1, 1], 14);
    this.sun = sb.build('sun', scene, this.sunMat as never);
    this.sun.position.set(-60, 55, 140);
    this.sun.setEnabled(false);
    glow(this.sun);
  }

  /** A connection at (x, z): start the warm wave and grow the new events. */
  bloom(x: number, z: number, events: WorldEvent[], instant = false): void {
    this.wavePos = { x, z };
    this.waveT = instant ? -1 : 0;
    for (const e of events) this.build(e, x, z, instant);
  }

  /** Around a connected disturbance a small garden grows (it stays, calmer, cared for). */
  garden(x: number, z: number, instant = false): void {
    const rand = rng(`garden-${x}-${z}`);
    const b = new GeoBuilder();
    const cols: RGB[] = [rgb(PALETTE.disturb.person), rgb(PALETTE.disturb.house), rgb(PALETTE.inner.white)];
    for (let k = 0; k < 26; k++) {
      const a = rand() * Math.PI * 2;
      const r = 1.2 + rand() * 1.6;
      const px = x + Math.cos(a) * r;
      const pz = z + Math.sin(a) * r;
      const y = groundHeight(px, pz) - 0.05;
      const h = 0.3 + rand() * 0.5;
      b.cylinder(px, y, pz, 0.025, 0.02, h, 3, rgb(R.plant), { cap: false });
      b.blob(px, y + h, pz, 0.11, 0.08, 0.11, cols[k % cols.length], 5);
    }
    this.add(`garden${Math.round(x)}`, [{ b }], x, z, x, z, instant);
  }

  setMood(m: Mood, instant = false): void {
    this.target = { ...m };
    if (instant) this.shown = { ...m };
  }

  private add(name: string, parts: { b: GeoBuilder; mat?: ShaderMaterial | LightMaterial; glow?: boolean }[], cx: number, cz: number, ox: number, oz: number, instant: boolean, animate?: (t: number) => void): Deco {
    const root = new TransformNode(`deco.${name}`, this.scene);
    const meshes = parts.map((p, i) => {
      const m = p.b.build(`deco.${name}.${i}`, this.scene, (p.mat ?? this.mat) as never);
      m.parent = root;
      if (p.glow) this.glow(m);
      return m;
    });
    const dist = Math.hypot(cx - ox, cz - oz);
    const d: Deco = { root, meshes, delay: instant ? 0 : dist / WAVE_SPEED, grow: instant ? 1 : 0, animate };
    if (!instant) root.position.y = -6;
    this.decos.push(d);
    return d;
  }

  /** 0..2 = the lanes, 3 = the square and the rest. */
  private region(x: number, z: number): number {
    const L = this.map.layout;
    let best = 3;
    let bd = Math.hypot(x - L.square.x, z - L.square.z) - L.square.radius * 0.6;
    L.lanes.forEach((ln, i) => {
      const d = Math.hypot(x - ln.spot[0], z - ln.spot[1]);
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    return best;
  }

  /** Split a decoration into 4 regions so the wave reaches each part at its own time. */
  private regional(name: string, fill: (pick: (x: number, z: number) => GeoBuilder) => void, ox: number, oz: number, instant: boolean, mat?: ShaderMaterial | LightMaterial, glow = false, coarse = false): void {
    const bs = [0, 1, 2, 3].map(() => ({ b: new GeoBuilder(), sx: 0, sz: 0, n: 0 }));
    fill((x, z) => {
      // Coarse: only two groups (the lanes, the square) to save draw calls.
      const reg = this.region(x, z);
      const r = bs[coarse ? (reg === 3 ? 3 : 0) : reg];
      r.sx += x;
      r.sz += z;
      r.n++;
      return r.b;
    });
    bs.forEach((r, i) => {
      if (r.b.vertexCount) this.add(`${name}${i}`, [{ b: r.b, mat, glow }], r.sx / r.n, r.sz / r.n, ox, oz, instant);
    });
  }

  /** Points along both edges of every lane, every `step` metres. */
  private laneEdges(step: number, offset = LANE_HALF + 0.35): { x: number; z: number; nx: number; nz: number }[] {
    const out: { x: number; z: number; nx: number; nz: number }[] = [];
    for (const lane of this.map.layout.lanes) {
      for (let i = 0; i < lane.points.length - 1; i++) {
        const [ax, az] = lane.points[i];
        const [bx, bz] = lane.points[i + 1];
        const len = Math.hypot(bx - ax, bz - az);
        const nx = -(bz - az) / len;
        const nz = (bx - ax) / len;
        for (let s = 1; s < len; s += step) {
          const x = ax + ((bx - ax) * s) / len;
          const z = az + ((bz - az) * s) / len;
          for (const side of [-1, 1]) out.push({ x: x + nx * offset * side, z: z + nz * offset * side, nx: nx * side, nz: nz * side });
        }
      }
    }
    return out;
  }

  private squareRing(count: number, inset: number): { x: number; z: number; a: number }[] {
    const sq = this.map.layout.square;
    const out: { x: number; z: number; a: number }[] = [];
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.2;
      out.push({ x: sq.x + Math.cos(a) * (sq.radius - inset), z: sq.z + Math.sin(a) * (sq.radius - inset), a });
    }
    return out;
  }

  private build(e: WorldEvent, ox: number, oz: number, instant: boolean): void {
    if (this.built.has(e)) return;
    this.built.add(e);
    const rand = rng(`event-${e}`);
    const sq = this.map.layout.square;
    const g = (x: number, z: number) => groundHeight(x, z) - 0.05;
    switch (e) {
      case 'flowers': {
        const cols: RGB[] = [rgb(PALETTE.disturb.person), rgb(PALETTE.disturb.house), rgb(PALETTE.inner.white), rgb(PALETTE.disturb.crowd)];
        const spots = [...this.laneEdges(1.1, LANE_HALF + 0.15), ...this.squareRing(40, 0.4)];
        this.regional('flowers', (pick) => {
          for (const p of spots) {
            const b = pick(p.x, p.z);
            const n = 2 + Math.floor(rand() * 3);
            for (let k = 0; k < n; k++) {
              const x = p.x + (rand() - 0.5) * 0.6;
              const z = p.z + (rand() - 0.5) * 0.6;
              const h = 0.25 + rand() * 0.35;
              b.cylinder(x, g(x, z), z, 0.02, 0.02, h, 3, rgb(R.plant), { cap: false });
              b.blob(x, g(x, z) + h, z, 0.09, 0.07, 0.09, cols[Math.floor(rand() * cols.length)], 5);
            }
          }
        }, ox, oz, instant);
        break;
      }
      case 'lanterns': {
        const spots = [...this.laneEdges(6.5, LANE_HALF + 0.4).filter((_, i) => i % 2 === 0), ...this.squareRing(10, 0.6)];
        const lampMat = createLightMaterial(this.scene, 'lanternMat', PALETTE.light.beam, PALETTE.player.heartCore, 0.5);
        this.regional('lanternPosts', (pick) => {
          for (const p of spots) pick(p.x, p.z).cylinder(p.x, g(p.x, p.z), p.z, 0.06, 0.05, 2.6, 5, rgb(PALETTE.outer.card700));
        }, ox, oz, instant, undefined, false, true);
        this.regional('lanternLamps', (pick) => {
          for (const p of spots) pick(p.x, p.z).blob(p.x, g(p.x, p.z) + 2.75, p.z, 0.2, 0.26, 0.2, [1, 1, 1], 6);
        }, ox, oz, instant, lampMat, true, true);
        break;
      }
      case 'garlands': {
        const cols: RGB[] = [rgb(PALETTE.disturb.money), rgb(PALETTE.disturb.house), rgb(PALETTE.disturb.phone), rgb(PALETTE.disturb.conflict), rgb(PALETTE.disturb.person)];
        const edges = this.laneEdges(5, LANE_HALF + 1.2);
        this.regional('garlands', (pick) => {
          for (let i = 0; i + 1 < edges.length; i += 2) {
            const a = edges[i];
            const c = edges[i + 1];
            const b = pick((a.x + c.x) / 2, (a.z + c.z) / 2);
            const ya = g(a.x, a.z) + 4;
            const yc = g(c.x, c.z) + 4;
            const n = 9;
            for (let k = 0; k < n; k++) {
              const t = (k + 0.5) / n;
              const x = a.x + (c.x - a.x) * t;
              const z = a.z + (c.z - a.z) * t;
              const y = ya + (yc - ya) * t - Math.sin(t * Math.PI) * 0.6;
              b.card([[x - 0.15 * a.nz, y, z + 0.15 * a.nx], [x + 0.15 * a.nz, y, z - 0.15 * a.nx], [x, y - 0.4, z]], cols[k % cols.length]);
            }
          }
          // Around the square, from the fountain top out to the rim.
          for (const p of this.squareRing(8, 0.2)) {
            const b = pick(sq.x, sq.z);
            for (let k = 0; k < 8; k++) {
              const t = (k + 0.5) / 8;
              const x = sq.x + (p.x - sq.x) * t;
              const z = sq.z + (p.z - sq.z) * t;
              const y = 3.2 + t * 1.5 - Math.sin(t * Math.PI) * 0.7;
              const sn = Math.sin(p.a);
              const cs = Math.cos(p.a);
              b.card([[x - 0.15 * sn, y, z + 0.15 * cs], [x + 0.15 * sn, y, z - 0.15 * cs], [x, y - 0.38, z]], cols[(k + 2) % cols.length]);
            }
          }
        }, ox, oz, instant, undefined, false, true);
        break;
      }
      case 'benches': {
        const b = new GeoBuilder();
        const ink = new GeoBuilder();
        for (const p of this.squareRing(6, 1.4)) {
          const rot = -p.a + Math.PI / 2;
          const y = g(p.x, p.z);
          b.box(p.x, y + 0.42, p.z, 1.6, 0.1, 0.5, rot, rgb(R.wood));
          b.box(p.x + Math.cos(p.a) * 0.25, y + 0.5, p.z + Math.sin(p.a) * 0.25, 1.6, 0.5, 0.08, rot, rgb(R.wood));
          b.box(p.x, y, p.z, 1.4, 0.42, 0.3, rot, rgb(PALETTE.outer.card600));
          ink.box(p.x, y, p.z, 1.6, 0.52, 0.5, rot, rgb(PALETTE.outer.ink), { inflate: 0.03, inside: true });
        }
        for (const t of this.map.terraces) {
          const y = g(t.x, t.z);
          b.box(t.x, y + 0.42, t.z + 2.2, 1.8, 0.1, 0.5, 0, rgb(R.wood));
          b.box(t.x, y, t.z + 2.2, 1.6, 0.42, 0.3, 0, rgb(PALETTE.outer.card600));
        }
        this.add('benches', [{ b }, { b: ink, mat: this.ink }], sq.x, sq.z, ox, oz, instant);
        break;
      }
      case 'sharedTable': {
        const b = new GeoBuilder();
        const x = sq.x + 6;
        const z = sq.z - 1;
        const y = g(x, z);
        b.box(x, y + 0.75, z, 1.2, 0.1, 5, 0, rgb(R.wood));
        b.box(x, y + 0.84, z, 1.25, 0.02, 5.1, 0, rgb(PALETTE.inner.ivory));
        for (const s of [-1, 1]) {
          b.box(x + s * 0.95, y + 0.42, z, 0.4, 0.08, 4.6, 0, rgb(R.wood));
          b.box(x + s * 0.95, y, z, 0.2, 0.42, 4.4, 0, rgb(PALETTE.outer.card600));
        }
        b.box(x, y, z, 0.3, 0.75, 4.6, 0, rgb(PALETTE.outer.card600));
        const food: RGB[] = [rgb(PALETTE.disturb.money), rgb(PALETTE.disturb.house), rgb(R.plant), rgb(PALETTE.disturb.crowd)];
        for (let k = 0; k < 10; k++) b.blob(x + (rand() - 0.5) * 0.7, y + 0.95, z - 2.2 + k * 0.48, 0.14, 0.1, 0.14, food[k % food.length], 6);
        this.add('sharedTable', [{ b }], x, z, ox, oz, instant);
        break;
      }
      case 'birds': {
        const b = new GeoBuilder();
        const c = rgb(PALETTE.outer.card700);
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          const r = 9 + (k % 3) * 3;
          const x = Math.cos(a) * r;
          const z = Math.sin(a) * r;
          const y = (k % 4) * 1.4;
          b.card([[x, y, z], [x - 0.5, y + 0.18, z + 0.12], [x - 0.15, y, z + 0.05]], c);
          b.card([[x, y, z], [x + 0.5, y + 0.18, z + 0.12], [x + 0.15, y, z + 0.05]], c);
        }
        // One flock, circling above the square.
        const d = this.add('birds', [{ b }], sq.x, sq.z, ox, oz, instant, (t) => {
          if (d.grow <= 0) return;
          d.root.position.set(sq.x, 11 + Math.sin(t * 0.7) * 0.8 - 6 * (1 - d.grow), sq.z + 4);
          d.root.rotation.y = t * 0.25;
        });
        break;
      }
      case 'kites': {
        const b = new GeoBuilder();
        const cols: RGB[] = [rgb(PALETTE.disturb.money), rgb(PALETTE.disturb.phone), rgb(PALETTE.disturb.house), rgb(PALETTE.disturb.conflict)];
        for (let k = 0; k < 4; k++) {
          const x = Math.cos(k * 1.6) * 8;
          const z = Math.sin(k * 1.6) * 8;
          const y = k * 1.5;
          b.card([[x, y + 0.9, z], [x + 0.6, y, z], [x, y - 1.1, z], [x - 0.6, y, z]], cols[k]);
          for (let t = 1; t < 6; t++) b.card([[x - 0.08, y - 1.1 - t * 0.45, z], [x + 0.08, y - 1.1 - t * 0.45, z], [x, y - 1.3 - t * 0.45, z]], cols[(k + t) % 4]);
        }
        const d = this.add('kites', [{ b }], sq.x, sq.z, ox, oz, instant, (t) => {
          if (d.grow <= 0) return;
          d.root.position.set(sq.x + Math.sin(t * 0.3) * 1.5, 13 + Math.sin(t * 0.9) * 0.6 - 6 * (1 - d.grow), sq.z + 6);
          d.root.rotation.y = Math.sin(t * 0.2) * 0.4;
          d.root.rotation.z = Math.sin(t * 1.1) * 0.08;
        });
        break;
      }
      case 'windowsLit':
      case 'stormClears':
      case 'peopleGreet':
      case 'music':
        // These change the mood, windows, sky, people and sound (see update, Figures, audio).
        break;
    }
  }

  update(dt: number): void {
    this.time += dt;
    const k = Math.min(1, dt * 0.35);
    for (const key of Object.keys(this.shown) as (keyof Mood)[]) this.shown[key] += (this.target[key] - this.shown[key]) * k;
    const m = this.shown;

    // Windows light up one by one with the light of the town.
    this.windowMat.setVector4('uEmissive', new Vector4(0, 0, m.light * 1.05 - 0.05, 0));

    // Storm: heavy and low at first; it lightens, rises and thins as the town warms. Never snaps away.
    const st = m.storm;
    this.cloud.position.y = 11 + (1 - st) * 14;
    WORLD.storm = st;
    this.cloud.scaling.set(0.4 + st * 0.6, 0.4 + st * 0.6, 0.4 + st * 0.6);
    this.cloud.setEnabled(st > 0.02);
    this.cloud.rotation.y = this.time * 0.01;
    this.flashT -= dt;
    if (this.flashT < 0) {
      this.flashT = (1.5 + Math.random() * 4) / Math.max(0.2, st);
      if (st > 0.3) {
        const f = this.flashes[Math.floor(Math.random() * this.flashes.length)];
        f.setEnabled(true);
        setTimeout(() => f.setEnabled(false), 120);
      }
    }
    this.flashMat.lwSet(0.9 * st);
    this.sun.setEnabled(st < 0.5);
    this.sunMat.lwSet((0.5 - st) * 1.8);
    WORLD.hazeBoost = Math.max(WORLD.hazeBoost, st * 0.35);

    // The warm wave.
    if (this.waveT >= 0) {
      this.waveT += dt;
      const r = this.waveT * WAVE_SPEED;
      WORLD.wave.set([this.wavePos.x, this.wavePos.z, r, Math.max(0, 1 - r / 70)]);
      if (r > 70) {
        this.waveT = -1;
        WORLD.wave[3] = 0;
      }
    }
    for (const d of this.decos) {
      if (d.grow < 1) {
        d.delay -= dt;
        if (d.delay <= 0) {
          d.grow = Math.min(1, d.grow + dt / 1.4);
          // Paper pops up through the ground, with a small overshoot.
          const e = 1 - Math.pow(1 - d.grow, 3);
          d.root.position.y = -6 * (1 - e) + Math.sin(d.grow * Math.PI) * 0.25;
        }
      }
      d.animate?.(this.time);
    }
  }

  get decorationCount(): number {
    return this.decos.length;
  }
}
