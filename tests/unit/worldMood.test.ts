import { describe, expect, it } from 'vitest';
import { EVENTS, THEME_EVENTS, WorldMood } from '../../src/logic/worldMood';

describe('WorldMood', () => {
  it('starts stormy and cold, gets warmer with every connection', () => {
    const w = new WorldMood();
    expect(w.mood.storm).toBe(1);
    expect(w.mood.warmth).toBe(0);
    w.connect('Rest');
    const a = { ...w.mood };
    w.connect('Belonging');
    expect(w.mood.warmth).toBeGreaterThan(a.warmth);
    expect(w.mood.storm).toBeLessThan(a.storm);
  });
  it('different themes give different towns', () => {
    const a = new WorldMood();
    ['Rest', 'Safety', 'Peace'].forEach((t) => a.connect(t));
    const b = new WorldMood();
    ['Freedom', 'Being seen', 'Joy'].forEach((t) => b.connect(t));
    expect(a.events).not.toEqual(b.events);
    expect(a.events).toContain('benches');
    expect(b.events).toContain('kites');
  });
  it('every theme has only kit events, and every connection brings something new', () => {
    for (const evs of Object.values(THEME_EVENTS)) for (const e of evs) expect(EVENTS).toContain(e);
    const w = new WorldMood();
    for (let i = 0; i < 3; i++) expect(w.connect('Rest').length).toBeGreaterThan(0);
  });
  it('after three connections the storm is gone and people are warm', () => {
    const w = new WorldMood();
    ['Rest', 'Rest', 'Rest'].forEach((t) => w.connect(t));
    expect(w.mood.storm).toBe(0);
    expect(WorldMood.personState(w.mood.warmth, 0.5)).toBe('warm');
    expect(WorldMood.personState(0, 0.5)).toBe('grumpy');
  });
  it('uses AI events from the kit and ignores unknown ones', () => {
    const w = new WorldMood();
    expect(w.connect('Rest', ['kites', 'dragons' as never])).toEqual(['kites']);
  });
  it('restores safely', () => {
    const w = new WorldMood();
    w.restore({ mood: { warmth: 7, storm: -1 } as never, events: ['flowers', 'nope'], connections: 9 });
    expect(w.mood.warmth).toBe(1);
    expect(w.mood.storm).toBe(0);
    expect(w.events).toEqual(['flowers']);
    expect(w.connections).toBe(3);
  });
});
