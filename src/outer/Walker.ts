import { TUNING } from '../config/tuning';
import { groundHeight, type WalkMap } from '../logic/walkmap';

/** The player's feet: position, heading, velocity, bounds and colliders. */
export class Walker {
  x = 0;
  z = 0;
  y = 0;
  heading = 0;
  vx = 0;
  vz = 0;
  /** Movement this frame as share of full speed, for restlessness. */
  intent = { x: 0, z: 0 };

  constructor(private readonly map: WalkMap) {}

  place(x: number, z: number, heading: number): void {
    this.x = x;
    this.z = z;
    this.heading = heading;
    this.vx = this.vz = 0;
    this.y = groundHeight(x, z);
  }

  get speed(): number {
    return Math.hypot(this.vx, this.vz);
  }

  /** `input` is (x right, y forward) relative to the camera yaw. */
  update(dt: number, input: { x: number; y: number }, camYaw: number, speedScale = 1): void {
    const p = TUNING.player;
    const s = Math.sin(camYaw);
    const c = Math.cos(camYaw);
    const wx = input.x * c + input.y * s;
    const wz = -input.x * s + input.y * c;
    this.intent.x = wx;
    this.intent.z = wz;
    const tx = wx * p.walkSpeed * speedScale;
    const tz = wz * p.walkSpeed * speedScale;
    const k = Math.min(1, dt * p.accel);
    this.vx += (tx - this.vx) * k;
    this.vz += (tz - this.vz) * k;
    if (this.speed < 0.01) {
      this.vx = this.vz = 0;
    } else {
      const [nx, nz] = this.map.move(this.x, this.z, this.vx * dt, this.vz * dt);
      // Blocked: lose the speed into the wall.
      if (dt > 0) {
        this.vx = (nx - this.x) / dt;
        this.vz = (nz - this.z) / dt;
      }
      this.x = nx;
      this.z = nz;
    }
    if (Math.hypot(wx, wz) > 0.1) {
      const want = Math.atan2(wx, wz);
      let d = want - this.heading;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      this.heading += d * Math.min(1, dt * 10);
    }
    const gy = groundHeight(this.x, this.z);
    this.y += (gy - this.y) * Math.min(1, dt * 12);
  }
}
