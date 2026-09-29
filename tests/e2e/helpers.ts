import { expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export interface Watch {
  errors: string[];
  foreign: string[];
}

/** Collects console errors/warnings and requests to other origins. */
export function watch(page: Page): Watch {
  const w: Watch = { errors: [], foreign: [] };
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') {
      const text = m.text();
      // GPU driver notes from the software renderer are not from our code.
      if (/GPU stall|swiftshader|WebGL|GL Driver|Automatic fallback/i.test(text)) return;
      w.errors.push(`${m.type()}: ${text}`);
    }
  });
  page.on('pageerror', (e) => w.errors.push(`pageerror: ${e.message}`));
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (!['localhost', '127.0.0.1'].includes(u.hostname) && u.protocol.startsWith('http')) w.foreign.push(r.url());
  });
  return w;
}

export function expectClean(w: Watch): void {
  expect(w.errors, w.errors.join('\n')).toEqual([]);
  expect(w.foreign, w.foreign.join('\n')).toEqual([]);
}

export async function shot(page: Page, info: TestInfo, milestone: string, name: string): Promise<void> {
  const dir = path.join('screenshots', milestone);
  fs.mkdirSync(dir, { recursive: true });
  const suffix = info.project.name === 'mobile' && !name.includes('mobile') ? '-mobile' : '';
  if (info.project.name === 'mobile' && name.endsWith('-desktop')) return;
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(dir, `${name}${suffix}.png`) });
}

/** Waits until the game reports a state. */
export async function waitState(page: Page, state: string, timeout = 60_000): Promise<void> {
  await page.waitForFunction((s) => (window as never as { __lw?: { state(): string } }).__lw?.state() === s, state, {
    timeout,
  });
}

export async function lw<T>(page: Page, fn: string, ...args: unknown[]): Promise<T> {
  return page.evaluate(
    ([f, a]) => {
      const api = (window as never as { __lw: Record<string, (...x: unknown[]) => unknown> }).__lw;
      return api[f as string](...(a as unknown[])) as T;
    },
    [fn, args] as const,
  );
}

export async function clearSave(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
}
