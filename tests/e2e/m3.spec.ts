import { expect, test } from '@playwright/test';
import { clearSave, expectClean, lw, shot, waitState, watch } from './helpers';

interface D {
  type: string;
  lane: string;
  x: number;
  z: number;
  scale: number;
  pushes: number;
}

test('M3 disturbances', async ({ page }, info) => {
  const w = watch(page);
  await clearSave(page);
  // Picker by hand (screenshot), then the opening.
  await page.goto('/?debug');
  await page.getByTestId('begin').click();
  await expect(page.getByTestId('picker')).toBeVisible();
  for (const t of ['money', 'phone', 'crowd']) await page.getByTestId(`card-${t}`).click();
  await shot(page, info, 'M3', 'picker');
  await page.getByTestId('picker-continue').click();
  await waitState(page, 'opening');
  await expect(page.getByTestId('opening-word')).toHaveText('Breathe.');
  await page.waitForTimeout(600);
  await shot(page, info, 'M3', 'opening-blur');
  await lw(page, 'breathe');
  await waitState(page, 'outer');

  // The three picked types stand in the three lanes, in order.
  const ds = await lw<D[]>(page, 'disturbances');
  expect(ds.map((d) => `${d.type}@${d.lane}`)).toEqual(['money@west', 'phone@centre', 'crowd@east']);

  // Terraces are unreachable while the disturbances wait.
  const reach = await lw<{ terraces: boolean[]; gate: boolean }>(page, 'reach');
  expect(reach.terraces).toEqual([false, false, false]);
  expect(reach.gate).toBe(false);

  // Walk near the centre disturbance and push it: it grows, never breaks.
  await lw(page, 'teleport', 0, 5.8, 0);
  await page.waitForTimeout(1200);
  await shot(page, info, 'M3', 'disturbance-near');
  const before = (await lw<D[]>(page, 'disturbances'))[1];
  await page.keyboard.press('KeyE');
  expect(await lw<boolean>(page, 'push')).toBe(true);
  await page.waitForTimeout(2500);
  const after = (await lw<D[]>(page, 'disturbances'))[1];
  expect(after.pushes).toBe(before.pushes + 2);
  expect(after.scale).toBeGreaterThan(before.scale * 1.15);
  await shot(page, info, 'M3', 'disturbance-pushed');

  // Restlessness rises on zig-zag and falls when still.
  await lw(page, 'teleport', 0, -38, 0);
  const calm = await lw<number>(page, 'restlessness');
  for (let i = 0; i < 16; i++) {
    const key = i % 2 ? 'KeyA' : 'KeyD';
    await page.keyboard.down(key);
    await page.waitForTimeout(260);
    await page.keyboard.up(key);
  }
  const high = await lw<number>(page, 'restlessness');
  const pace = await lw<number>(page, 'strollerPace');
  await page.waitForTimeout(5000);
  const still = await lw<number>(page, 'restlessness');
  console.info(`[${info.project.name}] restlessness ${calm.toFixed(2)} → ${high.toFixed(2)} → ${still.toFixed(2)}, pace ${pace.toFixed(2)}`);
  expect(high).toBeGreaterThan(calm + 0.25);
  expect(still).toBeLessThan(high - 0.2);
  expectClean(w);
});
