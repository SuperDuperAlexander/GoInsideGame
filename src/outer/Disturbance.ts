import type { Scene } from '@babylonjs/core/scene';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { Vector4 } from '@babylonjs/core/Maths/math.vector';
import { TUNING } from '../config/tuning';
import { DisturbanceState } from '../logic/disturbanceState';
import { groundHeight, type Collider, type WalkMap } from '../logic/walkmap';
import { createCardboardMaterial } from '../render/materials/cardboard';
import { buildForm } from './disturbanceForms';
import { audio } from '../core/audio';

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** One disturbance in a lane: its shape, colour pulse, sound, collider, push reaction and stepping aside. */
export class Disturbance {
  readonly root: TransformNode;
  readonly state = new DisturbanceState();
  readonly collider: Collider;
  readonly home: { x: number; z: number };
  private side: { x: number; z: number };
  private body: Mesh | null = null;
  private hull: Mesh | null = null;
  private mat: ShaderMaterial;
  private inkMat: ShaderMaterial;
  private pulsePhase = Math.random() * 6;
  private scaleNow = 1;
  private aside = 0;
  private bump = 0;
  private builtForm = -1;
  private loop = -1;
  height = 2.5;
  /** Distance to the player, updated each frame. */
  distance = 99;

  constructor(
    private readonly scene: Scene,
    map: WalkMap,
    readonly type: string,
    readonly index: number,
    lane: { points: [number, number][]; spot: [number, number] },
  ) {
    const [x, z] = lane.spot;
    this.home = { x, z };
    this.root = new TransformNode(`disturbance${index}`, scene);
    this.root.position.set(x, groundHeight(x, z) - 0.05, z);
    const [sx, sz] = lane.points[0];
    const dx = sx - x;
    const dz = sz - z;
    const l = Math.hypot(dx, dz) || 1;
    this.root.rotation.y = Math.atan2(-dx, -dz);
    // Step-aside direction: perpendicular to the lane.
    this.side = { x: dz / l, z: -dx / l };
    this.mat = createCardboardMaterial(scene, `dMat${index}`, { ignoreGrey: true, emissive: true });
    this.inkMat = createCardboardMaterial(scene, `dInk${index}`, { ink: true });
    this.collider = map.addCollider(x, z, TUNING.disturb.colliderRadius);
    this.buildForm();
  }

  startSound(): void {
    if (this.loop < 0) this.loop = audio.addLoop(this.type, this.home.x, this.root.position.y + 1.5, this.home.z);
  }

  private buildForm(): void {
    const f = this.state.formIndex;
    if (f === this.builtForm) return;
    this.builtForm = f;
    this.body?.dispose();
    this.hull?.dispose();
    const g = buildForm(this.type, f);
    this.height = g.height;
    this.body = g.body.build(`d${this.index}.form${f}`, this.scene, this.mat);
    this.hull = g.ink.build(`d${this.index}.ink${f}`, this.scene, this.inkMat);
    this.body.parent = this.root;
    this.hull.parent = this.root;
  }

  /** Restore a saved state (without animation). */
  restore(s: Parameters<DisturbanceState['restore']>[0]): void {
    this.state.restore(s);
    this.buildForm();
    if (this.state.isConnected) this.aside = 1;
    this.scaleNow = this.state.scale;
    this.applyAside();
  }

  push(): void {
    if (this.state.isConnected) return;
    this.state.push();
    this.bump = 1;
    audio.thud();
  }

  update(dt: number, px: number, pz: number, restless: number): { formChanged: boolean } {
    const t = TUNING.disturb;
    this.distance = Math.hypot(px - this.collider.x, pz - this.collider.z);
    const formChanged = this.state.updateDistance(this.distance);
    if (formChanged) this.buildForm();

    const connected = this.state.isConnected;
    const hz = connected ? t.pulseConnectedHz : t.pulseCalmHz + (t.pulseRestlessHz - t.pulseCalmHz) * restless;
    this.pulsePhase += dt * hz * Math.PI * 2;
    const s = (Math.sin(this.pulsePhase) + 1) / 2;
    const em = connected ? t.emissiveConnected * (0.6 + 0.4 * s) : t.emissiveMin + (t.emissiveMax - t.emissiveMin) * s;
    this.mat.setVector4('uEmissive', new Vector4(0.25 + (connected ? 0 : 0.1 * this.state.pushes), em, 0, 0));

    // Scale: grows with pushes, shrinks after connecting. A push bumps it briefly.
    this.scaleNow += (this.state.scale - this.scaleNow) * Math.min(1, dt * 2.5);
    this.bump = Math.max(0, this.bump - dt * 2.5);
    const k = this.scaleNow * (1 + Math.sin(this.bump * Math.PI) * 0.08);
    this.root.scaling.set(k, k * (1 + (connected ? 0 : s * 0.015)), k);

    if (connected && this.aside < 1) {
      this.aside = Math.min(1, this.aside + dt / t.stepAsideSeconds);
      this.applyAside();
    }
    if (this.loop >= 0) {
      const vol = connected ? 0.055 : 0.22 * (1 + 0.35 * this.state.pushes);
      audio.setLoop(this.loop, {
        volume: Math.min(0.5, vol),
        rate: connected ? 0.6 : 1 + restless * 0.8,
        connected,
        x: this.collider.x,
        z: this.collider.z,
      });
    }
    return { formChanged };
  }

  private applyAside(): void {
    const t = TUNING.disturb;
    const e = easeInOut(this.aside);
    const x = this.home.x + this.side.x * t.stepAside * e;
    const z = this.home.z + this.side.z * t.stepAside * e;
    this.root.position.x = x;
    this.root.position.z = z;
    this.root.position.y = groundHeight(x, z) - 0.05;
    this.collider.x = x;
    this.collider.z = z;
    this.collider.r = t.colliderRadius + (t.connectedRadius - t.colliderRadius) * e;
  }

  /** 0..1 how much the world darkens around it. */
  get darkness(): number {
    if (this.state.isConnected) return 0;
    return Math.min(0.45, 0.08 + 0.09 * this.state.pushes);
  }

  get meshes(): Mesh[] {
    return [this.body, this.hull].filter((m): m is Mesh => !!m);
  }
}
