import type { Scene } from '@babylonjs/core/scene';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PALETTE } from '../config/palette';
import { GeoBuilder, rgb, rng, type RGB } from '../render/geometry';
import { createCardboardMaterial } from '../render/materials/cardboard';
import { groundHeight, type WalkMap } from '../logic/walkmap';
import type { Tier } from '../core/perf';

interface Footprint {
  x: number;
  z: number;
  r: number;
}

const R = PALETTE.restored;

function vary(c: RGB, rand: () => number, amount = 0.08): RGB {
  const k = 1 + (rand() - 0.5) * amount * 2;
  return [Math.min(1, c[0] * k), Math.min(1, c[1] * k), Math.min(1, c[2] * k)];
}

/**
 * The grey cardboard town, procedural from the chapter layout:
 * buildings along the square and the lanes, hedges closing every gap, trees, the dry fountain,
 * terrace parapets, the gate pillars. All static geometry is merged: one mesh for cardboard, one for ink.
 */
export class Town {
  readonly meshes: Mesh[] = [];
  readonly gatePanels: Mesh;
  private used: Footprint[] = [];

  constructor(scene: Scene, private readonly map: WalkMap, tier: Tier) {
    const L = map.layout;
    const rand = rng(`${(L as { seed?: string }).seed ?? 'town'}`);
    const body = new GeoBuilder();
    const ink = new GeoBuilder();
    const jit = () => rand();

    // The fountain and its collider footprint.
    this.fountain(body, ink, L.fountain.x, L.fountain.z);
    this.used.push({ x: L.fountain.x, z: L.fountain.z, r: 2.6 });

    // Buildings: many candidates, keep those that do not touch the walkable area.
    const houses: { x: number; z: number; w: number; d: number; h: number; rot: number }[] = [];
    for (let i = 0; i < 2600 && houses.length < 70; i++) {
      const x = (rand() - 0.5) * 64;
      const z = -26 + rand() * 62;
      const near = this.distanceToWalk(x, z, 11);
      if (near > 10) continue;
      const w = 3 + rand() * 3.2;
      const d = 3 + rand() * 2.4;
      const facing = this.facing(x, z);
      if (facing === null) continue;
      const rot = facing + (rand() - 0.5) * 0.12;
      if (!this.fits(x, z, w, d, rot, 0.35)) continue;
      const rr = Math.hypot(w, d) / 2;
      if (this.used.some((u) => Math.hypot(u.x - x, u.z - z) < u.r + rr - 0.6)) continue;
      const h = near < 3 ? 3 + rand() * 4 : 4 + rand() * 3;
      houses.push({ x, z, w, d, h, rot });
      this.used.push({ x, z, r: rr });
    }
    for (const hs of houses) this.house(body, ink, hs.x, hs.z, hs.w, hs.d, hs.h, hs.rot, rand, jit);

    // Hedges and low walls close every remaining gap at the edge of the walkable area.
    const trees: [number, number][] = [];
    const step = 1.1;
    const b = L.bounds;
    for (let x = -b.radiusX - 4; x <= b.radiusX + 4; x += step) {
      for (let z = -b.radiusZ - 2; z <= b.radiusZ; z += step) {
        if (this.map.inShapes(x, z, -0.2)) continue;
        const d = this.distanceToWalk(x, z, 1.4);
        if (d > 1.3) continue;
        if (this.used.some((u) => Math.hypot(u.x - x, u.z - z) < u.r - 0.2)) continue;
        const inTown = z > L.square.z - L.square.radius - 3;
        if (!inTown && rand() < 0.16) trees.push([x + (rand() - 0.5), z + (rand() - 0.5)]);
        const y = groundHeight(x, z) - 0.2;
        const h = inTown ? 0.9 + rand() * 0.4 : 0.8 + rand() * 0.6;
        const col = inTown ? vary(rgb(R.stone), rand) : vary(rgb(R.plant), rand);
        body.box(x, y, z, step + 0.15, h, step + 0.15, rand() * 0.2, col, { jitter: jit });
        ink.box(x, y, z, step + 0.15, h, step + 0.15, 0, rgb(PALETTE.outer.ink), { inflate: 0.04, inside: true });
      }
    }

    // Trees in the field and behind the houses.
    const treeCount = tier === 'low' ? 22 : 40;
    for (let i = 0; i < 400 && trees.length < treeCount + 20; i++) {
      const x = (rand() - 0.5) * 80;
      const z = -52 + rand() * 90;
      const d = this.distanceToWalk(x, z, 14);
      if (d < 3 || d > 13) continue;
      if (this.used.some((u) => Math.hypot(u.x - x, u.z - z) < u.r + 1)) continue;
      trees.push([x, z]);
    }
    for (const [x, z] of trees) this.tree(body, ink, x, z, rand);

    // Terrace parapets (low stone walls with a gap towards the gate path) and benches.
    for (const t of map.terraces) {
      const y = groundHeight(t.x, t.z);
      body.box(t.x + (t.x === 0 ? 2 : -Math.sign(t.x) * 1.2), y, t.z - 1.5, 1.4, 0.45, 0.45, 0, vary(rgb(R.wood), rand), {});
    }

    // Scatter: small stones and tufts on the field.
    const scatter = tier === 'low' ? 60 : tier === 'medium' ? 140 : 240;
    for (let i = 0; i < scatter; i++) {
      const x = (rand() - 0.5) * 50;
      const z = -48 + rand() * 30;
      if (!this.map.inShapes(x, z, 0.5)) continue;
      const y = groundHeight(x, z) - 0.02;
      const s = 0.08 + rand() * 0.14;
      if (rand() < 0.5) body.cylinder(x, y, z, s, 0, s * 2.2, 3, vary(rgb(R.plant), rand, 0.15), { cap: false });
      else body.box(x, y - 0.05, z, s, s * 0.6, s * 0.8, rand() * 3, vary(rgb(R.stone), rand), { noBottom: true });
    }

    // Gate pillars.
    const g = L.gate;
    const gy = groundHeight(g.x, g.z);
    for (const side of [-1, 1]) {
      body.box(g.x + side * 3.5, gy - 0.3, g.z, 1, 4.6, 1, 0, rgb(R.stone), { jitter: jit });
      body.roof(g.x + side * 3.5, gy + 4.3, g.z, 1.1, 1.1, 0.6, 0, rgb(R.roof), { jitter: jit });
      ink.box(g.x + side * 3.5, gy - 0.3, g.z, 1, 4.6, 1, 0, rgb(PALETTE.outer.ink), { inflate: 0.05, inside: true });
    }

    const cardMat = createCardboardMaterial(scene, 'townMat');
    const inkMat = createCardboardMaterial(scene, 'townInk', { ink: true });
    const town = body.build('town', scene, cardMat);
    const hull = ink.build('townInk', scene, inkMat);
    town.freezeWorldMatrix();
    hull.freezeWorldMatrix();
    this.meshes.push(town, hull);

    // The closed paper gate: two panels, unfolded into light later.
    const panels = new GeoBuilder();
    for (const side of [-1, 1]) {
      const x0 = g.x + side * 0.05;
      const x1 = g.x + side * 3;
      const col = rgb(R.wood);
      panels.box((x0 + x1) / 2, gy - 0.2, g.z, Math.abs(x1 - x0), 3.4, 0.2, 0, col, { jitter: jit });
    }
    this.gatePanels = panels.build('gatePanels', scene, cardMat);
  }

  /** Distance (coarse) from a point to the walkable area, up to `max`. */
  distanceToWalk(x: number, z: number, max: number): number {
    if (this.map.inShapes(x, z, 0)) return 0;
    for (let d = 0.5; d <= max; d += 0.5) if (this.map.inShapes(x, z, -d)) return d;
    return max + 1;
  }

  /** Angle so the building front (local -z) faces the nearest walkable ground. */
  private facing(x: number, z: number): number | null {
    for (let d = 1; d <= 12; d += 1) {
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        if (this.map.inShapes(x + Math.sin(a) * d, z + Math.cos(a) * d, 0.3)) return a + Math.PI;
      }
    }
    return null;
  }

  private fits(x: number, z: number, w: number, d: number, rot: number, margin: number): boolean {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    for (let i = -2; i <= 2; i++)
      for (let j = -2; j <= 2; j++) {
        const lx = (i / 2) * (w / 2 + margin);
        const lz = (j / 2) * (d / 2 + margin);
        if (this.map.inShapes(x + lx * c + lz * s, z - lx * s + lz * c, -margin)) return false;
      }
    return true;
  }

  private house(
    body: GeoBuilder, ink: GeoBuilder, x: number, z: number, w: number, d: number, h: number, rot: number,
    rand: () => number, jit: () => number,
  ): void {
    const y = Math.min(
      groundHeight(x - w / 2, z - d / 2), groundHeight(x + w / 2, z + d / 2),
      groundHeight(x + w / 2, z - d / 2), groundHeight(x - w / 2, z + d / 2),
    ) - 0.3;
    const lean = (rand() - 0.5) * 0.25;
    const wall = vary(rand() < 0.6 ? rgb(R.wall) : rgb(R.stone), rand);
    body.box(x, y, z, w, h, d, rot, wall, { lean, jitter: jit });
    ink.box(x, y, z, w, h, d, rot, rgb(PALETTE.outer.ink), { inflate: 0.05, inside: true, lean });
    const rise = 1 + rand() * 1.4;
    const roofCol = vary(rgb(R.roof), rand);
    body.roof(x + lean * Math.cos(rot) * 0.5, y + h, z - lean * Math.sin(rot) * 0.5, w, d, rise, rot, roofCol, { jitter: jit });
    ink.roof(x + lean * Math.cos(rot) * 0.5, y + h, z - lean * Math.sin(rot) * 0.5, w, d, rise, rot, rgb(PALETTE.outer.ink), {
      inflate: 0.05, inside: true,
    });
    // Windows and a door on the front (local -z), dark cut-outs.
    const dark = rgb(PALETTE.outer.card700);
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const at = (lx: number, lz: number): [number, number] => [x + lx * c + lz * s, z - lx * s + lz * c];
    const floors = Math.max(1, Math.floor((h - 0.6) / 2));
    const cols = Math.max(1, Math.floor(w / 1.6));
    for (let f = 0; f < floors; f++) {
      for (let k = 0; k < cols; k++) {
        if (f === 0 && k === Math.floor(cols / 2)) {
          const [dx, dz] = at(0, -d / 2 - 0.02);
          body.box(dx, y + 0.3, dz, 0.9, 1.7, 0.08, rot, vary(rgb(R.wood), rand), {});
          continue;
        }
        if (rand() < 0.25) continue;
        const lx = -w / 2 + (k + 0.5) * (w / cols);
        const [wx, wz] = at(lx, -d / 2 - 0.02);
        body.box(wx, y + 1.3 + f * 2, wz, 0.55, 0.75, 0.06, rot, dark, {});
      }
    }
  }

  private tree(body: GeoBuilder, ink: GeoBuilder, x: number, z: number, rand: () => number): void {
    const y = groundHeight(x, z) - 0.1;
    const h = 1.4 + rand() * 1.2;
    const rot = rand();
    body.box(x, y, z, 0.3, h, 0.3, rot, vary(rgb(R.wood), rand), {});
    ink.box(x, y, z, 0.3, h, 0.3, rot, rgb(PALETTE.outer.ink), { inflate: 0.035, inside: true });
    const crowns = 2 + Math.floor(rand() * 3);
    const col = vary(rgb(R.plant), rand);
    const r = 1.1 + rand() * 0.8;
    const top = y + h + r * 1.8;
    for (let i = 0; i < crowns; i++) {
      const a = (i / crowns) * Math.PI + rand() * 0.3;
      const ca = Math.cos(a) * r;
      const sa = Math.sin(a) * r;
      // A flat cardboard crown: a jagged diamond, crossing the others.
      const pts: [number, number, number][] = [
        [x - ca, y + h + 0.1, z - sa],
        [x - ca * 1.1, y + h + r * 0.9, z - sa * 1.1],
        [x, top, z],
        [x + ca * 1.1, y + h + r * 0.9, z + sa * 1.1],
        [x + ca, y + h + 0.1, z + sa],
        [x, y + h - 0.2, z],
      ];
      body.card(pts, i % 2 ? vary(col, rand, 0.05) : col);
    }
    this.used.push({ x, z, r: 0.8 });
  }

  private fountain(body: GeoBuilder, ink: GeoBuilder, x: number, z: number): void {
    const y = groundHeight(x, z) - 0.1;
    const stone = rgb(R.stone);
    body.cylinder(x, y, z, 2.2, 2.25, 0.7, 14, stone);
    ink.cylinder(x, y, z, 2.2, 2.25, 0.7, 14, rgb(PALETTE.outer.ink), { inflate: 0.05, inside: true });
    body.cylinder(x, y + 0.72, z, 1.9, 1.9, 0.02, 14, rgb(PALETTE.outer.card600));
    body.cylinder(x, y, z, 0.35, 0.28, 2.2, 8, stone);
    body.cylinder(x, y + 2.2, z, 0.9, 0.7, 0.3, 10, stone);
    ink.cylinder(x, y + 2.2, z, 0.9, 0.7, 0.3, 10, rgb(PALETTE.outer.ink), { inflate: 0.04, inside: true });
  }
}
