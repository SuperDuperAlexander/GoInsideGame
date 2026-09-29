import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { node, paper, sheet, type PartContext, type PartHandle } from './kit';

/** Paper-cut leaves and stems growing up from the floor. They sway with a breeze. */
export function buildPlants(ctx: PartContext, o: { grow?: boolean } = {}): PartHandle & { grow(): void; sway: number } {
  const root = node(ctx, 'plants');
  root.position.set(0, 0, 4);
  const mat = paper(ctx, 'plants.p', { pattern: 'leaves', scale: 2.5, threshold: 0.48 });
  mat.lw.light = 1;
  const stems: { m: Mesh; phase: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1;
    const m = sheet(ctx, root, `plants.s${i}`, 0.8 + ctx.rand() * 0.8, 1.2 + ctx.rand() * 1.6, mat);
    m.position.set(side * (1.8 + ctx.rand() * 3), 0, ctx.rand() * 10 - 2);
    m.rotation.y = ctx.rand() * Math.PI;
    stems.push({ m, phase: ctx.rand() * 6 });
  }
  let growth = o.grow === false ? 0 : 1;
  let want = growth;
  let time = 0;
  const handle = {
    root,
    sway: 0.05,
    drift: { root, minDistance: 2 },
    grow: () => (want = 1),
    update(dt: number) {
      time += dt;
      growth += (want - growth) * Math.min(1, dt * 0.7);
      for (const s of stems) {
        s.m.scaling.y = Math.max(0.01, growth);
        s.m.rotation.z = Math.sin(time * 1.2 + s.phase) * handle.sway;
      }
    },
  };
  return handle;
}
