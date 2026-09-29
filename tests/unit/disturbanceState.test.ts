import { describe, expect, it } from 'vitest';
import { DisturbanceState } from '../../src/logic/disturbanceState';

describe('DisturbanceState', () => {
  it('push grows by 0.15 each, capped at 1.6, and never breaks', () => {
    const d = new DisturbanceState();
    d.push();
    expect(d.growth).toBeCloseTo(1.15);
    for (let i = 0; i < 20; i++) d.push();
    expect(d.growth).toBeCloseTo(1.6);
    expect(d.phase).not.toBe('connected');
  });

  it('stay outside + leave + return cycles the form', () => {
    const d = new DisturbanceState();
    d.updateDistance(3);
    expect(d.phase).toBe('near');
    d.stayOutside();
    expect(d.updateDistance(4)).toBe(false);
    d.updateDistance(20);
    expect(d.updateDistance(4)).toBe(true);
    expect(d.formIndex).toBe(1);
    d.stayOutside();
    d.updateDistance(20);
    d.updateDistance(4);
    d.stayOutside();
    d.updateDistance(20);
    d.updateDistance(4);
    expect(d.formIndex).toBe(0);
  });

  it('without staying outside, the form does not change', () => {
    const d = new DisturbanceState();
    d.updateDistance(4);
    d.updateDistance(30);
    d.updateDistance(4);
    expect(d.formIndex).toBe(0);
  });

  it('connect stores the theme, scale shrinks, push has no effect', () => {
    const d = new DisturbanceState();
    d.goWithin();
    d.connect('Rest');
    expect(d.isConnected).toBe(true);
    expect(d.theme).toBe('Rest');
    expect(d.scale).toBeCloseTo(0.8);
    d.push();
    expect(d.pushes).toBe(0);
  });

  it('restores from a snapshot safely', () => {
    const d = new DisturbanceState();
    d.restore({ phase: 'within', formIndex: 9, pushes: -3 } as never);
    expect(d.phase).toBe('waiting');
    expect(d.formIndex).toBe(2);
    expect(d.pushes).toBe(0);
  });
});
