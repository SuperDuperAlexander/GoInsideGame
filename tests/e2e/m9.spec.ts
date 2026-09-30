import { expect, test } from '@playwright/test';
import { APPROACH, clearSave, expectClean, journey, lw, shot, waitState, watch } from './helpers';

test('M9 full', async ({ page }, info) => {
  test.setTimeout(1_200_000);
  const w = watch(page);
  await clearSave(page);
  await page.goto('/?noai&debug');
  await shot(page, info, 'final', 'start');
  await page.getByTestId('begin').click();
  for (const t of ['recognition', 'closedDoor', 'house']) await page.getByTestId(`card-${t}`).click();
  await shot(page, info, 'final', 'picker');
  await page.getByTestId('picker-continue').click();
  await waitState(page, 'opening');
  await page.waitForTimeout(600);
  await shot(page, info, 'final', 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
  await page.waitForTimeout(2000);
  await shot(page, info, 'final', 'walk');
  for (let lane = 0; lane < 3; lane++) {
    await journey(page, lane, {
      chip: lane * 2,
      onStep: async (s) => {
        if (s === 'answer2' && lane === 0) {
          await page.waitForTimeout(1200);
          await shot(page, info, 'final', 'inner-question');
        }
      },
    });
    if (lane === 0) {
      await page.waitForTimeout(3000);
      await shot(page, info, 'final', 'after-1');
    }
  }
  await lw(page, 'teleport', 0, -20, 0);
  await page.waitForTimeout(6000);
  await shot(page, info, 'final', 'town-colour');
  const stats = await lw<{ drawCalls: number; activeMeshes: number }>(page, 'stats');
  expect(stats.drawCalls).toBeLessThan(100);
  expect(stats.activeMeshes).toBeLessThan(400);
  await lw(page, 'teleport', 0, 26, 0);
  await page.waitForTimeout(2000);
  await shot(page, info, 'final', 'gate-open');
  await page.keyboard.down('KeyW');
  await waitState(page, 'chapterEnd', 60_000);
  await page.keyboard.up('KeyW');
  await expect(page.getByTestId('chapter-end')).toBeVisible({ timeout: 20_000 });
  await shot(page, info, 'final', 'chapter-end');
  console.info(`[${info.project.name}] final stats`, JSON.stringify(stats));
  expectClean(w);
});

test('M9 keyboard only', async ({ page }, info) => {
  test.skip(info.project.name === 'mobile');
  const w = watch(page);
  await clearSave(page);
  await page.goto('/?noai');
  await expect(page.getByTestId('begin')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('card-money')).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('picker-continue')).toBeVisible();
  await page.getByTestId('picker-continue').focus();
  await page.keyboard.press('Enter');
  await waitState(page, 'opening');
  // Nothing to press: the guided breath clears the opening by itself.
  await waitState(page, 'outer', 90_000);
  const [x, z, h] = APPROACH[1];
  await lw(page, 'teleport', x, z, h);
  await waitState(page, 'choosing');
  await page.getByTestId('choice-outside').focus();
  await page.keyboard.press('Tab');
  await expect(page.getByTestId('choice-within')).toBeFocused();
  await page.keyboard.press('Enter');
  await waitState(page, 'diving');
  expectClean(w);
});
