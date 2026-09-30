import { describe, expect, it } from 'vitest';
import { cutFragments, echoDisplay, STORAGE_KEY, ThemeMemory } from '../../src/logic/themeMemory';
import { MemStore } from './helpers';

describe('cutFragments', () => {
  it('cuts at commas, periods, and, but, because; 3–6 words; lowercase', () => {
    const f = cutFragments('I want to win, then I can finally relax and never worry about bills again. OK');
    expect(f).toEqual(['i want to win', 'then i can finally relax', 'never worry about bills again']);
  });
  it('keeps the first 6 words of long pieces', () => {
    expect(cutFragments('one two three four five six seven eight')).toEqual(['one two three four five six']);
  });
  it('drops filler and short pieces', () => {
    expect(cutFragments("I don't know. no. yes please")).toEqual([]);
  });
  it('shows "…" between two words', () => {
    expect(echoDisplay('never enough')).toBe('never… enough');
    expect(echoDisplay('i want to win')).toBe('i want… to win');
  });
});

describe('ThemeMemory', () => {
  it('keeps max 20 fragments, oldest dropped first', () => {
    const m = new ThemeMemory(new MemStore());
    for (let i = 0; i < 25; i++) m.addFreeText(`fragment number ${i} here`);
    expect(m.data.fragments.length).toBe(20);
    expect(m.data.fragments[0]).toBe('fragment number 5 here');
  });
  it('never stores text that matches the crisis check', () => {
    const m = new ThemeMemory(new MemStore());
    expect(m.addFreeText('sometimes I want to die, it is heavy')).toEqual([]);
    expect(m.data.fragments).toEqual([]);
  });
  it('survives corrupt data', () => {
    const s = new MemStore();
    s.setItem(STORAGE_KEY, '{not json');
    const m = new ThemeMemory(s);
    expect(m.data.picks).toEqual([]);
    s.setItem(STORAGE_KEY, JSON.stringify({ version: 1, picks: 'x', seeds: [{}, { text: 5 }], fragments: [1, 'a b c'] }));
    const m2 = new ThemeMemory(s);
    expect(m2.data.picks).toEqual([]);
    expect(m2.data.seeds).toEqual([]);
    expect(m2.data.fragments).toEqual(['a b c']);
  });
  it('round-trips and forgets everything', () => {
    const s = new MemStore();
    const m = new ThemeMemory(s);
    m.setPicks(['money', 'phone', 'crowd']);
    m.addSeed({ type: 'money', theme: 'Rest', text: 'Behind the pull, I want rest.' });
    const m2 = new ThemeMemory(s);
    expect(m2.data.picks).toEqual(['money', 'phone', 'crowd']);
    expect(m2.data.seeds[0].theme).toBe('Rest');
    m2.forgetEverything();
    expect(s.getItem(STORAGE_KEY)).toBeNull();
    expect(new ThemeMemory(s).data.picks).toEqual([]);
  });
  it('works without storage (private mode)', () => {
    const throwing = {
      getItem: () => {
        throw new Error('no');
      },
      setItem: () => {
        throw new Error('no');
      },
      removeItem: () => {
        throw new Error('no');
      },
    };
    const m = new ThemeMemory(throwing);
    m.setPicks(['a', 'b', 'c']);
    m.forgetEverything();
    expect(m.data.picks).toEqual([]);
  });
});
