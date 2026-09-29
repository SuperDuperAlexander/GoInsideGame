import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type { Material } from '@babylonjs/core/Materials/material';
import type { Scene } from '@babylonjs/core/scene';
import { hexToRgb } from '../config/palette';

export type RGB = [number, number, number];
export const rgb = (hex: string): RGB => hexToRgb(hex);

/** Deterministic random numbers from a string seed (mulberry32). */
export function rng(seed: string | number): () => number {
  let h = typeof seed === 'number' ? seed >>> 0 : 2166136261;
  if (typeof seed === 'string') for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = (h + 0x6d2b79f5) >>> 0;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type V3 = [number, number, number];

/**
 * Collects flat-shaded, vertex-coloured geometry and bakes it into one mesh (one draw call).
 * Optional `ink` builder receives an inflated, inside-out copy of each solid for the outline.
 */
export class GeoBuilder {
  positions: number[] = [];
  normals: number[] = [];
  colors: number[] = [];
  indices: number[] = [];

  get vertexCount(): number {
    return this.positions.length / 3;
  }

  /** A flat polygon (convex, counter-clockwise seen from the front). */
  poly(pts: V3[], color: RGB, alpha = 1, flip = false): void {
    const [a, b, c] = pts;
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const base = this.vertexCount;
    for (const p of pts) {
      this.positions.push(p[0], p[1], p[2]);
      this.normals.push(nx, ny, nz);
      this.colors.push(color[0], color[1], color[2], alpha);
    }
    for (let i = 1; i < pts.length - 1; i++) {
      // Babylon is left-handed: clockwise front faces.
      if (flip) this.indices.push(base, base + i, base + i + 1);
      else this.indices.push(base, base + i + 1, base + i);
    }
  }

  /**
   * A box standing on y = 0 of its local frame, turned by `rotY` around its centre.
   * `lean` tilts the top, `jitter` makes the edges slightly uneven (torn cardboard).
   */
  box(
    cx: number, cy: number, cz: number,
    w: number, h: number, d: number,
    rotY: number, color: RGB,
    o: { lean?: number; jitter?: () => number; inflate?: number; inside?: boolean; topColor?: RGB; noBottom?: boolean } = {},
  ): void {
    const k = o.inflate ?? 0;
    const hw = w / 2 + k, hd = d / 2 + k;
    const y0 = cy - k, y1 = cy + h + k;
    const lean = o.lean ?? 0;
    const j = o.jitter ?? (() => 0.5);
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const P = (x: number, y: number, z: number, top: boolean): V3 => {
      const jx = top ? (j() - 0.5) * 0.12 + lean : 0;
      const jy = top ? (j() - 0.5) * 0.1 : 0;
      const lx = x + jx, lz = z;
      return [cx + lx * c + lz * s, y + jy, cz - lx * s + lz * c];
    };
    const b = [P(-hw, y0, -hd, false), P(hw, y0, -hd, false), P(hw, y0, hd, false), P(-hw, y0, hd, false)];
    const t = [P(-hw, y1, -hd, true), P(hw, y1, -hd, true), P(hw, y1, hd, true), P(-hw, y1, hd, true)];
    const flip = !!o.inside;
    const top = o.topColor ?? color;
    this.poly([t[0], t[3], t[2], t[1]], top, 1, flip);
    if (!o.noBottom) this.poly([b[0], b[1], b[2], b[3]], color, 1, flip);
    this.poly([b[0], t[0], t[1], b[1]], color, 1, flip);
    this.poly([b[1], t[1], t[2], b[2]], color, 1, flip);
    this.poly([b[2], t[2], t[3], b[3]], color, 1, flip);
    this.poly([b[3], t[3], t[0], b[0]], color, 1, flip);
  }

  /** A pitched roof (prism) on top of a w × d footprint at height y, ridge along local x. */
  roof(
    cx: number, y: number, cz: number, w: number, d: number, rise: number, rotY: number, color: RGB,
    o: { overhang?: number; inflate?: number; inside?: boolean; jitter?: () => number } = {},
  ): void {
    const k = o.inflate ?? 0;
    const ov = (o.overhang ?? 0.25) + k;
    const hw = w / 2 + ov, hd = d / 2 + ov;
    const c = Math.cos(rotY), s = Math.sin(rotY);
    const j = o.jitter ?? (() => 0.5);
    const P = (x: number, yy: number, z: number): V3 => [cx + x * c + z * s, yy, cz - x * s + z * c];
    const e = y - k * 0.5;
    const r = y + rise + k;
    const jj = () => (j() - 0.5) * 0.14;
    const a0 = P(-hw, e + jj(), -hd), a1 = P(hw, e + jj(), -hd), a2 = P(hw, e + jj(), hd), a3 = P(-hw, e + jj(), hd);
    const r0 = P(-hw, r, 0), r1 = P(hw, r, 0);
    const flip = !!o.inside;
    this.poly([a0, r0, r1, a1], color, 1, flip);
    this.poly([a2, r1, r0, a3], color, 1, flip);
    this.poly([a1, r1, a2], color, 1, flip);
    this.poly([a3, r0, a0], color, 1, flip);
    this.poly([a0, a1, a2, a3], color, 1, !flip);
  }

  /** A flat card: a vertical quad (double-sided via two faces). */
  card(pts: V3[], color: RGB): void {
    this.poly(pts, color);
    this.poly([...pts].reverse(), color);
  }

  /** A cylinder / cone around a vertical axis (flat-shaded, n sides). */
  cylinder(cx: number, cy: number, cz: number, r0: number, r1: number, h: number, n: number, color: RGB, o: { inflate?: number; inside?: boolean; cap?: boolean } = {}): void {
    const k = o.inflate ?? 0;
    const y0 = cy - k, y1 = cy + h + k;
    const R0 = r0 + k, R1 = r1 + k;
    const flip = !!o.inside;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, b = ((i + 1) / n) * Math.PI * 2;
      const p0: V3 = [cx + Math.cos(a) * R0, y0, cz + Math.sin(a) * R0];
      const p1: V3 = [cx + Math.cos(b) * R0, y0, cz + Math.sin(b) * R0];
      const q0: V3 = [cx + Math.cos(a) * R1, y1, cz + Math.sin(a) * R1];
      const q1: V3 = [cx + Math.cos(b) * R1, y1, cz + Math.sin(b) * R1];
      if (R1 > 0.001) this.poly([p0, q0, q1, p1], color, 1, flip);
      else this.poly([p0, q0, p1], color, 1, flip);
    }
    if (o.cap !== false && R1 > 0.001) {
      const top: V3[] = [];
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        top.push([cx + Math.cos(a) * R1, y1, cz + Math.sin(a) * R1]);
      }
      this.poly(top, color, 1, !flip);
    }
  }

  /** A low-poly ellipsoid (lat-long, flat-shaded). */
  blob(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, color: RGB, seg = 7, inflate = 0, inside = false): void {
    const rings = Math.max(3, Math.floor(seg * 0.6));
    const P = (i: number, j: number): V3 => {
      const th = (j / rings) * Math.PI;
      const ph = (i / seg) * Math.PI * 2;
      return [
        cx + (rx + inflate) * Math.sin(th) * Math.cos(ph),
        cy + (ry + inflate) * Math.cos(th),
        cz + (rz + inflate) * Math.sin(th) * Math.sin(ph),
      ];
    };
    for (let j = 0; j < rings; j++)
      for (let i = 0; i < seg; i++) {
        const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
        if (j === 0) this.poly([a, c, d], color, 1, inside);
        else if (j === rings - 1) this.poly([a, b, d], color, 1, inside);
        else this.poly([a, b, c, d], color, 1, inside);
      }
  }

  /** A simple cut-out person: cone body + round head. */
  figure(x: number, y: number, z: number, h: number, color: RGB, head?: RGB): void {
    this.cylinder(x, y, z, h * 0.22, h * 0.07, h * 0.72, 7, color);
    this.blob(x, y + h * 0.84, z, h * 0.13, h * 0.15, h * 0.13, head ?? color, 7);
  }

  merge(other: GeoBuilder): void {
    const base = this.vertexCount;
    this.positions.push(...other.positions);
    this.normals.push(...other.normals);
    this.colors.push(...other.colors);
    for (const i of other.indices) this.indices.push(i + base);
  }

  build(name: string, scene: Scene, material: Material | null): Mesh {
    const mesh = new Mesh(name, scene);
    const vd = new VertexData();
    vd.positions = this.positions;
    vd.normals = this.normals;
    vd.colors = this.colors;
    vd.indices = this.indices;
    vd.applyToMesh(mesh, false);
    mesh.material = material;
    mesh.isPickable = false;
    return mesh;
  }
}
