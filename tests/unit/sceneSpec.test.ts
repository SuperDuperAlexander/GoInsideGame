import { describe, expect, it } from 'vitest';
import { validateSceneSpec } from '../../src/logic/sceneSpec';

describe('validateSceneSpec', () => {
  it('accepts a valid spec and adds the hard element to the parts', () => {
    expect(validateSceneSpec({ place: 'dark', parts: ['fog', 'particles'], hardElement: 'canyon', lightLevel: 0.2 })).toEqual({
      place: 'dark',
      parts: ['fog', 'particles', 'canyon'],
      hardElement: 'canyon',
      lightLevel: 0.2,
    });
  });
  it('rejects too few or too many parts', () => {
    expect(validateSceneSpec({ place: 'dark', parts: ['canyon'], hardElement: 'canyon', lightLevel: 0.2 })).toBeNull();
    expect(
      validateSceneSpec({
        place: 'dark',
        parts: ['fog', 'wall', 'water', 'light', 'wind', 'plants', 'door'],
        hardElement: 'fog',
        lightLevel: 0.2,
      }),
    ).toBeNull();
  });
  it('rejects unknown values', () => {
    expect(validateSceneSpec({ place: 'x', parts: ['fog', 'wall'], hardElement: 'fog', lightLevel: 0 })).toBeNull();
    expect(validateSceneSpec(undefined)).toBeNull();
  });
});
