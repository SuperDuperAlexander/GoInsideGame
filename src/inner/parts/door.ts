import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { node, paper, sheet, type PartContext, type PartHandle } from './kit';

/** A cut-out door shape in a wall, closed (opens a little when the theme is found). */
export function buildDoor(ctx: PartContext): PartHandle {
  const root = node(ctx, 'door');
  const side = ctx.rand() < 0.5 ? -1 : 1;
  root.position.set(side * 4.5, 0, 10);
  root.rotation.y = -side * 0.5;
  const frameMat = paper(ctx, 'door.frame', { pattern: 'lace', scale: 4, threshold: 0.55 });
  const frame = sheet(ctx, root, 'door.wall', 4, 4.2, frameMat);
  frame.position.z = 0.1;
  const hinge = node(ctx, 'door.hinge');
  hinge.parent = root;
  hinge.position.set(-0.7, 0, 0);
  const panelMat = paper(ctx, 'door.panelMat', { pattern: 'solid' });
  panelMat.lw.light = 0.6;
  const panel = CreatePlane('door.panel', { width: 1.4, height: 2.5, sideOrientation: Mesh.DOUBLESIDE }, ctx.scene);
  panel.position.set(0.7, 1.25, 0);
  panel.material = panelMat;
  panel.parent = hinge;
  let open = 0;
  let want = 0;
  return {
    root,
    drift: { root, minDistance: 3 },
    warm: () => (want = 0.5),
    update(dt) {
      open += (want - open) * Math.min(1, dt);
      hinge.rotation.y = -open;
    },
  };
}
