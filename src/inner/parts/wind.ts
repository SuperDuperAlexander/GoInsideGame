import { CreateRibbon } from '@babylonjs/core/Meshes/Builders/ribbonBuilder';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { node, paper, StageTween, stageAmount, type PartContext, type PartHandle } from './kit';

/** Ribbons of paper streaming in one direction. Hard: slower → softer → a gentle breeze (the wind stays). */
export function buildWind(ctx: PartContext): PartHandle {
  const root = node(ctx, 'wind');
  root.position.set(0, 0, ctx.hard ? 5 : 10);
  const mat = paper(ctx, 'wind.p', { pattern: 'waves', scale: 2, threshold: 0.2 });
  mat.lw.light = 0.9;
  const ribbons: { mesh: Mesh; y: number; z: number; phase: number; pos: Float32Array; seg: number }[] = [];
  const seg = 16;
  const count = ctx.place === 'storm' ? 8 : 6;
  for (let i = 0; i < count; i++) {
    const y = 0.6 + ctx.rand() * 3;
    const z = (ctx.rand() - 0.5) * 4;
    const a: Vector3[] = [];
    const b: Vector3[] = [];
    for (let k = 0; k <= seg; k++) {
      const x = -6 + (k / seg) * 12;
      a.push(new Vector3(x, y, z));
      b.push(new Vector3(x, y + 0.25, z));
    }
    const mesh = CreateRibbon(`wind.r${i}`, { pathArray: [a, b], sideOrientation: Mesh.DOUBLESIDE, updatable: true }, ctx.scene);
    mesh.material = mat;
    mesh.parent = root;
    const pos = new Float32Array(mesh.getVerticesData(VertexBuffer.PositionKind)!);
    ribbons.push({ mesh, y, z, phase: ctx.rand() * 6, pos, seg });
  }
  const tween = new StageTween();
  let time = 0;
  return {
    root,
    drift: { root, minDistance: 3 },
    setStage: (s) => tween.set(s),
    progress: () => tween.value,
    update(dt) {
      const v = ctx.hard ? tween.update(dt) : 0;
      const speed = 3.2 - stageAmount(v, 1) * 1.6 - stageAmount(v, 2) * 0.8 - stageAmount(v, 3) * 0.4;
      const amp = 0.7 - stageAmount(v, 2) * 0.35 - stageAmount(v, 3) * 0.2;
      time += dt * speed;
      for (const r of ribbons) {
        const p = r.pos;
        const n = r.seg + 1;
        for (let row = 0; row < 2; row++)
          for (let k = 0; k < n; k++) {
            const i = (row * n + k) * 3;
            const x = -6 + (k / r.seg) * 12;
            p[i + 1] = r.y + row * 0.25 + Math.sin(time * 1.3 + x * 0.6 + r.phase) * amp * 0.6;
            p[i + 2] = r.z + Math.cos(time * 0.9 + x * 0.4 + r.phase) * amp;
          }
        r.mesh.updateVerticesData(VertexBuffer.PositionKind, p);
      }
      mat.lw.light = 0.9 + stageAmount(v, 3) * 0.4;
    },
  };
}
