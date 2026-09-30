import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import type { Scene } from '@babylonjs/core/scene';
import { PALETTE } from '../config/palette';
import { createCardboardMaterial } from '../render/materials/cardboard';
import { rgb } from '../render/geometry';
import { groundHeight, type WalkMap } from '../logic/walkmap';

/** Gently rolling ground with cobbles in the square and lanes (vertex alpha 0 = cobbles). */
export function buildGround(scene: Scene, map: WalkMap): Mesh {
  const b = map.layout.bounds;
  const W = b.radiusX * 2 + 60;
  const D = b.radiusZ * 2 + 60;
  const step = 1;
  const nx = Math.ceil(W / step);
  const nz = Math.ceil(D / step);
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const grass = rgb(PALETTE.restored.plant);
  const earth = rgb(PALETTE.restored.ground);
  const stone = rgb(PALETTE.restored.stone);
  const sq = map.layout.square;
  for (let j = 0; j <= nz; j++) {
    for (let i = 0; i <= nx; i++) {
      const x = -W / 2 + i * step;
      const z = -D / 2 + 6 + j * step;
      const walk = map.inShapes(x, z, 0);
      const town = z > sq.z - sq.radius - 1;
      positions.push(x, groundHeight(x, z) - (walk ? 0 : 0.02), z);
      const mix = (a: number[], c: number[], t: number) => a.map((v, k) => v + (c[k] - v) * t);
      let col = walk ? (town ? stone : earth) : grass;
      const n = Math.sin(x * 0.37 + z * 0.11) * Math.cos(z * 0.29 - x * 0.07) * 0.5 + 0.5;
      col = mix(col, earth, walk ? 0 : n * 0.35) as typeof col;
      colors.push(col[0], col[1], col[2], walk && town ? 0 : 1);
    }
  }
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b2 = a + 1;
      const c = a + nx + 1;
      const d = c + 1;
      indices.push(a, b2, c, b2, d, c);
    }
  const normals: number[] = [];
  VertexData.ComputeNormals(positions, indices, normals);
  const vd = new VertexData();
  vd.positions = positions;
  vd.indices = indices;
  vd.normals = normals;
  vd.colors = colors;
  const mesh = new Mesh('ground', scene);
  vd.applyToMesh(mesh);
  mesh.material = createCardboardMaterial(scene, 'groundMat', { ground: true });
  mesh.isPickable = false;
  return mesh;
}

/** Sky dome: pale paper grey at the horizon, the restored sky colour above (shown only with colour). */
export function buildSky(scene: Scene): Mesh {
  const sky = CreateSphere('sky', { diameter: 600, segments: 16, sideOrientation: Mesh.BACKSIDE }, scene);
  const n = sky.getTotalVertices();
  const pos = sky.getVerticesData(VertexBuffer.PositionKind)!;
  const low = rgb(PALETTE.outer.card100);
  const high = rgb(PALETTE.restored.sky);
  const c = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const h = Math.max(0, Math.min(1, pos[i * 3 + 1] / 300));
    const t = Math.pow(h, 0.6);
    c.set([low[0] + (high[0] - low[0]) * t, low[1] + (high[1] - low[1]) * t, low[2] + (high[2] - low[2]) * t, 1], i * 4);
  }
  sky.setVerticesData(VertexBuffer.ColorKind, c);
  sky.material = createCardboardMaterial(scene, 'skyMat', { sky: true, unlit: true });
  sky.material.backFaceCulling = false;
  sky.isPickable = false;
  sky.infiniteDistance = true;
  return sky;
}
