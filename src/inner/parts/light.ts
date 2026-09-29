import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PALETTE } from '../../config/palette';
import { addGlow, light, node, type PartContext, type PartHandle } from './kit';

/** A distant gold source, rays as soft cones. Turns warmer and comes closer when the theme is found. */
export function buildLight(ctx: PartContext): PartHandle {
  const root = node(ctx, 'light');
  const far = 22 - ctx.spec.lightLevel * 6;
  root.position.set(0, 4 + ctx.spec.lightLevel * 2, far);
  const shift = node(ctx, 'light.shift');
  shift.parent = root;
  const coreMat = light(ctx, 'light.core', 0.5, PALETTE.inner.gold, PALETTE.inner.white);
  const core = CreateSphere('light.sun', { diameter: 1.6, segments: 14 }, ctx.scene);
  core.material = coreMat;
  core.parent = shift;
  addGlow(ctx, core);
  const rayMat = light(ctx, 'light.rays', 1, PALETTE.inner.gold, PALETTE.inner.amber);
  const rays: Mesh[] = [];
  for (let i = 0; i < 5; i++) {
    const r = CreateCylinder(`light.ray${i}`, { height: 14, diameterTop: 0.4, diameterBottom: 3 + ctx.rand() * 2, tessellation: 10 }, ctx.scene);
    r.setPivotPoint(r.position.set(0, 7, 0).clone());
    r.position.set(0, -7, 0);
    r.rotation.x = -Math.PI / 2 + 0.25 + (ctx.rand() - 0.5) * 0.4;
    r.rotation.z = (i - 2) * 0.28;
    r.material = rayMat;
    r.parent = shift;
    rays.push(r);
  }
  let warmth = 0;
  let want = 0;
  let time = 0;
  return {
    root,
    drift: { root, minDistance: 6 },
    warm: () => (want = 1),
    update(dt) {
      time += dt;
      warmth += (want - warmth) * Math.min(1, dt * 0.6);
      shift.position.z = -warmth * 6;
      coreMat.setColor3('uColor', Color3.FromHexString(PALETTE.inner.gold).scale(1 - warmth * 0.2).add(Color3.FromHexString(PALETTE.inner.amber).scale(warmth * 0.3)));
      coreMat.lwSet(1.1 + ctx.spec.lightLevel * 0.6 + warmth * 0.5 + Math.sin(time) * 0.05);
      rayMat.lwSet(0.05 + ctx.spec.lightLevel * 0.06 + warmth * 0.06);
    },
  };
}
