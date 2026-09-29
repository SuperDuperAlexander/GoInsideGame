import { Scene } from '@babylonjs/core/scene';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Engine } from '@babylonjs/core/Engines/engine';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { PALETTE } from '../config/palette';
import { TUNING } from '../config/tuning';

/** A part in the inner world that can drift closer when looked at. */
export interface Driftable {
  root: TransformNode;
  /** Closest distance it may drift to. */
  minDistance: number;
}

/**
 * The inner world: a second scene, night blue behind fine paper, first-person look only.
 * What the view rests on for 1.5 s drifts slowly closer (max 0.4 m/s).
 */
export class InnerWorld {
  readonly scene: Scene;
  readonly camera: FreeCamera;
  readonly glow: GlowLayer | null;
  yaw = 0;
  pitch = 0;
  private gazeTarget: Driftable | null = null;
  private gazeTime = 0;
  readonly driftables: Driftable[] = [];
  /** Everything built for one journey lives under this node (disposed on rebuild). */
  content: TransformNode;
  /** 0..1 how dim the view is (heart step). */
  time = 0;

  constructor(engine: Engine, o: { safe: boolean }) {
    this.scene = new Scene(engine);
    this.scene.clearColor = Color4.FromHexString(`${PALETTE.inner.night}FF`);
    this.scene.skipPointerMovePicking = true;
    this.camera = new FreeCamera('innerCam', new Vector3(0, 1.6, 0), this.scene);
    this.camera.fov = 1.0;
    this.camera.minZ = 0.05;
    this.camera.maxZ = 200;
    this.camera.inputs.clear();
    this.scene.activeCamera = this.camera;
    this.glow = o.safe ? null : new GlowLayer('innerGlow', this.scene, { mainTextureRatio: 0.35, blurKernelSize: 48 });
    if (this.glow) this.glow.intensity = 0.8;
    this.content = new TransformNode('innerContent', this.scene);
  }

  /** Dispose the parts of the previous journey. */
  clear(): void {
    this.content.dispose(false, true);
    this.content = new TransformNode('innerContent', this.scene);
    this.driftables.length = 0;
    this.gazeTarget = null;
    this.yaw = 0;
    this.pitch = 0;
  }

  look(dx: number, dy: number): void {
    const s = TUNING.inner.dragSensitivity;
    this.yaw += dx * s;
    this.pitch = Math.max(-0.7, Math.min(0.7, this.pitch + dy * s));
  }

  update(dt: number, reducedMotion: boolean): void {
    this.time += dt;
    const c = this.camera;
    const f = new Vector3(Math.sin(this.yaw) * Math.cos(this.pitch), -Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    c.setTarget(c.position.add(f));

    // Gaze drift.
    let best: Driftable | null = null;
    let bestDot = Math.cos(0.2);
    for (const d of this.driftables) {
      const p = d.root.getAbsolutePosition().subtract(c.position);
      const len = p.length();
      if (len < 0.01) continue;
      const dot = Vector3.Dot(p.scale(1 / len), f);
      if (dot > bestDot) {
        bestDot = dot;
        best = d;
      }
    }
    if (best !== this.gazeTarget) {
      this.gazeTarget = best;
      this.gazeTime = 0;
    } else this.gazeTime += dt;
    if (best && this.gazeTime > TUNING.inner.gazeRest && !reducedMotion) {
      const p = best.root.position;
      const toCam = c.position.subtract(best.root.getAbsolutePosition());
      const dist = toCam.length();
      if (dist > best.minDistance) {
        const step = Math.min(dist - best.minDistance, TUNING.inner.driftSpeed * dt * Math.min(1, (this.gazeTime - TUNING.inner.gazeRest) / 1.5));
        p.addInPlace(toCam.normalize().scale(step));
      }
    }
  }

  render(): void {
    this.scene.render();
  }

  get meshCount(): number {
    return this.scene.meshes.length;
  }
}
