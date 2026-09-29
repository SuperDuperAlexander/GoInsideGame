/**
 * Where the player may walk. Pure logic, built from the chapter layout.
 * Walkable = union of shapes (field, road, square, lanes, terraces, gate path), minus colliders (circles).
 * Everything else is buildings, hedges or the hill edge.
 */

export interface ChapterLayout {
  start: { x: number; z: number; heading: number };
  square: { x: number; z: number; radius: number };
  fountain: { x: number; z: number };
  lanes: { id: string; points: [number, number][]; spot: [number, number] }[];
  gate: { x: number; z: number };
  figures: number;
  bounds: { radiusX: number; radiusZ: number };
}

type Shape =
  | { kind: 'circle'; x: number; z: number; r: number }
  | { kind: 'ellipse'; x: number; z: number; rx: number; rz: number }
  | { kind: 'capsule'; ax: number; az: number; bx: number; bz: number; r: number };

export interface Collider {
  x: number;
  z: number;
  r: number;
  enabled: boolean;
}

export const LANE_HALF = 1.5;

export function segDistance(px: number, pz: number, ax: number, az: number, bx: number, bz: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  const l2 = dx * dx + dz * dz;
  const t = l2 > 0 ? Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2)) : 0;
  return Math.hypot(px - (ax + dx * t), pz - (az + dz * t));
}

export class WalkMap {
  readonly shapes: Shape[] = [];
  readonly colliders: Collider[] = [];
  /** Gate blocker: a line across the gate, closed until the gate opens. */
  gate: { x: number; z: number; halfWidth: number; open: boolean };
  readonly terraces: { x: number; z: number }[] = [];
  readonly beyondGate: { x: number; z: number };

  constructor(
    readonly layout: ChapterLayout,
    readonly playerRadius = 0.35,
  ) {
    const L = layout;
    const fieldZ = L.start.z + 4;
    this.shapes.push({ kind: 'ellipse', x: 0, z: fieldZ, rx: 22, rz: 12 });
    const sqEdge = L.square.z - L.square.radius;
    this.shapes.push({ kind: 'capsule', ax: 0, az: fieldZ + 8, bx: 0, bz: sqEdge + 2, r: 3.2 });
    this.shapes.push({ kind: 'circle', x: L.square.x, z: L.square.z, r: L.square.radius });
    for (const lane of L.lanes) {
      for (let i = 0; i < lane.points.length - 1; i++) {
        const [ax, az] = lane.points[i];
        const [bx, bz] = lane.points[i + 1];
        this.shapes.push({ kind: 'capsule', ax, az, bx, bz, r: LANE_HALF });
      }
      const [tx, tz] = lane.points[lane.points.length - 1];
      this.terraces.push({ x: tx, z: tz });
      this.shapes.push({ kind: 'circle', x: tx, z: tz, r: 3.6 });
      // Terrace → gate path.
      const midX = tx * 0.5;
      const midZ = (tz + L.gate.z) / 2 + 1.5;
      this.shapes.push({ kind: 'capsule', ax: tx, az: tz, bx: midX, bz: midZ, r: LANE_HALF });
      this.shapes.push({ kind: 'capsule', ax: midX, az: midZ, bx: L.gate.x, bz: L.gate.z - 1, r: LANE_HALF });
    }
    this.shapes.push({ kind: 'circle', x: L.gate.x, z: L.gate.z - 1.5, r: 3 });
    this.beyondGate = { x: L.gate.x, z: L.gate.z + 3 };
    this.shapes.push({ kind: 'capsule', ax: L.gate.x, az: L.gate.z - 1, bx: L.gate.x, bz: L.gate.z + 4, r: 2 });
    this.gate = { x: L.gate.x, z: L.gate.z, halfWidth: 3, open: false };
    // The dry fountain in the square.
    this.colliders.push({ x: L.fountain.x, z: L.fountain.z, r: 2.2, enabled: true });
  }

  addCollider(x: number, z: number, r: number): Collider {
    const c = { x, z, r, enabled: true };
    this.colliders.push(c);
    return c;
  }

  /** True when a point lies inside the walkable shapes, with `margin` kept from their edge. */
  inShapes(x: number, z: number, margin: number): boolean {
    for (const s of this.shapes) {
      if (s.kind === 'circle') {
        if (Math.hypot(x - s.x, z - s.z) <= s.r - margin) return true;
      } else if (s.kind === 'ellipse') {
        const rx = s.rx - margin;
        const rz = s.rz - margin;
        const dx = (x - s.x) / rx;
        const dz = (z - s.z) / rz;
        if (dx * dx + dz * dz <= 1) return true;
      } else if (segDistance(x, z, s.ax, s.az, s.bx, s.bz) <= s.r - margin) return true;
    }
    return false;
  }

  /** Can the player stand here? */
  canStand(x: number, z: number): boolean {
    const r = this.playerRadius;
    if (!this.inShapes(x, z, r)) return false;
    for (const c of this.colliders) {
      if (c.enabled && Math.hypot(x - c.x, z - c.z) < c.r + r) return false;
    }
    if (!this.gate.open && Math.abs(z - this.gate.z) < 0.3 + r && Math.abs(x - this.gate.x) < this.gate.halfWidth)
      return false;
    return true;
  }

  /** Moves from (x, z) by (dx, dz), sliding along edges. Returns the new position. */
  move(x: number, z: number, dx: number, dz: number): [number, number] {
    let nx = x + dx;
    let nz = z + dz;
    // Slide around round colliders.
    for (const c of this.colliders) {
      if (!c.enabled) continue;
      const min = c.r + this.playerRadius;
      const d = Math.hypot(nx - c.x, nz - c.z);
      if (d < min && d > 1e-4) {
        nx = c.x + ((nx - c.x) / d) * min;
        nz = c.z + ((nz - c.z) / d) * min;
      }
    }
    if (this.canStand(nx, nz)) return [nx, nz];
    if (this.canStand(x + dx, z)) return [x + dx, z];
    if (this.canStand(x, z + dz)) return [x, z + dz];
    // Half steps help along curved edges.
    if (this.canStand(x + dx * 0.5, z + dz * 0.5)) return [x + dx * 0.5, z + dz * 0.5];
    return [x, z];
  }

  /** Flood fill on a grid from (sx, sz). Returns a function that says if a point was reached. */
  reach(sx: number, sz: number, cell = 0.5): (x: number, z: number) => boolean {
    const minX = -this.layout.bounds.radiusX - 2;
    const minZ = -this.layout.bounds.radiusZ - 2;
    const w = Math.ceil((this.layout.bounds.radiusX * 2 + 4) / cell);
    const h = Math.ceil((this.layout.bounds.radiusZ * 2 + 4) / cell);
    const seen = new Uint8Array(w * h);
    const idx = (x: number, z: number) => {
      const i = Math.floor((x - minX) / cell);
      const j = Math.floor((z - minZ) / cell);
      return i < 0 || j < 0 || i >= w || j >= h ? -1 : j * w + i;
    };
    const start = idx(sx, sz);
    if (start >= 0 && this.canStand(sx, sz)) {
      const stack = [start];
      seen[start] = 1;
      while (stack.length) {
        const k = stack.pop()!;
        const i = k % w;
        const j = (k - i) / w;
        const neighbours = [
          [i + 1, j],
          [i - 1, j],
          [i, j + 1],
          [i, j - 1],
        ];
        for (const [ni, nj] of neighbours) {
          if (ni < 0 || nj < 0 || ni >= w || nj >= h) continue;
          const nk = nj * w + ni;
          if (seen[nk]) continue;
          if (!this.canStand(minX + (ni + 0.5) * cell, minZ + (nj + 0.5) * cell)) continue;
          seen[nk] = 1;
          stack.push(nk);
        }
      }
    }
    return (x, z) => {
      // A point counts as reached when any cell within one cell of it was reached.
      for (let oi = -1; oi <= 1; oi++)
        for (let oj = -1; oj <= 1; oj++) {
          const k = idx(x + oi * cell, z + oj * cell);
          if (k >= 0 && seen[k]) return true;
        }
      return false;
    };
  }
}

/** Ground height: a flat field, rising gently up the hill towards the gate. */
export function groundHeight(x: number, z: number): number {
  const t = Math.max(0, Math.min(1, (z + 4) / 36));
  const hill = t * t * (3 - 2 * t) * 3.6;
  const roll = 0.18 * Math.sin(x * 0.21 + z * 0.13) * Math.cos(z * 0.17 - x * 0.05);
  return hill + roll;
}
