import type { Engine } from '@babylonjs/core/Engines/engine';
import { TUNING } from '../config/tuning';

export type Tier = 'low' | 'medium' | 'high';

/**
 * Keeps the frame rate steady. Caps the device pixel ratio (1.5 touch, 2 desktop), adapts the render
 * scale every 2.5 s (below 38 fps fewer pixels, above 56 fps more), picks a quality tier from a 1 s
 * frame-time test. The watchdog only steps the tier down.
 */
export class Perf {
  scale = 1;
  tier: Tier = 'high';
  fps = 60;
  private timer = 0;
  private frames = 0;
  private elapsed = 0;
  private testTime = 0;
  private testFrames = 0;
  private tested = false;
  private lowStreak = 0;
  onTier: ((t: Tier) => void) | null = null;

  constructor(
    private readonly engine: Engine,
    private readonly touch: boolean,
  ) {
    this.tier = touch ? 'medium' : 'high';
    this.apply();
    window.addEventListener('resize', () => this.apply());
  }

  get dpr(): number {
    const p = TUNING.perf;
    return Math.min(window.devicePixelRatio || 1, this.touch ? p.dprTouch : p.dprDesktop);
  }

  private apply(): void {
    this.engine.setHardwareScalingLevel(this.scale / this.dpr);
    this.engine.resize();
  }

  update(dt: number): void {
    const p = TUNING.perf;
    if (dt <= 0 || dt > 0.5) return;
    if (!this.tested) {
      this.testTime += dt;
      this.testFrames++;
      if (this.testTime >= 1) {
        this.tested = true;
        const fps = this.testFrames / this.testTime;
        const tier: Tier = fps < 30 ? 'low' : fps < 50 ? 'medium' : this.touch ? 'medium' : 'high';
        this.setTier(tier);
      }
    }
    this.frames++;
    this.elapsed += dt;
    this.timer += dt;
    if (this.timer < p.adaptInterval) return;
    this.fps = this.frames / Math.max(0.001, this.elapsed);
    this.timer = this.frames = this.elapsed = 0;
    let next = this.scale;
    if (this.fps < p.lowFps) next = Math.min(p.scaleMax, this.scale + p.scaleStep);
    else if (this.fps > p.highFps) next = Math.max(p.scaleMin, this.scale - p.scaleStep);
    if (next !== this.scale) {
      this.scale = next;
      this.apply();
    }
    // Watchdog: at the lowest resolution and still slow for 3 checks → step the tier down.
    if (this.fps < p.lowFps && this.scale >= p.scaleMax) this.lowStreak++;
    else this.lowStreak = 0;
    if (this.lowStreak >= 3) {
      this.lowStreak = 0;
      if (this.tier === 'high') this.setTier('medium');
      else if (this.tier === 'medium') this.setTier('low');
    }
  }

  private setTier(t: Tier): void {
    const order: Tier[] = ['low', 'medium', 'high'];
    if (order.indexOf(t) >= order.indexOf(this.tier) && this.tested && t !== this.tier) {
      // Only the first test may raise the tier.
    }
    this.tier = t;
    this.onTier?.(t);
  }
}

export function isTouchDevice(): boolean {
  return (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches) || navigator.maxTouchPoints > 0;
}
