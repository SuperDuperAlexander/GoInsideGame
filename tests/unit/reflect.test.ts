import { describe, expect, it } from 'vitest';
import {
  buildRequest,
  fallback,
  matchPlaceKey,
  matchTheme,
  parseModelJson,
  validateResponse,
} from '../../src/logic/reflect';
import { validateSceneSpec } from '../../src/logic/sceneSpec';
import { disturbances, tables } from './helpers';

const good = {
  question: 'What would winning give you?',
  chips: ['Rest', 'Safety', 'Freedom', 'Being seen'],
  theme: null,
  sceneSpec: { place: 'tight', parts: ['narrowSpace', 'wall', 'light'], hardElement: 'wall', lightLevel: 0.3 },
  seed: null,
};

describe('validateResponse', () => {
  it('accepts a good place response', () => {
    const r = validateResponse(tables, 'place', good);
    expect(r?.question).toBe(good.question);
    expect(r?.sceneSpec?.hardElement).toBe('wall');
    expect(r?.chips).toContain('Something else');
  });
  it('rejects bad parts, hard elements, places, lengths', () => {
    expect(validateResponse(tables, 'place', { ...good, sceneSpec: { ...good.sceneSpec, parts: ['dragon'] } })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, sceneSpec: { ...good.sceneSpec, hardElement: 'door' } })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, sceneSpec: { ...good.sceneSpec, place: 'nice' } })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, question: 'x'.repeat(150) + '?' })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, question: 'You should rest.' })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, chips: ['one'] })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, chips: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] })).toBeNull();
    expect(validateResponse(tables, 'place', { ...good, chips: ['a'.repeat(29), 'b'] })).toBeNull();
    expect(validateResponse(tables, 'place', null)).toBeNull();
    expect(validateResponse(tables, 'place', 'text')).toBeNull();
  });
  it('clamps lightLevel', () => {
    const r = validateResponse(tables, 'place', { ...good, sceneSpec: { ...good.sceneSpec, lightLevel: 7 } });
    expect(r?.sceneSpec?.lightLevel).toBe(1);
  });
  it('maps unknown themes to "Something else"', () => {
    expect(validateResponse(tables, 'theme', { theme: 'Money', seed: 'I want more.' })?.theme).toBe('Something else');
    expect(validateResponse(tables, 'theme', { theme: 'rest', seed: 'Behind the pull, I want rest.' })?.theme).toBe('Rest');
  });
  it('falls back to the theme seed when the seed is bad', () => {
    const r = validateResponse(tables, 'theme', { theme: 'Peace', seed: 'x '.repeat(40) });
    expect(r?.seed).toBe('What I found here: peace.');
  });
  it('handles crisis', () => {
    expect(validateResponse(tables, 'place', { crisis: true })?.crisis).toBe(true);
  });
});

describe('fallback', () => {
  it('is always valid for every type × chip × theme', () => {
    for (const type of disturbances.order) {
      for (const key of tables.round1.chips) {
        const ctx = { type, form: disturbances.types[type].forms[0], history: [], freeText: null };
        const r1 = fallback(tables, { ...ctx, step: 'place', chip: tables.round1.text[key] });
        expect(r1.placeKey).toBe(key);
        expect(validateSceneSpec(r1.sceneSpec)).not.toBeNull();
        expect(r1.question).toBe(tables.round2.question[key]);
        expect(validateResponse(tables, 'place', r1)).not.toBeNull();
        for (const theme of r1.chips) {
          const r2 = fallback(tables, { ...ctx, step: 'theme', chip: theme, placeKey: key });
          expect(tables.themeList).toContain(r2.theme);
          expect(r2.theme).toBe(theme);
          expect(r2.seed).toMatch(/^What I found here: .+\.$/);
        }
      }
    }
  });
  it('matches own words by keyword', () => {
    expect(matchPlaceKey(tables, 'I really need it')).toBe('want');
    expect(matchPlaceKey(tables, 'I fear I will lose it')).toBe('afraid');
    expect(matchPlaceKey(tables, 'so unfair')).toBe('angry');
    expect(matchPlaceKey(tables, 'it is exciting')).toBe('excited');
    expect(matchPlaceKey(tables, "I don't want it near me")).toBe('pushAway');
    expect(matchPlaceKey(tables, 'I know it well')).toBe('unsure');
    expect(matchTheme(tables, 'I am so tired')).toBe('Rest');
    expect(matchTheme(tables, 'to feel respected, to be recognised')).toBe('Being seen');
    expect(matchTheme(tables, 'purple')).toBe('Something else');
  });
  it('seeds from own words when given', () => {
    const r = fallback(tables, { type: 'money', form: 'slot machine', step: 'theme', history: [], chip: null, freeText: 'I just want to rest for once. Really.' });
    expect(r.theme).toBe('Rest');
    expect(r.seed).toBe('I just want to rest for once.');
  });
});

describe('request and parsing', () => {
  it('builds a small request', () => {
    const req = buildRequest({ type: 'money', form: 'slot machine', step: 'place', history: [{ q: 'q?', a: 'a' }], chip: 'I want it', freeText: '  hi   there ' });
    expect(req).toEqual({ type: 'money', form: 'slot machine', step: 'place', history: [{ q: 'q?', a: 'a' }], chip: 'I want it', freeText: 'hi there' });
  });
  it('strips code fences', () => {
    expect(parseModelJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(parseModelJson('Sure! {"a":2} ok')).toEqual({ a: 2 });
    expect(parseModelJson('nope')).toBeNull();
  });
});
