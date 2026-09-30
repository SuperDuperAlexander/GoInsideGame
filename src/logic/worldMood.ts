/**
 * The mood of the town. Pure logic.
 * Every connection moves the mood; the found theme decides HOW the town heals (which world events happen),
 * so no two walks end the same. Nothing disappears: grumpy people become kind, broken places get cared for.
 */

export const EVENTS = [
  'flowers',
  'lanterns',
  'garlands',
  'benches',
  'kites',
  'birds',
  'sharedTable',
  'windowsLit',
  'stormClears',
  'peopleGreet',
  'music',
] as const;
export type WorldEvent = (typeof EVENTS)[number];

export function isWorldEvent(v: unknown): v is WorldEvent {
  return typeof v === 'string' && (EVENTS as readonly string[]).includes(v);
}

/** Offline table: which events each theme brings (also the fallback for the AI). */
export const THEME_EVENTS: Record<string, WorldEvent[]> = {
  Rest: ['benches', 'lanterns', 'windowsLit'],
  Safety: ['lanterns', 'windowsLit', 'benches'],
  Freedom: ['kites', 'birds', 'garlands'],
  'Being seen': ['windowsLit', 'garlands', 'peopleGreet'],
  Belonging: ['sharedTable', 'peopleGreet', 'garlands'],
  Love: ['flowers', 'peopleGreet', 'music'],
  Peace: ['stormClears', 'flowers', 'birds'],
  Joy: ['garlands', 'kites', 'music'],
  Trust: ['sharedTable', 'benches', 'peopleGreet'],
  Enough: ['sharedTable', 'flowers', 'lanterns'],
  'Something else': ['flowers', 'lanterns', 'birds'],
};

export interface Mood {
  /** People: cold and grumpy (0) → kind and warm (1). */
  warmth: number;
  /** Sky and windows: dark (0) → bright (1). */
  light: number;
  /** Houses and streets: neglected (0) → cared for (1). */
  care: number;
  /** Storm over the town: 1 = heavy storm, 0 = clear sky. */
  storm: number;
}

export const START_MOOD: Mood = { warmth: 0, light: 0.1, care: 0, storm: 1 };

/** How much one event moves the mood. */
const EVENT_MOOD: Partial<Record<WorldEvent, Partial<Mood>>> = {
  peopleGreet: { warmth: 0.15 },
  sharedTable: { warmth: 0.1, care: 0.1 },
  music: { warmth: 0.08, light: 0.05 },
  windowsLit: { light: 0.2 },
  lanterns: { light: 0.15, care: 0.05 },
  flowers: { care: 0.15, warmth: 0.05 },
  garlands: { care: 0.1, light: 0.05 },
  benches: { care: 0.1 },
  kites: { light: 0.08, warmth: 0.05 },
  birds: { light: 0.05 },
  stormClears: { storm: -0.45 },
};

const clamp = (v: number) => Math.max(0, Math.min(1, v));

export class WorldMood {
  mood: Mood = { ...START_MOOD };
  events: WorldEvent[] = [];
  connections = 0;

  /** A connection happened: base healing + the events of this theme. Returns the new events (no repeats). */
  connect(theme: string, events?: WorldEvent[]): WorldEvent[] {
    this.connections++;
    const m = this.mood;
    // Every connection heals a third of the way; the storm always calms a bit.
    m.warmth = clamp(m.warmth + 0.22);
    m.light = clamp(m.light + 0.18);
    m.care = clamp(m.care + 0.18);
    m.storm = clamp(m.storm - 0.2);
    const wanted = (events && events.length ? events : THEME_EVENTS[theme] ?? THEME_EVENTS['Something else']).filter(isWorldEvent);
    let fresh = wanted.filter((e) => !this.events.includes(e));
    // Always at least one visible new thing: take the next unused event from the other themes.
    if (!fresh.length) fresh = EVENTS.filter((e) => !this.events.includes(e)).slice(0, 1);
    for (const e of fresh) {
      this.events.push(e);
      for (const [k, v] of Object.entries(EVENT_MOOD[e] ?? {})) m[k as keyof Mood] = clamp(m[k as keyof Mood] + (v as number));
    }
    if (this.connections >= 3) {
      // The whole chapter is connected: the storm is gone, the town is warm.
      m.storm = 0;
      m.warmth = Math.max(m.warmth, 0.9);
      m.light = Math.max(m.light, 0.85);
      m.care = Math.max(m.care, 0.85);
    }
    return fresh;
  }

  /** The state of one person with its own threshold (0..1): people change one by one, not all at once. */
  static personState(warmth: number, threshold: number): 'grumpy' | 'neutral' | 'kind' | 'warm' {
    const d = warmth - threshold;
    if (d < -0.2) return 'grumpy';
    if (d < 0.05) return 'neutral';
    if (d < 0.35) return 'kind';
    return 'warm';
  }

  snapshot(): { mood: Mood; events: WorldEvent[]; connections: number } {
    return { mood: { ...this.mood }, events: [...this.events], connections: this.connections };
  }

  restore(s: { mood?: Partial<Mood>; events?: unknown[]; connections?: number } | null | undefined): void {
    if (!s) return;
    this.mood = { ...START_MOOD };
    for (const k of Object.keys(START_MOOD) as (keyof Mood)[]) {
      const v = s.mood?.[k];
      if (typeof v === 'number' && Number.isFinite(v)) this.mood[k] = clamp(v);
    }
    this.events = (s.events ?? []).filter(isWorldEvent);
    this.connections = Math.max(0, Math.min(3, Math.round(Number(s.connections) || 0)));
  }
}
