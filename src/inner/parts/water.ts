import { CreateGround } from '@babylonjs/core/Meshes/Builders/groundBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { PALETTE } from '../../config/palette';
import { addGlow, light, node, paper, StageTween, stageAmount, type PartContext, type PartHandle } from './kit';

/** A flat mirror plane with ripple lines of light. Hard: waves smaller → calm → still water mirroring the light. */
export function buildWater(ctx: PartContext): PartHandle {
  const root = node(ctx, 'water');
  root.position.set(0, 0.05, ctx.hard ? 7 : 13);
  const mat = paper(ctx, 'water.p', { pattern: 'waves', scale: 5, threshold: 0.35, tint: PALETTE.inner.ivory });
  mat.lw.light = 1.1;
  const w = CreateGround('water.surface', { width: 14, height: 9, subdivisions: 28, updatable: true }, ctx.scene);
  w.material = mat;
  w.parent = root;
  const base = new Float32Array(w.getVerticesData(VertexBuffer.PositionKind)!);
  const pos = new Float32Array(base);
  const idx = w.getIndices()!;
  const normals = new Float32Array(pos.length);
  // The mirrored light: a soft gold streak that grows as the water stills.
  const streakMat = light(ctx, 'water.streak', 1, PALETTE.inner.gold, PALETTE.inner.white);
  const streak = CreatePlane('water.streakMesh', { width: 0.6, height: 8 }, ctx.scene);
  streak.rotation.x = Math.PI / 2;
  streak.position.set(0, 0.03, 1);
  streak.parent = root;
  streak.material = streakMat;
  addGlow(ctx, streak);
  const tween = new StageTween();
  let time = 0;
  return {
    root,
    drift: { root, minDistance: 3 },
    setStage: (s) => tween.set(s),
    progress: () => tween.value,
    update(dt) {
      time += dt;
      const v = ctx.hard ? tween.update(dt) : 0;
      const amp = 0.22 * (1 - stageAmount(v, 1) * 0.45 - stageAmount(v, 2) * 0.4 - stageAmount(v, 3) * 0.15);
      for (let i = 0; i < pos.length; i += 3) {
        const x = base[i];
        const z = base[i + 2];
        pos[i + 1] = Math.sin(x * 1.3 + time * 1.7) * amp + Math.cos(z * 1.7 - time * 1.2) * amp * 0.7;
      }
      w.updateVerticesData(VertexBuffer.PositionKind, pos);
      VertexData.ComputeNormals(pos, idx, normals);
      w.updateVerticesData(VertexBuffer.NormalKind, normals);
      mat.lw.threshold = 0.35 - stageAmount(v, 2) * 0.2 - stageAmount(v, 3) * 0.15;
      streakMat.lwSet(0.15 + stageAmount(v, 3) * 0.8 + stageAmount(v, 2) * 0.2);
      streak.scaling.x = 1 + Math.sin(time * 2) * amp * 2;
    },
  };
}
