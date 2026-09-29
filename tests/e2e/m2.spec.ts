import { expect, test } from '@playwright/test';
import { expectClean, lw, shot, waitState, watch } from './helpers';

test('M2 grey town', async ({ page }, info) => {
  const w = watch(page);
  await page.goto('/?autostart&debug');
  await waitState(page, 'outer');
  await lw(page, 'teleport', 0, -21, 0);
  await page.waitForTimeout(1500);
  await shot(page, info, 'M2', info.project.name === 'mobile' ? 'town-mobile' : 'town-grey');
  const stats = await lw<{ drawCalls: number; activeMeshes: number }>(page, 'stats');
  expect(stats.drawCalls).toBeLessThan(100);
  expect(stats.activeMeshes).toBeLessThan(400);

  // A test zone at the square grows over 3 s and is measurably brighter in greyscale.
  const before = await lw<number>(page, 'sample', 0.5, 0.35, 0.25);
  await lw(page, 'addZone', 0, -8, 9);
  await page.waitForTimeout(3600);
  const after = await lw<number>(page, 'sample', 0.5, 0.35, 0.25);
  console.info(`[${info.project.name}] zone brightness ${before.toFixed(3)} → ${after.toFixed(3)}, draw calls ${stats.drawCalls}`);
  expect(after).toBeGreaterThan(before + 0.02);
  if (info.project.name === 'desktop') await shot(page, info, 'M2', 'town-zone');
  expectClean(w);
});

test('M2 colour switch', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile');
  const w = watch(page);
  await page.goto('/?autostart&color');
  await waitState(page, 'outer');
  await lw(page, 'teleport', 0, -21, 0);
  await page.waitForTimeout(1500);
  await shot(page, info, 'M2', 'town-color');
  expectClean(w);
});
