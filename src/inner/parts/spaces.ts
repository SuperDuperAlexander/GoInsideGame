import { node, paper, sheet, type PartContext, type PartHandle } from './kit';

/** Wide room, far horizon, few layers. */
export function buildOpenSpace(ctx: PartContext): PartHandle {
  const root = node(ctx, 'openSpace');
  for (let i = 0; i < 3; i++) {
    const mat = paper(ctx, `open.p${i}`, { pattern: i === 1 ? 'waves' : 'leaves', scale: 4 + i * 2, threshold: 0.4 + i * 0.05 });
    mat.lw.light = 0.7;
    const s = sheet(ctx, root, `open.h${i}`, 70 + i * 20, 2.5 + i * 2.2, mat);
    s.position.set((ctx.rand() - 0.5) * 6, -0.2, 26 + i * 9);
  }
  return { root, update: () => undefined };
}

/** Close layers left and right, low ceiling. */
export function buildNarrowSpace(ctx: PartContext): PartHandle {
  const root = node(ctx, 'narrowSpace');
  const tight = ctx.place === 'tight' ? 0.8 : 1;
  for (let i = 0; i < 3; i++) {
    const mat = paper(ctx, `narrow.p${i}`, { pattern: i % 2 ? 'lace' : 'leaves', scale: 3 + i, threshold: 0.5 });
    mat.lw.light = 0.5;
    for (const side of [-1, 1]) {
      const s = sheet(ctx, root, `narrow.w${i}${side}`, 16, 3.4, mat);
      s.rotation.y = Math.PI / 2;
      s.position.set(side * (2 + i * 0.5) * tight, 0, 5);
    }
  }
  const ceilMat = paper(ctx, 'narrow.ceil', { pattern: 'lace', scale: 5, threshold: 0.55 });
  ceilMat.lw.light = 0.4;
  const c = sheet(ctx, root, 'narrow.ceiling', 6, 16, ceilMat);
  c.rotation.x = Math.PI / 2;
  c.position.set(0, 3.1 * tight, -3);
  return { root, update: () => undefined };
}
