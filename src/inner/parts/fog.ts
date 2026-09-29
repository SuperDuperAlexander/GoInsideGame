import { CreateSphere } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { addGlow, light, node, paper, sheet, StageTween, stageAmount, type PartContext, type PartHandle } from './kit';

/** Many layered lace planes, drifting slowly. Hard: thins at the centre → a light inside → a clear path. */
export function buildFog(ctx: PartContext): PartHandle {
  const root = node(ctx, 'fog');
  root.position.set(0, 0, ctx.hard ? 5 : 14);
  const count = ctx.place === 'misty' ? 12 : 9;
  const sheets: { m: Mesh; x: number; z: number; phase: number }[] = [];
  const mats = [0, 1, 2].map((i) => {
    const m = paper(ctx, `fog.p${i}`, { pattern: i === 1 ? 'leaves' : 'lace', scale: 2 + i, threshold: 0.42 });
    m.lw.light = 0.8;
    return m;
  });
  for (let i = 0; i < count; i++) {
    const x = (ctx.rand() - 0.5) * 6;
    const z = i * 1.1;
    const m = sheet(ctx, root, `fog.s${i}`, 3.5 + ctx.rand() * 3, 3 + ctx.rand() * 2, mats[i % 3]);
    m.position.set(x, -0.3, z);
    sheets.push({ m, x, z, phase: ctx.rand() * 6 });
  }
  const glowMat = light(ctx, 'fog.lightMat', 1);
  const orb = CreateSphere('fog.orb', { diameter: 1, segments: 12 }, ctx.scene);
  orb.position.set(0, 1.6, count * 1.1 + 2);
  orb.parent = root;
  orb.material = glowMat;
  orb.setEnabled(false);
  addGlow(ctx, orb);
  const tween = new StageTween();
  let time = 0;
  return {
    root,
    drift: { root, minDistance: 2 },
    setStage: (s) => tween.set(s),
    progress: () => tween.value,
    update(dt) {
      time += dt;
      const v = ctx.hard ? tween.update(dt) : 0;
      const s1 = stageAmount(v, 1);
      const s2 = stageAmount(v, 2);
      const s3 = stageAmount(v, 3);
      for (const s of sheets) {
        // Thin at the centre, then part to both sides: a clear path. The fog stays.
        const side = s.x >= 0 ? 1 : -1;
        const centre = 1 - Math.min(1, Math.abs(s.x) / 3);
        const push = s1 * centre * 1.2 + s3 * (2.6 - Math.abs(s.x) * 0.3);
        s.m.position.x = s.x + side * Math.max(0, push) + Math.sin(time * 0.2 + s.phase) * 0.3;
        s.m.scaling.x = 1 - s1 * 0.25 * centre;
      }
      for (const m of mats) m.lw.threshold = 0.42 + s1 * 0.08;
      orb.setEnabled(s2 > 0.01);
      orb.scaling.setAll(0.2 + s2 * 0.8 + s3 * 0.4);
      glowMat.lwSet(s2 * 1.2);
    },
  };
}
