import { describe, expect, it } from 'vitest';
import { BreathSystem } from '../../src/logic/breath';

function run(b: BreathSystem, seconds: number, input: { inhaleHeld: boolean; exhaleHeld: boolean; touchMode: boolean }) {
  const dt = 1 / 60;
  for (let t = 0; t < seconds; t += dt) b.update(dt, input);
}
const IN = { inhaleHeld: true, exhaleHeld: false, touchMode: false };
const OUT = { inhaleHeld: false, exhaleHeld: true, touchMode: false };
const NONE = { inhaleHeld: false, exhaleHeld: false, touchMode: false };

describe('BreathSystem', () => {
  it('counts a breath of ≥ 1 s in followed by a full out-breath', () => {
    const b = new BreathSystem();
    let count = 0;
    b.onFinished(() => count++);
    run(b, 2, IN);
    expect(b.phase).toBe('inhale');
    expect(b.level).toBeGreaterThan(0.4);
    run(b, 3, OUT);
    expect(count).toBe(1);
    expect(b.phase).toBe('idle');
  });

  it('does not count an in-breath shorter than 1 s', () => {
    const b = new BreathSystem();
    let count = 0;
    b.onFinished(() => count++);
    run(b, 0.6, IN);
    run(b, 3, OUT);
    expect(count).toBe(0);
  });

  it('does not count when the out-breath stops before empty', () => {
    const b = new BreathSystem();
    let count = 0;
    b.onFinished(() => count++);
    run(b, 3, IN);
    run(b, 0.5, OUT);
    run(b, 2, NONE);
    expect(count).toBe(0);
    run(b, 4, OUT);
    expect(count).toBe(1);
  });

  it('in touch mode, letting go runs the out-breath by itself', () => {
    const b = new BreathSystem();
    let count = 0;
    b.onFinished(() => count++);
    run(b, 2, { inhaleHeld: true, exhaleHeld: false, touchMode: true });
    run(b, 5, { inhaleHeld: false, exhaleHeld: false, touchMode: true });
    expect(count).toBe(1);
  });

  it('uses the presets', () => {
    const b = new BreathSystem();
    b.setPreset('slow');
    expect(b.rhythm).toEqual({ inSeconds: 5, outSeconds: 6 });
    b.setPreset('easy');
    expect(b.rhythm).toEqual({ inSeconds: 3, outSeconds: 3 });
    run(b, 1.5, IN);
    expect(b.level).toBeCloseTo(0.5, 1);
  });

  it('never punishes a poor rhythm: score stays in 0..1 and the breath still counts', () => {
    const b = new BreathSystem();
    const scores: number[] = [];
    b.onFinished((e) => scores.push(e.rhythmScore));
    run(b, 1.2, IN);
    run(b, 4, OUT);
    expect(scores.length).toBe(1);
    expect(scores[0]).toBeGreaterThanOrEqual(0);
    expect(scores[0]).toBeLessThanOrEqual(1);
  });
});
