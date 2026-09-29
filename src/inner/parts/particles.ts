import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { PALETTE } from '../../config/palette';
import { addGlow, light, node, type PartContext, type PartHandle } from './kit';

/** Floating gold motes: many tiny quads in one mesh, drifting upward. */
export function buildParticles(ctx: PartContext, count: number): PartHandle {
  const root = node(ctx, 'particles');
  const base: number[] = [];
  const seeds: number[] = [];
  for (let i = 0; i < count; i++) {
    base.push((ctx.rand() - 0.5) * 16, ctx.rand() * 5, ctx.rand() * 18 - 2);
    seeds.push(ctx.rand() * 10);
  }
  const s = 0.035;
  const positions = new Float32Array(count * 12);
  const normals: number[] = [];
  const indices: number[] = [];
  for (let i = 0; i < count; i++) {
    for (let k = 0; k < 4; k++) normals.push(0, 0, -1);
    const b = i * 4;
    indices.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const mesh = new Mesh('particles.motes', ctx.scene);
  const vd = new VertexData();
  vd.positions = positions;
  vd.normals = normals;
  vd.indices = indices;
  vd.applyToMesh(mesh, true);
  mesh.material = light(ctx, 'particles.mat', 0, PALETTE.inner.gold, PALETTE.inner.white);
  mesh.parent = root;
  mesh.alwaysSelectAsActiveMesh = true;
  addGlow(ctx, mesh);
  let time = 0;
  return {
    root,
    update(dt) {
      time += dt;
      for (let i = 0; i < count; i++) {
        const x = base[i * 3] + Math.sin(time * 0.3 + seeds[i]) * 0.4;
        const y = ((base[i * 3 + 1] + time * 0.12 + seeds[i]) % 5) + 0.2;
        const z = base[i * 3 + 2] + Math.cos(time * 0.25 + seeds[i]) * 0.4;
        const o = i * 12;
        positions.set([x - s, y - s, z, x + s, y - s, z, x + s, y + s, z, x - s, y + s, z], o);
      }
      mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
    },
  };
}
