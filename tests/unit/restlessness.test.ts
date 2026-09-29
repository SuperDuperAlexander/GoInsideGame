import { describe, expect, it } from 'vitest';
import { RestlessnessSystem } from '../../src/logic/restlessness';

describe('RestlessnessSystem', () => {
  it('falls to ~0 when standing still', () => {
    const r = new RestlessnessSystem();
    r.value = 0.9;
    for (let i = 0; i < 60 * 10; i++) r.update(1 / 60, 0, 0);
    expect(r.value).toBeLessThan(0.02);
  });

  it('rises high on fast zig-zag', () => {
    const r = new RestlessnessSystem();
    for (let i = 0; i < 60 * 8; i++) {
      const left = Math.floor(i / 12) % 2 === 0;
      r.update(1 / 60, left ? -0.7 : 0.7, 0.7);
    }
    expect(r.value).toBeGreaterThan(0.75);
  });

  it('calm straight walking stays lower than zig-zag', () => {
    const calm = new RestlessnessSystem();
    for (let i = 0; i < 60 * 8; i++) calm.update(1 / 60, 0, 0.5);
    expect(calm.value).toBeLessThan(0.4);
    expect(calm.value).toBeGreaterThan(0.2);
  });

  it('is clamped to 0..1', () => {
    const r = new RestlessnessSystem();
    for (let i = 0; i < 1000; i++) r.update(0.1, i % 2 ? 5 : -5, 5);
    expect(r.value).toBeLessThanOrEqual(1);
  });
});
