import { expect, test } from '@playwright/test';
import { APPROACH, clearSave, expectClean, journey, lw, shot, waitState, watch } from './helpers';

test('M8 echo', async ({ page }, info) => {
  test.setTimeout(400_000);
  const w = watch(page);
  await clearSave(page);
  await page.goto('/?autostart&autopick&noai&debug');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
  // No words yet: no echo.
  await lw(page, 'teleport', APPROACH[1][0], APPROACH[1][1] - 3, 0);
  await page.waitForTimeout(1500);
  expect(await lw<string[]>(page, 'echoes')).toEqual([]);
  await lw(page, 'teleport', 0, -20, 0);
  await page.waitForTimeout(500);
  // Write words at disturbance 1 (west lane).
  await journey(page, 0, { ownWords: 'I never have enough, but I keep counting' });
  const mem = await lw<{ fragments: string[] }>(page, 'memory');
  expect(mem.fragments).toContain('i never have enough');
  // Pass disturbance 2 (centre lane): a fragment shows.
  await lw(page, 'teleport', 0, 3.2, 0);
  await expect(page.getByTestId('echo')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('echo')).toHaveText(/…/);
  await page.waitForTimeout(700);
  await shot(page, info, 'M8', 'echo');
  expect((await lw<string[]>(page, 'echoes')).length).toBe(1);
  expectClean(w);
});
