import { describe, expect, it } from 'vitest';
import { TUNING } from '../../src/config/tuning';
import { WalkMap } from '../../src/logic/walkmap';
import { ch1 } from './helpers';

function build() {
  const w = new WalkMap(ch1);
  const cs = ch1.lanes.map((l) => w.addCollider(l.spot[0], l.spot[1], TUNING.disturb.colliderRadius));
  return { w, cs };
}

describe('WalkMap', () => {
  it('start, square and lanes are walkable', () => {
    const { w } = build();
    expect(w.canStand(ch1.start.x, ch1.start.z)).toBe(true);
    expect(w.canStand(0, -16)).toBe(true);
    expect(w.canStand(-40, 0)).toBe(false);
  });
  it('terraces are unreachable while disturbances wait', () => {
    const { w } = build();
    const reached = w.reach(ch1.start.x, ch1.start.z);
    expect(reached(0, -8 - 9)).toBe(true);
    for (const t of w.terraces) expect(reached(t.x, t.z)).toBe(false);
  });
  it('one connected disturbance (collider shrunk, stepped aside) opens its lane', () => {
    const { w, cs } = build();
    const lane = ch1.lanes[1];
    cs[1].r = TUNING.disturb.connectedRadius;
    cs[1].x = lane.spot[0] + 1.5;
    const reached = w.reach(ch1.start.x, ch1.start.z);
    expect(reached(w.terraces[1].x, w.terraces[1].z)).toBe(true);
    expect(reached(w.beyondGate.x, w.beyondGate.z)).toBe(false);
    w.gate.open = true;
    expect(w.reach(ch1.start.x, ch1.start.z)(w.beyondGate.x, w.beyondGate.z)).toBe(true);
  });
  it('move slides and never enters colliders', () => {
    const { w } = build();
    let [x, z] = [0, -1];
    for (let i = 0; i < 400; i++) [x, z] = w.move(x, z, 0, 0.1);
    expect(z).toBeLessThan(10 - 1.6);
  });
});
