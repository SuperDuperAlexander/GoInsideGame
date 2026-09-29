import type { DisturbanceTable, FallbackTables, Strings } from '../logic/contentTypes';
import { validateSceneSpec } from '../logic/sceneSpec';
import type { ChapterLayout } from '../logic/walkmap';

export interface Content {
  strings: Strings;
  disturbances: DisturbanceTable;
  fallback: FallbackTables;
  chapter: ChapterLayout;
}

let loaded: Content | null = null;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`content: ${url} ${res.status}`);
  return (await res.json()) as T;
}

/** Loads and validates en.json, disturbances.json, fallback.json and the chapter layout. */
export async function loadContent(chapterId = 'ch1'): Promise<Content> {
  const [strings, disturbances, fallback, chapter] = await Promise.all([
    getJson<Strings>('/data/content/en.json'),
    getJson<DisturbanceTable>('/data/disturbances.json'),
    getJson<FallbackTables>('/data/fallback.json'),
    getJson<ChapterLayout>(`/data/chapters/${chapterId}.json`),
  ]);
  validateContent({ strings, disturbances, fallback, chapter });
  loaded = { strings, disturbances, fallback, chapter };
  return loaded;
}

export function validateContent(c: Content): void {
  const need = ['title', 'start.begin', 'opening.breathe', 'choice.within', 'choice.outside', 'help.title'];
  for (const k of need) if (typeof c.strings[k] !== 'string') throw new Error(`content: missing string ${k}`);
  if (c.disturbances.order.length !== 8) throw new Error('content: need 8 disturbance types');
  for (const t of c.disturbances.order) {
    const d = c.disturbances.types[t];
    if (!d || d.forms.length !== 3) throw new Error(`content: bad type ${t}`);
    if (typeof c.fallback.soul[t] !== 'string') throw new Error(`content: no soul question for ${t}`);
    if (typeof c.strings[d.labelKey] !== 'string') throw new Error(`content: no label for ${t}`);
  }
  for (const k of c.fallback.round1.chips) {
    if (!validateSceneSpec(c.fallback.round1.scene[k])) throw new Error(`content: bad scene ${k}`);
    if (!c.fallback.round2.question[k] || !c.fallback.round2.themes[k]) throw new Error(`content: bad round2 ${k}`);
  }
  if (c.chapter.lanes.length !== 3) throw new Error('content: chapter needs 3 lanes');
}

export function content(): Content {
  if (!loaded) throw new Error('content not loaded');
  return loaded;
}

/** Player-facing text by key. `{name}` placeholders are filled from vars. */
export function t(key: string, vars?: Record<string, string>): string {
  const s = loaded?.strings[key];
  if (s === undefined) {
    console.warn(`[content] missing key ${key}`);
    return '';
  }
  return vars ? s.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? '') : s;
}
