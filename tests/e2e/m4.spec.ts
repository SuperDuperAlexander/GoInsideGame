import { expect, test } from '@playwright/test';
import { clearSave, expectClean, lw, shot, waitState, watch } from './helpers';

interface D {
  formIndex: number;
  phase: string;
}

async function toOuter(page: import('@playwright/test').Page) {
  await clearSave(page);
  await page.goto('/?autostart&autopick&noai&debug');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
}

test('M4 dive', async ({ page }, info) => {
  test.setTimeout(420_000);
  const w = watch(page);
  await toOuter(page);
  const counts: { outer: number; inner: number; materials: number; textures: number }[] = [];
  const heaps: number[] = [];
  for (let cycle = 0; cycle < 5; cycle++) {
    await lw(page, 'teleport', 0, 5.8, 0);
    await waitState(page, 'choosing');
    if (cycle === 0) await shot(page, info, 'M4', 'choice');
    await page.getByTestId('choice-within').click();
    await waitState(page, 'diving');
    const breath = lw(page, 'breathe');
    if (cycle === 0) {
      await page.waitForFunction(() => (window as never as { __lw: { stats(): { breath: number } } }).__lw.stats().breath > 0.3);
      await shot(page, info, 'M4', 'dive-mid');
    }
    await breath;
    await waitState(page, 'inner');
    if (cycle === 0) {
      await page.waitForTimeout(1200);
      await shot(page, info, 'M4', 'inner-empty');
    }
    await lw(page, 'returnNow');
    await lw(page, 'breathe');
    await waitState(page, 'outer');
    const d = (await lw<D[]>(page, 'disturbances'))[1];
    expect(d.phase).not.toBe('connected');
    await lw(page, 'teleport', 0, -8 - 9, 0);
    await page.waitForTimeout(300);
    counts.push(await lw(page, 'sceneCounts'));
    heaps.push(await lw<number>(page, 'heap'));
  }
  console.info(`[${info.project.name}] counts`, JSON.stringify(counts), 'heap MB', heaps.map((h) => (h / 1e6).toFixed(1)).join(' '));
  // No growth after 5 cycles.
  expect(counts[4]).toEqual(counts[1]);
  if (heaps[1] > 0) expect(heaps[4]).toBeLessThan(heaps[1] * 1.25 + 4e6);
  expectClean(w);
});

test('M4 stay outside cycles the form', async ({ page }, info) => {
  const w = watch(page);
  await toOuter(page);
  await lw(page, 'teleport', 0, 5.8, 0);
  await waitState(page, 'choosing');
  const before = (await lw<D[]>(page, 'disturbances'))[1].formIndex;
  await page.getByTestId('choice-outside').click();
  await waitState(page, 'outer');
  await lw(page, 'teleport', 0, -14, 0);
  await page.waitForTimeout(500);
  await lw(page, 'teleport', 0, 5.8, 0);
  await page.waitForTimeout(800);
  const after = (await lw<D[]>(page, 'disturbances'))[1].formIndex;
  expect(after).toBe((before + 1) % 3);
  await shot(page, info, 'M4', 'form-changed');
  expectClean(w);
});
