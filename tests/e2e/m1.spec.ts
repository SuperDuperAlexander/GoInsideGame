import { expect, test } from '@playwright/test';
import { expectClean, lw, shot, waitState, watch } from './helpers';

test('M1 walk', async ({ page }, info) => {
  const w = watch(page);
  await page.goto('/?debug');
  await expect(page.getByTestId('begin')).toBeVisible();
  await shot(page, info, 'M1', 'start');
  await page.getByTestId('begin').click();
  await waitState(page, 'outer');
  const before = await lw<{ x: number; z: number }>(page, 'stats');
  if (info.project.name === 'mobile') {
    const box = page.viewportSize()!;
    const x = box.width * 0.25;
    const y = box.height * 0.75;
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
    for (let i = 1; i <= 10; i++)
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - i * 6, id: 1 }] });
    await page.waitForTimeout(2000);
    await shot(page, info, 'M1', 'walk-mobile');
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(2000);
    await page.keyboard.up('KeyW');
    await shot(page, info, 'M1', 'walk-desktop');
  }
  const after = await lw<{ x: number; z: number; drawCalls: number; fps: number }>(page, 'stats');
  expect(after.z - before.z).toBeGreaterThan(2);
  console.info(`[${info.project.name}] stats`, JSON.stringify(after));
  expectClean(w);
});
