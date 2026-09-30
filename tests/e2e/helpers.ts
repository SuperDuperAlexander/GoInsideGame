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
      if (/GPU stall due to ReadPixels|Automatic fallback to software WebGL/i.test(text)) return;
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

export async function waitStep(page: Page, step: string, timeout = 90_000): Promise<void> {
  await page.waitForFunction((s) => (window as never as { __lw: { step(): string } }).__lw.step() === s, step, { timeout });
}

/** Where to stand in front of each lane's disturbance, and which way to face. */
export const APPROACH: [number, number, number][] = [
  [-9.9, 3.2, Math.atan2(-2.1, 2.8)],
  [0, 5.8, 0],
  [9.9, 3.2, Math.atan2(2.1, 2.8)],
];

/** One full Connection Loop with chips (fallback tables), from the outer world back to the outer world. */
export async function journey(page: Page, lane: number, o: { chip?: number; ownWords?: string; onStep?: (s: string) => Promise<void> } = {}): Promise<void> {
  const [x, z, h] = APPROACH[lane];
  await lw(page, 'teleport', x, z, h);
  await waitState(page, 'choosing');
  await page.getByTestId('choice-within').click();
  await lw(page, 'breathe');
  await waitState(page, 'inner');
  await waitStep(page, 'soul');
  await page.getByTestId('soul-ask').click();
  await waitStep(page, 'answer');
  if (o.ownWords) {
    await page.getByTestId('chip-own').click();
    const consent = page.getByTestId('consent-no');
    if (await consent.isVisible({ timeout: 1500 }).catch(() => false)) await consent.click();
    await page.getByTestId('own-words').fill(o.ownWords);
    await page.getByTestId('say-it').click();
  } else await page.getByTestId(`chip-${o.chip ?? 0}`).click();
  await waitStep(page, 'answer2');
  await o.onStep?.('answer2');
  await page.getByTestId('chip-0').click();
  await waitStep(page, 'heart');
  await lw(page, 'heart', 'chest');
  await waitStep(page, 'one');
  for (let i = 0; i < 3; i++) await lw(page, 'breathe');
  await waitStep(page, 'seed');
  await page.getByTestId('seed-keep').click();
  await waitStep(page, 'return');
  await waitState(page, 'outer', 60_000);
}
