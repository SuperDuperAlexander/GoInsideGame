import { expect, test } from '@playwright/test';
import { clearSave, expectClean, journey, lw, shot, waitState, watch } from './helpers';

interface D {
  phase: string;
  r: number;
  x: number;
}

test('M6 loop', async ({ page }, info) => {
  test.setTimeout(900_000);
  const w = watch(page);
  await clearSave(page);
  await page.goto('/?autostart&autopick&noai&debug');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');

  await journey(page, 0, { chip: 0 });
  let ds = await lw<D[]>(page, 'disturbances');
  expect(ds[0].phase).toBe('connected');
  expect(ds[0].r).toBeLessThan(1);
  await page.waitForTimeout(3500);
  await lw(page, 'teleport', -8, 0, Math.atan2(-2.1, 2.8) + Math.PI * 0);
  await page.waitForTimeout(1500);
  await shot(page, info, 'M6', 'after-1');
  expect(await lw<number>(page, 'fountain')).toBeGreaterThan(0.1);

  // Reload mid-chapter: Continue restores the changed world.
  await page.goto('/?debug&noai');
  await page.getByTestId('continue').click();
  await waitState(page, 'outer');
  ds = await lw<D[]>(page, 'disturbances');
  expect(ds.map((d) => d.phase)).toEqual(['connected', 'waiting', 'waiting']);
  expect(await lw<number>(page, 'connected')).toBe(1);

  await journey(page, 1, { chip: 3 });
  await journey(page, 2, { chip: 5 });
  ds = await lw<D[]>(page, 'disturbances');
  expect(ds.every((d) => d.phase === 'connected')).toBe(true);
  await lw(page, 'teleport', 0, -20, 0);
  await page.waitForTimeout(5000);
  await shot(page, info, 'M6', 'after-3');
  const reach = await lw<{ terraces: boolean[]; gate: boolean }>(page, 'reach');
  expect(reach.terraces).toEqual([true, true, true]);
  expect(reach.gate).toBe(true);

  await lw(page, 'teleport', 0, 25, 0);
  await page.waitForTimeout(3000);
  await shot(page, info, 'M6', 'gate-open');
  await page.keyboard.down('KeyW');
  await waitState(page, 'chapterEnd', 60_000);
  await page.keyboard.up('KeyW');
  await expect(page.getByTestId('chapter-end')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('seedbook').locator('.lw-seedcard')).toHaveCount(3);
  await shot(page, info, 'M6', 'chapter-end');
  expectClean(w);
});

test('M6 pause and settings', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile');
  const w = watch(page);
  await clearSave(page);
  await page.goto('/?autostart&autopick&noai');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
  await page.keyboard.press('Escape');
  await waitState(page, 'paused');
  await page.getByTestId('open-settings').click();
  await page.getByTestId('set-rhythm').selectOption('slow');
  await shot(page, info, 'M6', 'settings');
  await page.getByTestId('settings-back').click();
  await page.getByTestId('open-seedbook').click();
  await expect(page.getByTestId('seedbook-empty')).toBeVisible();
  await page.getByTestId('seedbook-back').click();
  await page.getByTestId('resume').click();
  await waitState(page, 'outer');
  expect((await lw<{ settings: { rhythm: string } }>(page, 'memory')).settings.rhythm).toBe('slow');
  // Forget everything.
  await page.keyboard.press('Escape');
  await page.getByTestId('open-settings').click();
  await page.getByTestId('forget').click();
  await page.getByTestId('forget-yes').click();
  await page.waitForLoadState('load');
  await expect(page.getByTestId('begin')).toBeVisible();
  expectClean(w);
});
