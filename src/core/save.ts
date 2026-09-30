import { ThemeMemory, type KeyValueStore } from '../logic/themeMemory';

function browserStore(): KeyValueStore | null {
  try {
    const s = window.localStorage;
    const probe = '__lw_probe';
    s.setItem(probe, '1');
    s.removeItem(probe);
    return s;
  } catch {
    return null;
  }
}

/** The one save of the game. Lives only in this browser (localStorage, key light-within.v1). */
export const memory = new ThemeMemory(typeof window !== 'undefined' ? browserStore() : null);
