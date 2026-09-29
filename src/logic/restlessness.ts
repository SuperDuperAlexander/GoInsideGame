import { TUNING } from '../config/tuning';

/**
 * How restless the player moves, 0..1. Pure logic.
 * restlessness = smooth(0.6 · speedRatio + 0.4 · directionChangeRate, τ = 3 s); standing still decays faster.
 */
export class RestlessnessSystem {
  value = 0;
  private lastAngle: number | null = null;
  private turnRate = 0;

  /** `mx, mz` = movement vector as a share of full speed (length 0..1). */
  update(dt: number, mx: number, mz: number): number {
    if (dt <= 0) return this.value;
    const t = TUNING.restless;
    const speed = Math.min(1, Math.hypot(mx, mz));
    let turn = 0;
    if (speed > 0.15) {
      const angle = Math.atan2(mx, mz);
      if (this.lastAngle !== null) {
        let d = angle - this.lastAngle;
        while (d > Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        const rate = Math.abs(d) / dt;
        turn = rate > t.turnThreshold ? Math.min(1, (rate - t.turnThreshold) / t.turnMax) : 0;
      }
      this.lastAngle = angle;
    } else {
      this.lastAngle = null;
    }
    // Sharp turns are short events; hold them for a moment so zig-zag reads as a rate.
    this.turnRate = Math.max(turn, this.turnRate - dt * 1.5);
    const target = Math.min(1, t.speedWeight * speed + t.turnWeight * this.turnRate);
    const tau = speed < 0.05 ? t.tauStill : t.tauRise;
    const k = 1 - Math.exp(-dt / tau);
    this.value += (target - this.value) * k;
    this.value = Math.max(0, Math.min(1, this.value));
    return this.value;
  }
}
