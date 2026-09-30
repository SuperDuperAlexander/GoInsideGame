import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { SceneSpec, Part } from '../logic/sceneSpec';
import { rng } from '../render/geometry';
import { PALETTE } from '../config/palette';
import { INNER } from '../render/materials/papercut';
import type { InnerWorld } from './InnerWorld';
import { KIT, type PartContext, type PartHandle } from './parts';
import { floorSheet, paper, sheet } from './parts/kit';
import { buildPlants } from './parts/plants';
import { buildParticles } from './parts/particles';

export interface BuiltInner {
  spec: SceneSpec;
  parts: Map<Part, PartHandle>;
  hard: PartHandle;
  ambient: PartHandle[];
  root: TransformNode;
  update(dt: number): void;
  /** Plants that appear when the wind calms (if none were part of the scene). */
  plants: ReturnType<typeof buildPlants> | null;
}

/** Builds the inner world from a SceneSpec. Disposes the previous one first (no memory growth). */
export function buildInner(world: InnerWorld, spec: SceneSpec, seed: string, reducedMotion: boolean, arrival = false): BuiltInner {
  world.clear();
  const rand = rng(seed);
  const root = new TransformNode('journey', world.scene);
  root.parent = world.content;
  const base = (hard: boolean): PartContext => ({ scene: world.scene, parent: root, spec, place: spec.place, rand, glow: world.glow, hard, reduced: reducedMotion });
  INNER.light = 0.35 + spec.lightLevel * 0.8;

  // The paper floor (split when a canyon opens across it), and a far back-lit layer.
  const floorMat = paper(base(false), 'floor', { pattern: 'solid' });
  floorMat.lw.light = 0.6;
  const hasCanyon = spec.parts.includes('canyon');
  const nearDepth = hasCanyon ? (spec.hardElement === 'canyon' ? 6 : 12) - 1.6 + 5 : 30;
  const floor = floorSheet(base(false), root, 'floorNear', 30, nearDepth, floorMat);
  floor.position.set(0, 0, -5 + nearDepth / 2);
  // Far behind everything: warm light, seen through every cut.
  const backMat = paper(base(false), 'backdrop', { pattern: 'solid', tint: PALETTE.inner.amber });
  backMat.lw.light = 1.4;
  backMat.lw.glow = 0.55;
  const back = sheet(base(false), root, 'backdrop', 90, 30, backMat);
  back.position.set(0, -4, 45);
  const nightMat = paper(base(false), 'behindMat', { pattern: 'lace', scale: 2, threshold: 0.7, tint: PALETTE.inner.shadow });
  nightMat.lw.light = 0.3;
  const behind = sheet(base(false), root, 'behind', 60, 20, nightMat);
  behind.position.set(0, -2, -12);
  behind.rotation.y = Math.PI;

  const parts = new Map<Part, PartHandle>();
  for (const p of spec.parts) {
    if (arrival && p === spec.hardElement) continue;
    const handle = KIT[p](base(p === spec.hardElement));
    parts.set(p, handle);
    if (handle.drift) world.driftables.push(handle.drift);
  }
  const ambient: PartHandle[] = [];
  if (!parts.has('particles')) ambient.push(buildParticles(base(false), reducedMotion ? 20 : 40));
  let plants: BuiltInner['plants'] = null;
  if (spec.hardElement === 'wind' && !parts.has('plants')) {
    plants = buildPlants(base(false), { grow: false });
    ambient.push(plants);
  }
  const hard = parts.get(spec.hardElement) ?? { root, update: () => undefined };
  void (floor as Mesh);
  return {
    spec,
    parts,
    hard,
    ambient,
    root,
    plants,
    update(dt) {
      INNER.time += dt;
      for (const h of parts.values()) h.update(dt, INNER.time);
      for (const h of ambient) h.update(dt, INNER.time);
    },
  };
}
