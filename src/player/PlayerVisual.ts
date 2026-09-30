import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateLathe } from '@babylonjs/core/Meshes/Builders/latheBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { PALETTE } from '../config/palette';
import { TUNING } from '../config/tuning';
import { createCardboardMaterial } from '../render/materials/cardboard';
import { createLightMaterial, type LightMaterial } from '../render/materials/light';
import { rgb, type RGB } from '../render/geometry';

export interface FigureState {
  /** 0..1 share of walk speed. */
  speedRatio: number;
  /** Facing angle around Y. 0 = +z. */
  heading: number;
  /** 0..1 how full the breath is. */
  breath: number;
  /** 0 = lying, 1 = standing. */
  awake: number;
}

/** Cloak profile: [radius, height] from the hood down to the hem. */
const CLOAK: [number, number][] = [
  [0.0, 1.16],
  [0.12, 1.14],
  [0.2, 1.06],
  [0.24, 0.92],
  [0.28, 0.7],
  [0.33, 0.45],
  [0.37, 0.26],
  [0.36, 0.2],
];

function paint(mesh: Mesh, color: RGB): void {
  const n = mesh.getTotalVertices();
  const c = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) c.set([color[0], color[1], color[2], 1], i * 4);
  mesh.setVerticesData(VertexBuffer.ColorKind, c);
}

let shared: { paper: ShaderMaterial; ink: ShaderMaterial; scene: Scene } | null = null;
function materials(scene: Scene) {
  if (!shared || shared.scene !== scene) {
    shared = {
      scene,
      paper: createCardboardMaterial(scene, 'figurePaper'),
      ink: createCardboardMaterial(scene, 'figureInk', { ink: true, extrude: 0.03 }),
    };
  }
  return shared;
}

/**
 * A small paper figure with a hood, a short cloak, two scarf tails and (for the player) a warm chest light.
 * Built from primitives; grey strollers use the same figure at 85 % scale without the light.
 */
export class PlayerVisual {
  readonly root: TransformNode;
  readonly body: TransformNode;
  readonly chest: TransformNode;
  private legs: Mesh[] = [];
  private tails: Mesh[] = [];
  private cloak: Mesh;
  private light: Mesh | null = null;
  private halo: Mesh | null = null;
  private lightMat: LightMaterial | null = null;
  private haloMat: LightMaterial | null = null;
  private phase = 0;
  private sway = 0;
  /** 0..1 how big the chest light is (grows with each connection). */
  lightSize: number = TUNING.player.chestLightStart;
  wave = 0;

  constructor(scene: Scene, name: string, o: { withLight: boolean; color?: string; scale?: number; simple?: boolean }) {
    const { paper, ink } = materials(scene);
    const col = rgb(o.color ?? PALETTE.player.paper);
    const shade = rgb(o.color ? PALETTE.outer.card500 : PALETTE.player.paperShade);
    this.root = new TransformNode(name, scene);
    this.body = new TransformNode(`${name}.body`, scene);
    this.body.parent = this.root;
    this.root.scaling.setAll(o.scale ?? 1);

    const outline = (m: Mesh) => {
      const hull = m.clone(`${m.name}.ink`, null) as Mesh;
      hull.parent = m;
      hull.position.setAll(0);
      hull.rotation.setAll(0);
      hull.scaling.setAll(1);
      hull.material = ink;
      hull.isPickable = false;
      return hull;
    };

    this.cloak = CreateLathe(`${name}.cloak`, {
      shape: [...CLOAK].reverse().map(([r, h]) => new Vector3(r, h, 0)),
      tessellation: 14,
    }, scene);
    paint(this.cloak, col);

    const hood = CreateSphere(`${name}.hood`, { diameter: 0.4, segments: 8 }, scene);
    hood.position.set(0, 1.26, -0.01);
    hood.scaling.set(1, 1.08, 1);
    paint(hood, col);

    const face = CreateSphere(`${name}.face`, { diameter: 0.26, segments: 6 }, scene);
    face.position.set(0, 1.24, 0.1);
    face.scaling.set(1, 1.05, 0.5);
    paint(face, rgb(PALETTE.outer.card700));
    const parts: Mesh[] = [this.cloak, hood, face];

    for (const side of [-1, 1]) {
      const leg = CreateCylinder(`${name}.leg`, { height: 0.32, diameterTop: 0.09, diameterBottom: 0.11, tessellation: 6 }, scene);
      leg.setPivotPoint(new Vector3(0, 0.16, 0));
      leg.position.set(side * 0.1, 0.16, 0);
      paint(leg, shade);
      if (o.simple) {
        parts.push(leg);
        continue;
      }
      leg.material = paper;
      leg.parent = this.root;
      this.legs.push(leg);

      const tail = CreateBox(`${name}.tail`, { width: 0.07, height: 0.42, depth: 0.02 }, scene);
      tail.setPivotPoint(new Vector3(0, 0.21, 0));
      tail.position.set(side * 0.08, 0.84, -0.2);
      paint(tail, shade);
      tail.material = paper;
      tail.parent = this.body;
      this.tails.push(tail);
    }
    const merged = Mesh.MergeMeshes(parts, true, true);
    if (!merged) throw new Error('figure merge failed');
    merged.name = `${name}.figure`;
    merged.material = paper;
    merged.parent = this.body;
    this.cloak = merged;
    outline(merged);

    if (o.withLight) {
      this.chest = new TransformNode(`${name}.chest`, scene);
      this.chest.parent = this.body;
      this.chest.position.set(0, 0.9, 0.2);
      this.lightMat = createLightMaterial(scene, `${name}.lightMat`, PALETTE.player.heart, PALETTE.player.heartCore, 0.6);
      this.light = CreateSphere(`${name}.light`, { diameter: 0.16, segments: 8 }, scene);
      this.light.material = this.lightMat;
      this.light.parent = this.chest;
      this.haloMat = createLightMaterial(scene, `${name}.haloMat`, PALETTE.player.heart, PALETTE.player.heart, 1);
      this.halo = CreateSphere(`${name}.halo`, { diameter: 0.5, segments: 10 }, scene);
      this.halo.material = this.haloMat;
      this.halo.parent = this.chest;
    } else {
      this.chest = new TransformNode(`${name}.chest`, scene);
      this.chest.parent = this.body;
      this.chest.position.set(0, 0.9, 0.2);
    }
    for (const m of this.root.getChildMeshes()) m.isPickable = false;
  }

  /** Meshes that belong in the glow layer. */
  get glowMeshes(): Mesh[] {
    return this.light ? [this.light] : [];
  }

  update(dt: number, s: FigureState): void {
    this.phase += dt * (2 + 7.5 * s.speedRatio);
    const walk = Math.min(1, s.speedRatio * 1.4);
    const swing = Math.sin(this.phase) * 0.55 * walk;
    if (this.legs.length) {
      this.legs[0].rotation.x = swing;
      this.legs[1].rotation.x = -swing;
    }
    const bob = Math.abs(Math.sin(this.phase)) * 0.04 * walk;
    this.sway += (walk * 0.12 - this.sway) * Math.min(1, dt * 4);
    this.body.position.y = bob;
    this.body.rotation.x = this.sway;
    this.cloak.rotation.z = Math.sin(this.phase) * 0.04 * walk;
    // Breath: the cloak rises a little.
    const b = s.breath;
    this.body.scaling.set(1 + b * 0.04, 1 + b * 0.025, 1 + b * 0.05);
    for (let i = 0; i < this.tails.length; i++) {
      const tail = this.tails[i];
      tail.rotation.x = -0.25 - walk * 0.9 + Math.sin(this.phase * 0.5 + i) * 0.12 * (0.3 + walk);
      tail.rotation.z = (i ? 1 : -1) * (0.12 + Math.sin(this.phase * 0.7 + i * 2) * 0.06);
    }
    // Lying → standing (the opening).
    this.root.rotation.x = (1 - s.awake) * -Math.PI * 0.45;
    this.root.rotation.y = s.heading;

    if (this.light && this.lightMat && this.haloMat && this.halo) {
      const size = this.lightSize;
      const glow = 0.5 + b * 0.7;
      this.light.scaling.setAll(0.55 + size * 0.9 + b * 0.25);
      this.lightMat.lwSet(1.1 + b * 0.8);
      this.wave = Math.max(0, this.wave - dt * 0.6);
      this.halo.scaling.setAll(0.6 + size * 1.2 + b * 0.5 + (1 - this.wave) * this.wave * 3);
      this.haloMat.lwSet(0.18 * glow * (0.6 + size));
    }
  }

  /** A soft wave of light leaves the chest (end of an out-breath). */
  emitWave(): void {
    this.wave = 1;
  }

  setVisible(v: boolean): void {
    this.root.setEnabled(v);
  }

  dispose(): void {
    this.root.dispose();
  }
}
