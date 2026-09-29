import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler, { cleanBody, LIMITS, rateLimited, resetRateLimit, SYSTEM_PROMPT } from '../../api/reflect';

function mockRes() {
  const r = { code: 0, body: '', headers: {} as Record<string, string> };
  const res = {
    status(c: number) {
      r.code = c;
      return res;
    },
    setHeader(k: string, v: string) {
      r.headers[k] = v;
    },
    send(b: string) {
      r.body = b;
    },
  };
  return { r, res };
}

const good = { type: 'money', form: 'slot machine', step: 'place', history: [], chip: 'I want it', freeText: 'secret words here' };

describe('api/reflect', () => {
  const logs: string[] = [];
  beforeEach(() => {
    resetRateLimit();
    logs.length = 0;
    vi.spyOn(console, 'info').mockImplementation((...a) => void logs.push(a.join(' ')));
    vi.spyOn(console, 'log').mockImplementation((...a) => void logs.push(a.join(' ')));
    vi.spyOn(console, 'error').mockImplementation((...a) => void logs.push(a.join(' ')));
    process.env.OPENROUTER_API_KEY = 'test-key';
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENROUTER_API_KEY;
  });

  it('contains the full system prompt rules', () => {
    expect(SYSTEM_PROMPT).toContain('Ask exactly one question, max 14 words.');
    expect(SYSTEM_PROMPT).toContain('{"crisis": true}');
  });

  it('rejects wrong methods, big bodies and bad bodies', async () => {
    let m = mockRes();
    await handler({ method: 'GET', headers: {} }, m.res);
    expect(m.r.code).toBe(405);
    m = mockRes();
    await handler({ method: 'POST', headers: { 'content-length': '5000' }, body: good }, m.res);
    expect(m.r.code).toBe(400);
    m = mockRes();
    await handler({ method: 'POST', headers: {}, body: { ...good, freeText: 'x'.repeat(5000) } }, m.res);
    expect(m.r.code).toBe(400);
    m = mockRes();
    await handler({ method: 'POST', headers: {}, body: { ...good, step: 'other' } }, m.res);
    expect(m.r.code).toBe(400);
  });

  it('returns the model JSON unchanged and never logs the body', async () => {
    const content = '{"question":"What would winning give you?"}';
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const m = mockRes();
    await handler({ method: 'POST', headers: { host: 'x.test' }, body: good }, m.res);
    expect(m.r.code).toBe(200);
    expect(m.r.body).toBe(content);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    const sent = JSON.parse(String(init.body));
    expect(sent.model).toBe('meta-llama/llama-3.3-70b-instruct:nitro');
    expect(sent.temperature).toBe(0.6);
    expect(sent.max_tokens).toBe(300);
    expect((init.headers as Record<string, string>)['X-Title']).toBe('Light Within');
    expect(logs.join('\n')).not.toContain('secret words');
    expect(logs.join('\n')).toMatch(/reflect 200 \d+ms/);
    vi.unstubAllGlobals();
  });

  it('answers 503 without a key, 502 on upstream errors', async () => {
    delete process.env.OPENROUTER_API_KEY;
    let m = mockRes();
    await handler({ method: 'POST', headers: {}, body: good }, m.res);
    expect(m.r.code).toBe(503);
    process.env.OPENROUTER_API_KEY = 'k';
    vi.stubGlobal('fetch', vi.fn(async () => new Response('x', { status: 500 })));
    m = mockRes();
    await handler({ method: 'POST', headers: {}, body: good }, m.res);
    expect(m.r.code).toBe(502);
    vi.unstubAllGlobals();
  });

  it('rate limits 30 requests per 10 minutes per IP', () => {
    for (let i = 0; i < LIMITS.perWindow; i++) expect(rateLimited('1.2.3.4', 1000 + i)).toBe(false);
    expect(rateLimited('1.2.3.4', 2000)).toBe(true);
    expect(rateLimited('5.6.7.8', 2000)).toBe(false);
    expect(rateLimited('1.2.3.4', 1000 + LIMITS.windowMs + 100)).toBe(false);
  });

  it('cleans the body to known fields', () => {
    expect(cleanBody({ ...good, extra: 'no' })).toEqual({ ...good, history: [] });
    expect(cleanBody('not json')).toBeNull();
    expect(cleanBody(JSON.stringify(good))).not.toBeNull();
  });
});
