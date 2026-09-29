import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { setHole } from '../../render/materials/papercut';
import { light, node, paper, sheet, StageTween, stageAmount, type PartContext, type PartHandle } from './kit';

/** A tall stack of paper-cut layers, heavy pattern. Hard: light seeps through → a door is cut → it opens. */
export function buildWall(ctx: PartContext): PartHandle {
  const root = node(ctx, 'wall');
  const hard = ctx.hard;
  const high = ctx.place === 'high' ? 1.5 : 1;
  if (hard) root.position.set(0, 0, 6.5);
  else {
    root.position.set(ctx.rand() < 0.5 ? -5.5 : 5.5, 0, 8);
    root.rotation.y = root.position.x < 0 ? 0.9 : -0.9;
  }
  const layers: { mat: ReturnType<typeof paper> }[] = [];
  for (let i = 0; i < 4; i++) {
    const mat = paper(ctx, `wall.p${i}`, { pattern: i % 2 ? 'lace' : 'leaves', scale: 3 + i, threshold: 0.62 - i * 0.03 });
    mat.lw.light = 0.4;
    const s = sheet(ctx, root, `wall.l${i}`, 7 + i * 0.6, 5.5 * high + i * 0.3, mat);
    s.position.z = i * 0.35;
    layers.push({ mat });
  }
  // The door panel (opens at stage 3) and the light pouring through.
  const doorMat = paper(ctx, 'wall.door', { pattern: 'lace', scale: 2, threshold: 0.4 });
  const hinge = node(ctx, 'wall.hinge');
  hinge.parent = root;
  hinge.position.set(-0.8, 0, -0.05);
  const door = CreatePlane('wall.doorPanel', { width: 1.6, height: 2.6, sideOrientation: Mesh.DOUBLESIDE }, ctx.scene);
  door.position.set(0.8, 1.3, 0);
  door.material = doorMat;
  door.parent = hinge;
  door.setEnabled(false);
  const beamMat = light(ctx, 'wall.beamMat', 1);
  const beam = CreateCylinder('wall.beam', { height: 3.5, diameterTop: 1.5, diameterBottom: 2.4, tessellation: 12 }, ctx.scene);
  beam.rotation.x = Math.PI / 2;
  beam.position.set(0, 1.3, -1.6);
  beam.material = beamMat;
  beam.parent = root;
  beam.visibility = 1;
  beam.setEnabled(false);
  const tween = new StageTween();
  return {
    root,
    drift: { root, minDistance: 3.5 },
    setStage: (n) => tween.set(n),
    progress: () => tween.value,
    update(dt) {
      if (!hard) return;
      const v = tween.update(dt);
      const s1 = stageAmount(v, 1);
      const s2 = stageAmount(v, 2);
      const s3 = stageAmount(v, 3);
      // 1: light seeps through the pattern.
      layers.forEach((l, i) => {
        l.mat.lw.light = 0.4 + s1 * 0.9;
        l.mat.lw.threshold = 0.62 - i * 0.03 - s1 * 0.12;
        l.mat.lw.glow = s1 * 0.08 + s3 * 0.1;
        // 2: a door shape is cut through every layer (uv of each layer).
        if (s2 > 0) {
          const w = 7 + i * 0.6;
          const h = 5.5 * high + i * 0.3;
          const hw = (0.8 / w) * s2;
          setHole(l.mat, 0.5 - hw, 0, 0.5 + hw, (2.6 / h) * Math.min(1, s2 * 1.2));
        }
      });
      door.setEnabled(s2 > 0.95);
      // 3: the door opens, light pours through. The wall stays.
      hinge.rotation.y = -s3 * 1.7;
      beam.setEnabled(s3 > 0.01);
      beamMat.lwSet(s3 * 0.14);
    },
  };
}
