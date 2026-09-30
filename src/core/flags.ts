/** URL debug switches (CLAUDE.md §6). */
export interface Flags {
  debug: boolean;
  autostart: boolean;
  autopick: boolean;
  autobreathe: boolean;
  noai: boolean;
  chapter: string | null;
  color: boolean;
  touch: boolean;
  reducedmotion: boolean;
  safe: boolean;
}

export function parseFlags(search: string): Flags {
  const p = new URLSearchParams(search);
  const has = (k: string) => p.has(k) && p.get(k) !== '0' && p.get(k) !== 'false';
  return {
    debug: has('debug'),
    autostart: has('autostart'),
    autopick: has('autopick'),
    autobreathe: has('autobreathe'),
    noai: has('noai'),
    chapter: p.get('chapter'),
    color: has('color'),
    touch: has('touch'),
    reducedmotion: has('reducedmotion'),
    safe: has('safe'),
  };
}

export const flags: Flags =
  typeof window !== 'undefined' ? parseFlags(window.location.search) : parseFlags('');
