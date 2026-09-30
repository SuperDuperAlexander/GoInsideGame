import { TUNING } from '../config/tuning';
import type { ChipKey, FallbackTables } from './contentTypes';
import { isCrisis } from './safety';
import { validateSceneSpec, type SceneSpec } from './sceneSpec';
import { cleanText, hasKeyword } from './text';

export type ReflectStep = 'place' | 'theme';

export interface ReflectContext {
  type: string;
  form: string;
  step: ReflectStep;
  history: { q: string; a: string }[];
  /** Chip text the player tapped, if any. */
  chip: string | null;
  /** The player's own words, if any. */
  freeText: string | null;
  /** Round 1 chip key found so far (fallback needs it in round 2). */
  placeKey?: ChipKey;
}

export interface ReflectResult {
  question: string | null;
  chips: string[];
  theme: string | null;
  sceneSpec: SceneSpec | null;
  seed: string | null;
  /** The round 1 fallback key (for the follow-up question). */
  placeKey?: ChipKey;
  crisis?: boolean;
  source: 'ai' | 'fallback';
}

export const OTHER_THEME = 'Something else';

/** The body sent to /api/reflect. Only what the prompt needs. */
export function buildRequest(ctx: ReflectContext): Record<string, unknown> {
  return {
    type: ctx.type,
    form: ctx.form,
    step: ctx.step,
    history: ctx.history.slice(-3).map((h) => ({ q: cleanText(h.q, 160), a: cleanText(h.a, 200) })),
    chip: ctx.chip ? cleanText(ctx.chip, 40) : null,
    freeText: ctx.freeText ? cleanText(ctx.freeText, TUNING.ai.textMax) : null,
  };
}

/** Round 1: find the chip key for text (chip text or own words). Longest keyword wins. */
export function matchPlaceKey(tables: FallbackTables, text: string, type?: string): ChipKey {
  const t = text.toLowerCase().replace(/[’‘]/g, "'");
  const own = type ? tables.round1.byType?.[type] : undefined;
  if (own) for (const key of tables.round1.chips) if (own[key]?.toLowerCase() === t.trim()) return key;
  for (const key of tables.round1.chips) if (tables.round1.text[key].toLowerCase() === t.trim()) return key;
  let best: ChipKey = 'unsure';
  let bestLen = 0;
  for (const key of tables.round1.chips) {
    for (const kw of tables.round1.keywords[key]) {
      if (kw.length > bestLen && hasKeyword(t, kw)) {
        best = key;
        bestLen = kw.length;
      }
    }
  }
  return best;
}

/** Round 2: map text to a theme from the list. Unknown → "Something else". */
export function matchTheme(tables: FallbackTables, text: string): string {
  const t = text.toLowerCase().trim();
  const exact = tables.themeList.find((th) => th.toLowerCase() === t);
  if (exact) return exact;
  let best = OTHER_THEME;
  let bestLen = 0;
  for (const [theme, kws] of Object.entries(tables.round2.keywords)) {
    for (const kw of kws) {
      if (kw.length > bestLen && hasKeyword(t, kw)) {
        best = theme;
        bestLen = kw.length;
      }
    }
  }
  return best;
}

export function normaliseTheme(tables: FallbackTables, v: unknown): string {
  if (typeof v !== 'string') return OTHER_THEME;
  const found = tables.themeList.find((th) => th.toLowerCase() === v.trim().toLowerCase());
  return found ?? OTHER_THEME;
}

export function seedFromTheme(tables: FallbackTables, theme: string): string {
  return tables.seedTemplate.replace('{theme}', theme.toLowerCase());
}

/** A seed from the player's own words: first sentence, max 12 words. */
export function seedFromWords(text: string): string | null {
  const first = text.split(/[.!?\n]/)[0]?.trim() ?? '';
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length < 2) return null;
  let s = words.slice(0, 12).join(' ');
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return /[.!?]$/.test(s) ? s : `${s}.`;
}

/** The chips that answer a type's soul question (falls back to the general chips). */
export function soulChips(tables: FallbackTables, type: string): string[] {
  const own = tables.round1.byType?.[type];
  return tables.round1.chips.map((k) => own?.[k] ?? tables.round1.text[k]);
}

/** The follow-up question for a type and chip key. */
export function followUp(tables: FallbackTables, type: string, key: ChipKey): string {
  return tables.round2.byType?.[type]?.[key] ?? tables.round2.question[key];
}

/** The offline answer. Always valid, for every type × chip × theme. */
export function fallback(tables: FallbackTables, ctx: ReflectContext): ReflectResult {
  const answer = ctx.freeText || ctx.chip || '';
  if (ctx.step === 'place') {
    const key = matchPlaceKey(tables, answer, ctx.type);
    return {
      question: followUp(tables, ctx.type, key),
      chips: [...tables.round2.themes[key], OTHER_THEME],
      theme: null,
      sceneSpec: structuredCloneSpec(tables.round1.scene[key]),
      seed: null,
      placeKey: key,
      source: 'fallback',
    };
  }
  const theme = matchTheme(tables, answer);
  const own = ctx.freeText ? seedFromWords(ctx.freeText) : null;
  return {
    question: null,
    chips: [],
    theme,
    sceneSpec: null,
    seed: own ?? seedFromTheme(tables, theme),
    placeKey: ctx.placeKey,
    source: 'fallback',
  };
}

function structuredCloneSpec(s: SceneSpec): SceneSpec {
  return { place: s.place, parts: [...s.parts], hardElement: s.hardElement, lightLevel: s.lightLevel };
}

/** Validates the model's JSON. Returns null when anything is off (then the fallback is used). */
export function validateResponse(
  tables: FallbackTables,
  step: ReflectStep,
  json: unknown,
): ReflectResult | null {
  if (!json || typeof json !== 'object') return null;
  const o = json as Record<string, unknown>;
  if (o.crisis === true)
    return { question: null, chips: [], theme: null, sceneSpec: null, seed: null, crisis: true, source: 'ai' };
  const { questionMax, chipMax, chipsMin, chipsMax } = TUNING.ai;
  if (step === 'place') {
    if (typeof o.question !== 'string') return null;
    const q = cleanText(o.question, 1000);
    if (!q || q.length > questionMax || !q.endsWith('?') || (q.match(/\?/g) ?? []).length > 1) return null;
    if (!Array.isArray(o.chips)) return null;
    const chips = o.chips.map((c) => (typeof c === 'string' ? cleanText(c, 1000) : ''));
    if (chips.length < chipsMin || chips.length > chipsMax) return null;
    if (chips.some((c) => !c || c.length > chipMax)) return null;
    const spec = validateSceneSpec(o.sceneSpec);
    if (!spec) return null;
    if (isCrisis(q) || chips.some(isCrisis)) return null;
    const finalChips = [...new Set(chips)];
    if (!finalChips.some((c) => c.toLowerCase() === OTHER_THEME.toLowerCase()) && finalChips.length < chipsMax)
      finalChips.push(OTHER_THEME);
    return { question: q, chips: finalChips, theme: null, sceneSpec: spec, seed: null, source: 'ai' };
  }
  const theme = normaliseTheme(tables, o.theme);
  let seed: string | null = null;
  if (typeof o.seed === 'string') {
    const s = cleanText(o.seed, 1000);
    if (s && s.length <= 140 && s.split(' ').length <= 16 && !isCrisis(s)) seed = s;
  }
  if (!seed) seed = seedFromTheme(tables, theme);
  return { question: null, chips: [], theme, sceneSpec: null, seed, source: 'ai' };
}

/** Strip ```json fences and parse. */
export function parseModelJson(text: string): unknown {
  const t = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf('{');
    const b = t.lastIndexOf('}');
    if (a >= 0 && b > a) {
      try {
        return JSON.parse(t.slice(a, b + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
