import { TUNING } from '../config/tuning';

export type DisturbancePhase = 'waiting' | 'near' | 'choosing' | 'within' | 'connected';

export interface DisturbanceSnapshot {
  phase: DisturbancePhase;
  formIndex: number;
  pushes: number;
  stayedOutside: boolean;
  leftAfterStay: boolean;
  theme: string | null;
}

/** State of one disturbance. Pure logic (TECH §5.3). */
export class DisturbanceState {
  phase: DisturbancePhase = 'waiting';
  formIndex = 0;
  pushes = 0;
  theme: string | null = null;
  private stayedOutside = false;
  private leftAfterStay = false;

  get scale(): number {
    if (this.phase === 'connected') return TUNING.disturb.connectedScale;
    return this.growth;
  }

  get growth(): number {
    return Math.min(TUNING.disturb.pushMax, 1 + TUNING.disturb.pushGrowth * this.pushes);
  }

  get isConnected(): boolean {
    return this.phase === 'connected';
  }

  push(): void {
    if (this.phase === 'connected') return;
    this.pushes++;
  }

  /** Call every frame with the player's distance. Returns true when the form changed. */
  updateDistance(distance: number): boolean {
    const t = TUNING.disturb;
    if (this.phase === 'connected' || this.phase === 'within') return false;
    if (this.stayedOutside && distance > t.leaveRange) this.leftAfterStay = true;
    if (this.leftAfterStay && distance < t.nearRange) {
      this.formIndex = (this.formIndex + 1) % 3;
      this.stayedOutside = false;
      this.leftAfterStay = false;
      this.phase = 'near';
      return true;
    }
    if (this.phase === 'waiting' && distance < t.nearRange) this.phase = 'near';
    else if ((this.phase === 'near' || this.phase === 'choosing') && distance > t.nearRange + 1)
      this.phase = 'waiting';
    return false;
  }

  startChoosing(): void {
    if (this.phase === 'near' || this.phase === 'waiting') this.phase = 'choosing';
  }

  stayOutside(): void {
    if (this.phase === 'connected') return;
    this.stayedOutside = true;
    this.leftAfterStay = false;
    this.phase = 'near';
  }

  goWithin(): void {
    if (this.phase !== 'connected') this.phase = 'within';
  }

  /** Returned from within without connecting (crisis help). */
  abort(): void {
    if (this.phase === 'within') this.phase = 'near';
  }

  connect(theme: string): void {
    this.phase = 'connected';
    this.theme = theme;
  }

  snapshot(): DisturbanceSnapshot {
    return {
      phase: this.phase,
      formIndex: this.formIndex,
      pushes: this.pushes,
      stayedOutside: this.stayedOutside,
      leftAfterStay: this.leftAfterStay,
      theme: this.theme,
    };
  }

  restore(s: Partial<DisturbanceSnapshot>): void {
    const phase = s.phase === 'connected' ? 'connected' : 'waiting';
    this.phase = phase;
    this.formIndex = clampInt(s.formIndex, 0, 2);
    this.pushes = clampInt(s.pushes, 0, 10);
    this.stayedOutside = !!s.stayedOutside && phase !== 'connected';
    this.leftAfterStay = !!s.leftAfterStay && this.stayedOutside;
    this.theme = typeof s.theme === 'string' ? s.theme : null;
  }
}

function clampInt(v: unknown, min: number, max: number): number {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : min;
  return Math.max(min, Math.min(max, n));
}
