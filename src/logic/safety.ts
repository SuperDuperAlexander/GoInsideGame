/** Crisis phrases (CONTENT §9). Matched as whole phrases, case- and accent-insensitive. */
export const CRISIS_PHRASES = [
  'kill myself',
  'end my life',
  'want to die',
  "don't want to live",
  'do not want to live',
  'suicide',
  'suicidal',
  'hurt myself',
  'self harm',
  'self-harm',
  'cut myself',
  'no reason to live',
  'better off dead',
  'kill him',
  'kill her',
  'kill them',
  'hurt someone',
  'umbringen',
  'mich töten',
  'suizid',
  'selbstmord',
  'nicht mehr leben',
  'will sterben',
  'möchte sterben',
  'mir etwas antun',
  'ritzen',
  'selbstverletzung',
  'keinen sinn mehr',
  'jemanden verletzen',
];

/** Lowercase, strip accents, unify apostrophes and hyphens, collapse spaces. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`´]/g, "'")
    .replace(/[-‐‑–—]/g, ' ')
    .replace(/[^a-z0-9' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PATTERNS = CRISIS_PHRASES.map((p) => {
  const n = normalise(p).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^| )${n}( |$)`);
});

export function isCrisis(text: string): boolean {
  if (!text) return false;
  const n = normalise(text);
  return PATTERNS.some((re) => re.test(n));
}
