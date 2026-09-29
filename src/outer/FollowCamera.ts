import { FreeCamera } from '@babylonjs/core/Cameras/freeCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { TUNING } from '../config/tuning';
import type { WalkMap } from '../logic/walkmap';
import { groundHeight } from '../logic/walkmap';

/** Third-person follow camera. Drag to turn; re-centres behind the player after 1.2 s. */
export class FollowCamera {
  readonly camera: FreeCamera;
  yaw = 0;
  pitch: number = TUNING.camera.pitch;
  distance: number = TUNING.camera.distance;
  private dist = TUNING.camera.distance;
  /** 0 = normal follow, 1 = inside the chest (the dive). */
  dive = 0;
  readonly target = new Vector3();

  constructor(scene: Scene, private readonly walk: WalkMap) {
    this.camera = new FreeCamera('follow', new Vector3(0, 3, -8), scene);
    this.camera.fov = TUNING.camera.fov;
    this.camera.minZ = 0.1;
    this.camera.maxZ = 400;
    this.camera.inputs.clear();
  }

  snap(x: number, y: number, z: number, heading: number): void {
    this.yaw = heading;
    this.target.set(x, y, z);
    this.update(0, x, y, z, heading, { x: 0, y: 0 }, false, 1);
  }

  update(
    dt: number,
    px: number,
    py: number,
    pz: number,
    heading: number,
    look: { x: number; y: number },
    dragging: boolean,
    sinceLook: number,
    chest?: Vector3,
  ): void {
    const c = TUNING.camera;
    this.yaw += look.x * c.dragSensitivity;
    this.pitch = Math.max(c.minPitch, Math.min(c.maxPitch, this.pitch + look.y * c.dragSensitivity * 0.6));
    if (!dragging && sinceLook > c.recentreDelay && dt > 0) {
      let d = heading - this.yaw;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.yaw += d * Math.min(1, dt * c.recentreSpeed);
      this.pitch += (c.pitch - this.pitch) * Math.min(1, dt * 0.8);
    }
    const k = dt > 0 ? Math.min(1, dt * 8) : 1;
    this.target.x += (px - this.target.x) * k;
    this.target.y += (py + c.lookHeight - this.target.y) * k;
    this.target.z += (pz - this.target.z) * k;

    // Shorten the arm when it would pass through buildings.
    let want = this.distance;
    const sx = -Math.sin(this.yaw);
    const sz = -Math.cos(this.yaw);
    for (let d = 1; d <= this.distance; d += 0.5) {
      if (!this.walk.inShapes(px + sx * d, pz + sz * d, -1.2)) {
        want = Math.max(2.2, d - 0.5);
        break;
      }
    }
    this.dist += (want - this.dist) * (dt > 0 ? Math.min(1, dt * (want < this.dist ? 10 : 2)) : 1);
    const horiz = Math.cos(this.pitch) * this.dist;
    const cx = this.target.x + sx * horiz;
    const cz = this.target.z + sz * horiz;
    let cy = this.target.y + Math.sin(this.pitch) * this.dist + (c.height - c.lookHeight) * 0.4;
    cy = Math.max(cy, groundHeight(cx, cz) + 0.5);
    const pos = new Vector3(cx, cy, cz);
    if (this.dive > 0 && chest) {
      const e = this.dive * this.dive * (3 - 2 * this.dive);
      pos.set(cx + (chest.x - cx) * e, cy + (chest.y - cy) * e, cz + (chest.z - cz) * e);
      this.camera.position.copyFrom(pos);
      const ahead = new Vector3(chest.x + Math.sin(this.yaw) * 2, chest.y, chest.z + Math.cos(this.yaw) * 2);
      this.camera.setTarget(Vector3.Lerp(this.target, ahead, e));
      return;
    }
    this.camera.position.copyFrom(pos);
    this.camera.setTarget(this.target);
  }
}
