import type { Scene } from '@babylonjs/core/scene';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Matrix } from '@babylonjs/core/Maths/math.vector';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import type { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { PALETTE } from '../../config/palette';
import { createPaperMaterial, type PaperMaterial, type PaperOptions } from '../../render/materials/papercut';
import { createLightMaterial, type LightMaterial } from '../../render/materials/light';
import type { Place, SceneSpec } from '../../logic/sceneSpec';

export interface PartContext {
  scene: Scene;
  parent: TransformNode;
  spec: SceneSpec;
  place: Place;
  rand: () => number;
  glow: GlowLayer | null;
  /** True when this part is the hard element of the journey. */
  hard: boolean;
  /** Reduced motion: particles halved. */
  reduced?: boolean;
}

export interface PartHandle {
  root: TransformNode;
  /** Point that drifts closer when looked at (defaults to root). */
  drift?: { root: TransformNode; minDistance: number };
  update(dt: number, t: number): void;
  /** Hard elements: go to stage 0..3 (animated over 2 s). */
  setStage?(stage: number): void;
  /** Transformation progress 0..3 (for tests). */
  progress?(): number;
  /** The theme was found: the light turns warmer and comes closer. */
  warm?(): void;
}

export function node(ctx: PartContext, name: string): TransformNode {
  const n = new TransformNode(name, ctx.scene);
  n.parent = ctx.parent;
  return n;
}

export function paper(ctx: PartContext, name: string, o: PaperOptions): PaperMaterial {
  return createPaperMaterial(ctx.scene, name, o);
}

export function light(ctx: PartContext, name: string, soft = 1, color: string = PALETTE.inner.gold, core: string = PALETTE.inner.white): LightMaterial {
  return createLightMaterial(ctx.scene, name, color, core, soft);
}

/** A vertical paper plane standing on its bottom edge (uv 0..1). */
export function sheet(ctx: PartContext, parent: TransformNode, name: string, w: number, h: number, mat: PaperMaterial): Mesh {
  const m = CreatePlane(name, { width: w, height: h, sideOrientation: Mesh.DOUBLESIDE }, ctx.scene);
  m.bakeTransformIntoVertices(Matrix.Translation(0, h / 2, 0));
  m.material = mat;
  m.parent = parent;
  m.isPickable = false;
  return m;
}

/** A flat paper plane lying on the floor. */
export function floorSheet(ctx: PartContext, parent: TransformNode, name: string, w: number, d: number, mat: PaperMaterial): Mesh {
  const m = CreatePlane(name, { width: w, height: d, sideOrientation: Mesh.DOUBLESIDE }, ctx.scene);
  m.rotation.x = Math.PI / 2;
  m.material = mat;
  m.parent = parent;
  m.isPickable = false;
  return m;
}

export function addGlow(ctx: PartContext, m: Mesh): void {
  ctx.glow?.addIncludedOnlyMesh(m);
}

export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Smoothly follows stage changes over `seconds`: returns the animated value 0..3. */
export class StageTween {
  value = 0;
  private from = 0;
  private to = 0;
  private t = 1;

  constructor(private readonly seconds = 2) {}

  set(stage: number): void {
    this.from = this.value;
    this.to = stage;
    this.t = 0;
  }

  update(dt: number): number {
    this.t = Math.min(1, this.t + dt / this.seconds);
    this.value = this.from + (this.to - this.from) * easeInOut(this.t);
    return this.value;
  }

  get target(): number {
    return this.to;
  }
}

/** 0..1 share of stage `n` reached by an animated value. */
export const stageAmount = (v: number, n: number) => Math.max(0, Math.min(1, v - (n - 1)));
