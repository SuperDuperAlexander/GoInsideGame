import type { Scene } from '@babylonjs/core/scene';
import { CreateCylinder } from '@babylonjs/core/Meshes/Builders/cylinderBuilder';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { PALETTE } from '../config/palette';
import { createLightMaterial, type LightMaterial } from '../render/materials/light';
import { groundHeight } from '../logic/walkmap';

/** The dry fountain fills with light a little more after each connection; after the third, light flows. */
export class Fountain {
  private pool: Mesh;
  private poolMat: LightMaterial;
  private jets: Mesh[] = [];
  private jetMat: LightMaterial;
  private level = 0;
  private target = 0;
  private flow = 0;
  private flowTarget = 0;
  private time = 0;
  private y: number;

  constructor(scene: Scene, x: number, z: number, glow: (m: Mesh) => void) {
    this.y = groundHeight(x, z) - 0.1;
    this.poolMat = createLightMaterial(scene, 'fountain.poolMat', PALETTE.light.beam, PALETTE.player.heartCore, 0.2);
    this.pool = CreateCylinder('fountain.pool', { diameter: 3.7, height: 0.05, tessellation: 20 }, scene);
    this.pool.position.set(x, this.y + 0.1, z);
    this.pool.material = this.poolMat;
    this.pool.setEnabled(false);
    glow(this.pool);
    this.jetMat = createLightMaterial(scene, 'fountain.jetMat', PALETTE.light.beam, PALETTE.player.heartCore, 1);
    for (let i = 0; i < 5; i++) {
      const j = CreateCylinder(`fountain.jet${i}`, { height: 2.2, diameterTop: 0.05, diameterBottom: 0.35, tessellation: 8 }, scene);
      const a = (i / 5) * Math.PI * 2;
      j.position.set(x + Math.cos(a) * (i === 0 ? 0 : 0.6), this.y + 2.6, z + Math.sin(a) * (i === 0 ? 0 : 0.6));
      if (i === 0) j.position.set(x, this.y + 3.2, z);
      j.material = this.jetMat;
      j.setEnabled(false);
      glow(j);
      this.jets.push(j);
    }
  }

  /** 0..3 connections. */
  setConnections(n: number, instant = false): void {
    this.target = Math.min(1, n / 3);
    this.flowTarget = n >= 3 ? 1 : 0;
    if (instant) {
      this.level = this.target;
      this.flow = this.flowTarget;
    }
  }

  update(dt: number): void {
    this.time += dt;
    this.level += (this.target - this.level) * Math.min(1, dt * 0.5);
    this.flow += (this.flowTarget - this.flow) * Math.min(1, dt * 0.4);
    const on = this.level > 0.01;
    this.pool.setEnabled(on);
    this.pool.position.y = this.y + 0.12 + this.level * 0.55;
    this.pool.scaling.set(0.8 + this.level * 0.2, 1, 0.8 + this.level * 0.2);
    this.poolMat.lwSet(0.25 + this.level * 0.8 + Math.sin(this.time * 1.5) * 0.05);
    this.jets.forEach((j, i) => {
      j.setEnabled(this.flow > 0.02);
      const s = this.flow * (0.85 + 0.15 * Math.sin(this.time * 3 + i));
      j.scaling.set(1, Math.max(0.01, s), 1);
    });
    this.jetMat.lwSet(0.4 * this.flow);
  }

  get fill(): number {
    return this.level;
  }
}
