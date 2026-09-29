import { TUNING, type RhythmPreset } from '../config/tuning';

export type BreathPhase = 'idle' | 'inhale' | 'exhale';

export interface BreathInput {
  inhaleHeld: boolean;
  exhaleHeld: boolean;
  touchMode: boolean;
}

export interface BreathFinished {
  inSeconds: number;
  outSeconds: number;
  rhythmScore: number;
}

/**
 * The breath. Pure logic.
 * Level rises while the in-breath is held and falls while breathing out.
 * A breath is finished when an in-breath of ≥ 1 s was followed by an out-breath that reached ≤ 0.05.
 * A poor rhythm is never punished: the score only colours the visuals.
 */
export class BreathSystem {
  phase: BreathPhase = 'idle';
  level = 0;
  rhythmScore = 1;
  /** 0..1 position in the guide cycle (in then out). */
  guidePhase = 0;
  private preset: RhythmPreset = 'normal';
  private inTime = 0;
  private outTime = 0;
  private lastInTime = 0;
  private validIn = false;
  private touchReleasing = false;
  private listeners: ((b: BreathFinished) => void)[] = [];

  setPreset(p: RhythmPreset): void {
    this.preset = p;
  }

  get rhythm() {
    return TUNING.breath.presets[this.preset];
  }

  onFinished(fn: (b: BreathFinished) => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  reset(): void {
    this.phase = 'idle';
    this.level = 0;
    this.inTime = 0;
    this.outTime = 0;
    this.validIn = false;
    this.touchReleasing = false;
  }

  update(dt: number, input: BreathInput): void {
    const r = this.rhythm;
    const cycle = r.inSeconds + r.outSeconds;
    this.guidePhase = (this.guidePhase + dt / cycle) % 1;

    const inhale = input.inhaleHeld;
    let exhale = input.exhaleHeld && !inhale;
    if (input.touchMode) {
      if (inhale) this.touchReleasing = false;
      else if (this.phase === 'inhale') this.touchReleasing = true;
      if (this.touchReleasing) exhale = true;
    }

    if (inhale) {
      if (this.phase !== 'inhale') {
        this.phase = 'inhale';
        this.inTime = 0;
        this.validIn = false;
      }
      this.inTime += dt;
      this.level = Math.min(1, this.level + dt / r.inSeconds);
      if (this.inTime >= TUNING.breath.minInSeconds) this.validIn = true;
      return;
    }

    if (exhale) {
      if (this.phase !== 'exhale') {
        this.phase = 'exhale';
        this.lastInTime = this.inTime;
        this.outTime = 0;
      }
      this.outTime += dt;
      this.level = Math.max(0, this.level - dt / r.outSeconds);
      if (this.level <= TUNING.breath.emptyLevel) {
        const finished = this.validIn;
        const inS = this.lastInTime;
        const outS = this.outTime;
        this.phase = 'idle';
        this.validIn = false;
        this.touchReleasing = false;
        this.level = 0;
        if (finished) {
          this.rhythmScore = scoreRhythm(inS, outS, r.inSeconds, r.outSeconds);
          const ev = { inSeconds: inS, outSeconds: outS, rhythmScore: this.rhythmScore };
          for (const l of [...this.listeners]) l(ev);
        }
      }
      return;
    }

    // Neither held: the breath rests where it is (desktop), a held in-breath stays valid.
    if (this.phase === 'inhale') this.phase = 'idle';
  }
}

/** 1 = matches the chosen rhythm, falls towards 0 the further away. Never used to punish. */
export function scoreRhythm(inS: number, outS: number, wantIn: number, wantOut: number): number {
  const a = Math.abs(inS - wantIn) / wantIn;
  const b = Math.abs(outS - wantOut) / wantOut;
  return Math.max(0, Math.min(1, 1 - (a + b) / 2));
}
