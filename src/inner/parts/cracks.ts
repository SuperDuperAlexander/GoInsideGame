import { CreateBox } from '@babylonjs/core/Meshes/Builders/boxBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PALETTE } from '../../config/palette';
import { addGlow, light, node, paper, StageTween, stageAmount, type PartContext, type PartHandle } from './kit';

/** Dark jagged lines across the floor. Hard: gold at one end → half → every crack filled (like kintsugi). */
export function buildCracks(ctx: PartContext): PartHandle {
  const root = node(ctx, 'cracks');
  root.position.set(0, 0.015, ctx.hard ? 3.5 : 9);
  const segs: Mesh[] = [];
  const order: number[] = [];
  const dark = paper(ctx, 'cracks.dark', { pattern: 'solid', tint: PALETTE.inner.night });
  dark.lw.light = 0;
  const gold = light(ctx, 'cracks.gold', 0.2, PALETTE.inner.gold, PALETTE.inner.white);
  // Three jagged lines, from near to far.
  for (let line = 0; line < 3; line++) {
    let x = (line - 1) * 1.6 + (ctx.rand() - 0.5);
    let z = -1;
    for (let i = 0; i < 9; i++) {
      const nx = x + (ctx.rand() - 0.5) * 1.4;
      const nz = z + 0.6 + ctx.rand() * 0.6;
      const len = Math.hypot(nx - x, nz - z);
      const b = CreateBox(`cracks.s${line}.${i}`, { width: 0.07 + ctx.rand() * 0.05, height: 0.02, depth: len + 0.05 }, ctx.scene);
      b.position.set((x + nx) / 2, 0, (z + nz) / 2);
      b.rotation.y = Math.atan2(nx - x, nz - z);
      b.material = dark;
      segs.push(b);
      x = nx;
      z = nz;
    }
  }
  segs.sort((a, b) => a.position.z - b.position.z);
  void order;
  // Three groups (12 %, 38 %, 50 %), each merged twice: dark and gold. At most 6 draw calls.
  const cut = [0, Math.round(segs.length * 0.12), Math.round(segs.length * 0.5), segs.length];
  const groups: { dark: Mesh; gold: Mesh }[] = [];
  for (let g = 0; g < 3; g++) {
    const slice = segs.slice(cut[g], cut[g + 1]);
    const d = Mesh.MergeMeshes(slice.map((m) => m.clone(`${m.name}.d`)!), true)!;
    const gm = Mesh.MergeMeshes(slice, true)!;
    d.material = dark;
    gm.material = gold;
    d.parent = root;
    gm.parent = root;
    gm.setEnabled(false);
    addGlow(ctx, gm);
    groups.push({ dark: d, gold: gm });
  }
  const tween = new StageTween();
  return {
    root,
    drift: { root, minDistance: 2 },
    setStage: (s) => tween.set(s),
    progress: () => tween.value,
    update(dt) {
      if (!ctx.hard) return;
      const v = tween.update(dt);
      // Stage 1 → gold at one end (12 %), 2 → half, 3 → every crack filled.
      groups.forEach((g, i) => {
        const on = stageAmount(v, i + 1) > 0.5;
        g.gold.setEnabled(on);
        g.dark.setEnabled(!on);
      });
      gold.lwSet(0.9 + stageAmount(v, 3) * 0.4);
    },
  };
}
