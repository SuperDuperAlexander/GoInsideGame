import { describe, expect, it } from 'vitest';
import { CRISIS_PHRASES, isCrisis } from '../../src/logic/safety';

describe('isCrisis', () => {
  it('matches every phrase of the list', () => {
    for (const p of CRISIS_PHRASES) expect(isCrisis(`well ${p} now`), p).toBe(true);
  });
  it('is case and accent insensitive', () => {
    expect(isCrisis('I Want To DIE')).toBe(true);
    expect(isCrisis('ich will mich TOTEN')).toBe(true);
    expect(isCrisis('Ich möchte sterben')).toBe(true);
    expect(isCrisis('I don’t want to live')).toBe(true);
    expect(isCrisis('Self-Harm')).toBe(true);
  });
  it('has no false match on harmless phrases', () => {
    for (const t of ['kill time', 'this is killing me', 'die Sonne', 'dying to try', 'I love my life', 'skill them all'])
      expect(isCrisis(t), t).toBe(false);
  });
});
