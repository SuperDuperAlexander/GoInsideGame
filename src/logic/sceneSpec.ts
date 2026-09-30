export const PARTS = [
  'fog',
  'wall',
  'water',
  'light',
  'wind',
  'plants',
  'cracks',
  'canyon',
  'door',
  'openSpace',
  'narrowSpace',
  'particles',
] as const;
export const HARD = ['wall', 'canyon', 'fog', 'cracks', 'wind', 'water'] as const;
export const PLACES = ['tight', 'dark', 'storm', 'restless', 'high', 'misty'] as const;

export type Part = (typeof PARTS)[number];
export type Hard = (typeof HARD)[number];
export type Place = (typeof PLACES)[number];

export interface SceneSpec {
  place: Place;
  parts: Part[];
  hardElement: Hard;
  lightLevel: number;
}

export function isPart(v: unknown): v is Part {
  return typeof v === 'string' && (PARTS as readonly string[]).includes(v);
}
export function isHard(v: unknown): v is Hard {
  return typeof v === 'string' && (HARD as readonly string[]).includes(v);
}
export function isPlace(v: unknown): v is Place {
  return typeof v === 'string' && (PLACES as readonly string[]).includes(v);
}

/**
 * Validates an unknown value into a SceneSpec, or null.
 * Parts: 2–6 unique kit parts. The hard element is always among the parts (added if missing).
 */
export function validateSceneSpec(v: unknown): SceneSpec | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!isPlace(o.place) || !isHard(o.hardElement) || !Array.isArray(o.parts)) return null;
  if (!o.parts.every(isPart)) return null;
  const parts = [...new Set(o.parts as Part[])];
  if (!parts.includes(o.hardElement)) parts.push(o.hardElement);
  if (parts.length < 2 || parts.length > 6) return null;
  const light = typeof o.lightLevel === 'number' && Number.isFinite(o.lightLevel) ? o.lightLevel : 0.3;
  return { place: o.place, parts, hardElement: o.hardElement, lightLevel: Math.max(0, Math.min(1, light)) };
}
