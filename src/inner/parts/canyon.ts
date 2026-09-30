import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { addGlow, floorSheet, light, node, paper, sheet, StageTween, stageAmount, type PartContext, type PartHandle } from './kit';

/** The floor opens into a deep layered chasm. Hard: a thread of light → planks of light → a bridge. */
export function buildCanyon(ctx: PartContext): PartHandle {
  const root = node(ctx, 'canyon');
  root.position.set(0, 0, ctx.hard ? 6 : 12);
  const width = 3.2;
  // The far side of the floor.
  const far = paper(ctx, 'canyon.far', { pattern: 'solid' });
  const farFloor = floorSheet(ctx, root, 'canyon.farFloor', 20, 14, far);
  farFloor.position.set(0, 0, width / 2 + 7);
  // Layered walls going down into the dark.
  for (let i = 0; i < 5; i++) {
    const mat = paper(ctx, `canyon.l${i}`, { pattern: i % 2 ? 'lace' : 'waves', scale: 3 + i, threshold: 0.3 });
    mat.lw.light = 0.6 - i * 0.1;
    for (const side of [-1, 1]) {
      const s = sheet(ctx, root, `canyon.w${i}${side}`, 20, 2.2, mat);
      s.position.set(0, -2.2 - i * 1.6, side * (width / 2 - i * 0.12));
    }
  }
  const tween = new StageTween();
  const threadMat = light(ctx, 'canyon.thread', 0.4);
  const thread = CreateCylinder('canyon.threadMesh', { height: width + 1.4, diameter: 0.05, tessellation: 6 }, ctx.scene);
  thread.rotation.x = Math.PI / 2;
  thread.position.y = 0.05;
  thread.parent = root;
  thread.material = threadMat;
  addGlow(ctx, thread);
  const plankMat = light(ctx, 'canyon.plank', 0.3, undefined, undefined);
  const n = 7;
  const parts: Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const p = CreateBox(`canyon.plank${i}`, { width: 1.6, height: 0.06, depth: (width + 1.2) / n - 0.08 }, ctx.scene);
    p.position.set(0, 0.02, ((i + 0.5) * (width + 1.2)) / n);
    parts.push(p);
  }
  // One mesh for all planks (one draw call); it grows from the near edge plank by plank.
  const bridge = Mesh.MergeMeshes(parts, true)!;
  bridge.setPivotPoint(bridge.position.set(0, 0, 0).clone());
  const bridgeNode = node(ctx, 'canyon.bridgeNode');
  bridgeNode.parent = root;
  bridgeNode.position.z = -width / 2 - 0.6;
  bridge.parent = bridgeNode;
  bridge.material = plankMat;
  bridge.setEnabled(false);
  addGlow(ctx, bridge);
  const rails: Mesh[] = [];
  for (const side of [-1, 1]) {
    const r = CreateBox(`canyon.rail${side}`, { width: 0.05, height: 0.05, depth: width + 1.2 }, ctx.scene);
    r.position.set(side * 0.8, 0.8, 0);
    r.parent = root;
    r.material = threadMat;
    r.setEnabled(false);
    rails.push(r);
    addGlow(ctx, r);
  }
  thread.setEnabled(false);
  return {
    root,
    drift: { root, minDistance: 2.5 },
    setStage: (s) => tween.set(s),
    progress: () => tween.value,
    update(dt) {
      if (!ctx.hard) return;
      const v = tween.update(dt);
      const s1 = stageAmount(v, 1);
      const s2 = stageAmount(v, 2);
      const s3 = stageAmount(v, 3);
      thread.setEnabled(s1 > 0.01);
      thread.scaling.y = s1;
      threadMat.lwSet(0.6 + s1);
      bridge.setEnabled(s2 > 0.01);
      bridgeNode.scaling.set(0.4 + 0.6 * s2 + s3 * 0.3, 1, Math.max(0.01, Math.ceil(s2 * n) / n));
      plankMat.lwSet(0.35 + s3 * 0.5);
      rails.forEach((r) => {
        r.setEnabled(s3 > 0.01);
        r.scaling.z = s3;
      });
    },
  };
}
