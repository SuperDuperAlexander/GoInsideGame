import { TUNING } from '../config/tuning';
import { buildRequest, fallback, parseModelJson, validateResponse, type ReflectContext, type ReflectResult } from '../logic/reflect';
import { content } from './content';
import { flags } from './flags';
import { memory } from './save';

export type AiMode = 'live' | 'fallback' | 'off';
let mode: AiMode = flags.noai ? 'off' : 'fallback';

export function aiMode(): AiMode {
  return mode;
}

/** True when the player's words may be sent (consent given and AI not switched off). */
export function aiAllowed(): boolean {
  return !flags.noai && memory.data.aiConsent === true;
}

/**
 * Ask the disturbance's next question. Sends to /api/reflect only with consent; any error, bad JSON
 * or a 6 s timeout falls back to the offline tables. The player never sees an error.
 */
export async function reflect(ctx: ReflectContext): Promise<ReflectResult> {
  const tables = content().fallback;
  if (!aiAllowed()) {
    mode = flags.noai || memory.data.aiConsent === false ? 'off' : 'fallback';
    return fallback(tables, ctx);
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TUNING.ai.timeoutMs);
  try {
    const res = await fetch('/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequest(ctx)),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = parseModelJson(await res.text());
    const out = validateResponse(tables, ctx.step, json);
    if (!out) throw new Error('invalid');
    mode = 'live';
    // The fallback key is still needed for the follow-up tables.
    if (ctx.step === 'place' && !out.crisis) out.placeKey = fallback(tables, ctx).placeKey;
    return out;
  } catch {
    mode = 'fallback';
    return fallback(tables, ctx);
  } finally {
    clearTimeout(timer);
  }
}
