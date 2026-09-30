/**
 * POST /api/reflect — the only server code. Vercel Node serverless function.
 * Calls OpenRouter with the system prompt (CONTENT §8) and returns the model JSON unchanged.
 * Never logs request bodies: only status codes and duration.
 */

interface Req {
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
  socket?: { remoteAddress?: string };
}
interface Res {
  status(code: number): Res;
  setHeader(name: string, value: string): void;
  send(body: string): void;
}

export const SYSTEM_PROMPT = `You are the voice of a "disturbance" in a calm reflective game called Light Within.
The disturbance is something from the player's own life that pulls at them or bothers them
(for example money, a phone, a person, a closed door). The player has stepped inside themselves
to meet it. You speak AS the disturbance, gently, in the first person ("me").

Your only job: ask ONE short question that helps the player look a little deeper, and choose
how their inner world looks, from a fixed kit.

Rules:
- Ask exactly one question, max 14 words. Never more than one question.
- Never give advice. Never explain. Never interpret. Never diagnose. Never praise or judge.
- Never name the player's feeling for them. Offer possible answers as short chips instead.
- Every chip must be a direct, natural answer to your own question.
- Reuse the player's own words where possible.
- No spiritual, medical or therapy vocabulary. No promises. English only.
- If the player writes about wanting to die, hurting themselves or others, do not continue the
  game: return {"crisis": true} only.

Input: JSON with type, form, step ("place" or "theme"), history, chip, freeText.

If step is "place": return
{"question": "...", "chips": [4 short options, max 4 words each], "theme": null,
 "sceneSpec": {"place": one of tight|dark|storm|restless|high|misty,
               "parts": 2-6 of fog|wall|water|light|wind|plants|cracks|canyon|door|openSpace|narrowSpace|particles,
               "hardElement": one of wall|canyon|fog|cracks|wind|water,
               "lightLevel": 0..1},
 "seed": null}
The question asks what lies behind the answer (what it would give, protect, or change).
The chips must be wishes from this list: Rest, Safety, Freedom, Being seen, Belonging, Love, Peace,
Joy, Trust, Enough.

If step is "theme": return
{"question": null, "chips": [], "theme": one word from the list above or "Something else",
 "sceneSpec": null, "seed": "one short sentence, max 12 words, in the player's own words, first person"}
The seed never promises anything and never gives advice. Example: "Behind the pull, I want rest."

Return JSON only. No other text.`;

export const LIMITS = { bodyBytes: 4096, perWindow: 30, windowMs: 10 * 60 * 1000, timeoutMs: 12000 };
const MODEL = 'meta-llama/llama-3.3-70b-instruct:nitro';
const hits = new Map<string, number[]>();

export function rateLimited(ip: string, now = Date.now()): boolean {
  const list = (hits.get(ip) ?? []).filter((t) => now - t < LIMITS.windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > LIMITS.perWindow;
}

export function resetRateLimit(): void {
  hits.clear();
}

/** Only the known fields, with their sizes checked. Returns null when the body is not acceptable. */
export function cleanBody(body: unknown): Record<string, unknown> | null {
  let o: unknown = body;
  if (typeof o === 'string') {
    if (o.length > LIMITS.bodyBytes) return null;
    try {
      o = JSON.parse(o);
    } catch {
      return null;
    }
  }
  if (!o || typeof o !== 'object' || Array.isArray(o)) return null;
  if (JSON.stringify(o).length > LIMITS.bodyBytes) return null;
  const b = o as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' && v.length <= max ? v : v == null ? null : undefined);
  const type = str(b.type, 32);
  const form = str(b.form, 64);
  const step = b.step === 'place' || b.step === 'theme' ? b.step : undefined;
  const chip = str(b.chip, 60);
  const freeText = str(b.freeText, 400);
  if (!type || !form || !step || chip === undefined || freeText === undefined) return null;
  const history = Array.isArray(b.history)
    ? b.history.slice(0, 4).map((h) => ({ q: String((h as { q?: unknown })?.q ?? '').slice(0, 200), a: String((h as { a?: unknown })?.a ?? '').slice(0, 400) }))
    : [];
  return { type, form, step, history, chip, freeText };
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const started = Date.now();
  const done = (code: number, body: string) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.status(code).send(body);
    console.info(`reflect ${code} ${Date.now() - started}ms`);
  };
  if (req.method !== 'POST') return done(405, '{"error":"method"}');
  const len = Number(req.headers['content-length'] ?? 0);
  if (len > LIMITS.bodyBytes) return done(400, '{"error":"size"}');
  const fwd = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (rateLimited(ip)) return done(429, '{"error":"rate"}');
  const body = cleanBody(req.body);
  if (!body) return done(400, '{"error":"body"}');
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return done(503, '{"error":"offline"}');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), LIMITS.timeoutMs);
  try {
    const host = req.headers['x-forwarded-host'] ?? req.headers.host ?? 'light-within.vercel.app';
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': `https://${Array.isArray(host) ? host[0] : host}`,
        'X-Title': 'Light Within',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(body) },
        ],
      }),
    });
    if (!r.ok) return done(502, '{"error":"upstream"}');
    const data = (await r.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return done(502, '{"error":"empty"}');
    // The model JSON unchanged (code fences are stripped in the browser).
    return done(200, content);
  } catch {
    return done(504, '{"error":"timeout"}');
  } finally {
    clearTimeout(timer);
  }
}
