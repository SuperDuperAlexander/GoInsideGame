import type { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { CreatePlane } from '@babylonjs/core/Meshes/Builders/planeBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { PALETTE } from '../config/palette';
import { GeoBuilder, rgb } from '../render/geometry';
import { createLightMaterial, type LightMaterial } from '../render/materials/light';
import { groundHeight, type WalkMap } from '../logic/walkmap';

/** The town gate: closed cardboard panels that unfold into warm light after the third connection. */
export class Gate {
  private hinges: TransformNode[] = [];
  private lightMat: LightMaterial;
  private veil: Mesh;
  private t = 0;
  opening = false;

  constructor(scene: Scene, private readonly map: WalkMap, cardMat: ShaderMaterial, inkMat: ShaderMaterial, glow: (m: Mesh) => void) {
    const g = map.layout.gate;
    const y = groundHeight(g.x, g.z) - 0.2;
    for (const side of [-1, 1]) {
      const hinge = new TransformNode(`gate.hinge${side}`, scene);
      hinge.position.set(g.x + side * 3, y, g.z);
      const b = new GeoBuilder();
      const ink = new GeoBuilder();
      b.box(-side * 1.5, 0, 0, 2.95, 3.4, 0.18, 0, rgb(PALETTE.restored.wood));
      for (let k = 0; k < 3; k++) b.box(-side * 1.5, 0.5 + k * 1.1, -0.1, 2.6, 0.12, 0.05, 0, rgb(PALETTE.restored.roof));
      ink.box(-side * 1.5, 0, 0, 2.95, 3.4, 0.18, 0, rgb(PALETTE.outer.ink), { inflate: 0.04, inside: true });
      const m = b.build(`gate.panel${side}`, scene, cardMat);
      const h = ink.build(`gate.ink${side}`, scene, inkMat);
      m.parent = hinge;
      h.parent = hinge;
      this.hinges.push(hinge);
    }
    this.lightMat = createLightMaterial(scene, 'gate.light', PALETTE.light.bridge, PALETTE.player.heartCore, 1);
    this.veil = CreatePlane('gate.veil', { width: 6, height: 4, sideOrientation: Mesh.DOUBLESIDE }, scene);
    this.veil.position.set(g.x, y + 2, g.z + 0.2);
    this.veil.material = this.lightMat;
    this.veil.setEnabled(false);
    glow(this.veil);
  }

  open(instant = false): void {
    this.opening = true;
    this.map.gate.open = true;
    if (instant) this.t = 1;
  }

  update(dt: number): void {
    if (!this.opening) return;
    this.t = Math.min(1, this.t + dt / 4);
    const e = this.t * this.t * (3 - 2 * this.t);
    this.hinges.forEach((h, i) => (h.rotation.y = (i ? -1 : 1) * e * 1.9));
    this.veil.setEnabled(true);
    this.lightMat.lwSet(e * 0.55);
  }
}
