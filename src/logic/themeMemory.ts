import { TUNING, type RhythmPreset } from '../config/tuning';
import type { DisturbanceSnapshot } from './disturbanceState';
import { isCrisis } from './safety';

export const STORAGE_KEY = 'light-within.v1';
export const SAVE_VERSION = 1;

export interface SeedEntry {
  type: string;
  theme: string;
  text: string;
}

export interface Settings {
  rhythm: RhythmPreset;
  volume: number;
  reducedMotion: boolean;
}

export interface SaveData {
  version: number;
  picks: string[];
  disturbances: Partial<DisturbanceSnapshot>[];
  themes: Record<string, string>;
  seeds: SeedEntry[];
  fragments: string[];
  settings: Settings;
  /** null = not asked yet. */
  aiConsent: boolean | null;
  chapter: { id: string; connected: number; gateOpen: boolean; complete: boolean };
  checkpoint: { x: number; z: number; heading: number } | null;
  /** The mood of the town and the world events that happened. */
  world: { mood?: Record<string, number>; events?: string[]; connections?: number } | null;
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function freshSave(): SaveData {
  return {
    version: SAVE_VERSION,
    picks: [],
    disturbances: [],
    themes: {},
    seeds: [],
    fragments: [],
    settings: { rhythm: 'normal', volume: 0.8, reducedMotion: false },
    aiConsent: null,
    chapter: { id: 'ch1', connected: 0, gateOpen: false, complete: false },
    checkpoint: null,
    world: null,
  };
}

const FILLER = new Set([
  "i don't know",
  'i do not know',
  'i dont know',
  "don't know",
  'dont know',
  'i guess',
  'you know',
  'i mean',
  'kind of',
  'sort of',
]);

/**
 * Cut free text into echo fragments of 3–6 words (CONTENT §10).
 * Split at commas, periods, "and", "but", "because". Lowercase. Drop filler.
 * Longer pieces keep their first 6 words.
 */
export function cutFragments(text: string): string[] {
  const { minWords, maxWords } = TUNING.echo;
  const pieces = text
    .toLowerCase()
    .replace(/[“”"]/g, '')
    .split(/[,.;:!?\n]+|\s+(?:and|but|because)\s+/)
    .map((p) => p.replace(/[^\p{L}\p{N}' -]/gu, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const out: string[] = [];
  for (const p of pieces) {
    const words = p.split(' ').filter(Boolean);
    if (words.length < minWords) continue;
    const frag = words.slice(0, maxWords).join(' ');
    if (FILLER.has(frag)) continue;
    out.push(frag);
  }
  return out;
}

/** Shows a fragment as "never… enough": "…" between two words in the middle. */
export function echoDisplay(fragment: string): string {
  const words = fragment.split(' ');
  if (words.length < 2) return fragment;
  const mid = Math.floor(words.length / 2);
  return `${words.slice(0, mid).join(' ')}… ${words.slice(mid).join(' ')}`;
}

/** The player's picks, themes, seeds and words. Saved only in the browser. */
export class ThemeMemory {
  data: SaveData;

  constructor(private readonly store: KeyValueStore | null) {
    this.data = this.load();
  }

  private load(): SaveData {
    if (!this.store) return freshSave();
    try {
      const raw = this.store.getItem(STORAGE_KEY);
      if (!raw) return freshSave();
      return sanitise(JSON.parse(raw));
    } catch {
      return freshSave();
    }
  }

  save(): void {
    if (!this.store) return;
    try {
      this.store.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Private mode or full storage: the game goes on without saving.
    }
  }

  get hasProgress(): boolean {
    return this.data.picks.length === 3;
  }

  setPicks(picks: string[]): void {
    this.data.picks = picks.slice(0, 3);
    this.data.disturbances = [];
    this.data.themes = {};
    this.data.chapter = { id: 'ch1', connected: 0, gateOpen: false, complete: false };
    this.data.checkpoint = null;
    this.data.world = null;
    this.save();
  }

  setTheme(type: string, theme: string): void {
    this.data.themes[type] = theme;
    this.save();
  }

  addSeed(seed: SeedEntry): void {
    this.data.seeds.push({ ...seed, text: seed.text.slice(0, 140) });
    this.save();
  }

  /** Keeps echo fragments from free text. Never stores text that matched the crisis check. */
  addFreeText(text: string): string[] {
    if (isCrisis(text)) return [];
    const frags = cutFragments(text).filter((f) => !isCrisis(f));
    if (!frags.length) return [];
    this.data.fragments.push(...frags);
    const max = TUNING.echo.maxFragments;
    if (this.data.fragments.length > max) this.data.fragments.splice(0, this.data.fragments.length - max);
    this.save();
    return frags;
  }

  setConsent(v: boolean): void {
    this.data.aiConsent = v;
    this.save();
  }

  forgetEverything(): void {
    const settings = this.data.settings;
    this.data = freshSave();
    this.data.settings = settings;
    try {
      this.store?.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

function sanitise(v: unknown): SaveData {
  const f = freshSave();
  if (!v || typeof v !== 'object') return f;
  const o = v as Partial<SaveData>;
  if (o.version !== SAVE_VERSION) return f;
  const strArr = (a: unknown, max: number) =>
    Array.isArray(a) ? a.filter((s): s is string => typeof s === 'string').slice(0, max) : [];
  const picks = strArr(o.picks, 3);
  f.picks = picks.length === 3 ? picks : [];
  f.disturbances = Array.isArray(o.disturbances) ? o.disturbances.slice(0, 3).filter((d) => d && typeof d === 'object') : [];
  if (o.themes && typeof o.themes === 'object')
    for (const [k, t] of Object.entries(o.themes)) if (typeof t === 'string') f.themes[k] = t;
  f.seeds = Array.isArray(o.seeds)
    ? o.seeds
        .filter((s) => s && typeof s.text === 'string')
        .map((s) => ({ type: String(s.type ?? ''), theme: String(s.theme ?? ''), text: s.text.slice(0, 140) }))
    : [];
  f.fragments = strArr(o.fragments, TUNING.echo.maxFragments);
  if (o.settings && typeof o.settings === 'object') {
    const s = o.settings;
    if (s.rhythm === 'normal' || s.rhythm === 'slow' || s.rhythm === 'easy') f.settings.rhythm = s.rhythm;
    if (typeof s.volume === 'number') f.settings.volume = Math.max(0, Math.min(1, s.volume));
    f.settings.reducedMotion = !!s.reducedMotion;
  }
  f.aiConsent = typeof o.aiConsent === 'boolean' ? o.aiConsent : null;
  if (o.chapter && typeof o.chapter === 'object') {
    f.chapter = {
      id: 'ch1',
      connected: Math.max(0, Math.min(3, Number(o.chapter.connected) || 0)),
      gateOpen: !!o.chapter.gateOpen,
      complete: !!o.chapter.complete,
    };
  }
  const c = o.checkpoint;
  if (c && typeof c.x === 'number' && typeof c.z === 'number')
    f.checkpoint = { x: c.x, z: c.z, heading: Number(c.heading) || 0 };
  if (o.world && typeof o.world === 'object') f.world = o.world;
  return f;
}
