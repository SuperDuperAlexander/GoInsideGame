import { expect, test } from '@playwright/test';
import { clearSave, expectClean, journey, lw, shot, waitState, watch } from './helpers';

interface World {
  mood: { warmth: number; light: number; care: number; storm: number };
  shown: { warmth: number; storm: number };
  events: string[];
  people: { grumpy: number; neutral: number; kind: number; warm: number };
  decorations: number;
}

test('M10 living world', async ({ page }, info) => {
  test.setTimeout(1_200_000);
  const w = watch(page);
  await clearSave(page);
  await page.goto('/?autostart&autopick&noai&debug');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
  await lw(page, 'teleport', 0, -21, 0);
  await page.waitForTimeout(2500);
  const start = await lw<World>(page, 'world');
  expect(start.mood.storm).toBe(1);
  expect(start.people.grumpy).toBeGreaterThan(3);
  expect(start.decorations).toBe(0);
  await shot(page, info, 'M10', 'town-before');

  // Connection 1 (chip 0 → first theme chip "Rest").
  await journey(page, 0, { chip: 0 });
  await lw(page, 'teleport', 0, -21, 0);
  await page.waitForFunction(() => (window as never as { __lw: { world(): World } }).__lw.world().shown.warmth > 0.15, null, { timeout: 60_000 });
  await page.waitForTimeout(4000);
  const one = await lw<World>(page, 'world');
  expect(one.mood.warmth).toBeGreaterThan(start.mood.warmth);
  expect(one.mood.storm).toBeLessThan(1);
  expect(one.events.length).toBeGreaterThan(0);
  expect(one.decorations).toBeGreaterThan(0);
  expect(one.people.grumpy).toBeLessThan(start.people.grumpy);
  await shot(page, info, 'M10', 'town-after-1');

  await journey(page, 1, { chip: 3 });
  await journey(page, 2, { chip: 5 });
  await lw(page, 'teleport', 0, -21, 0);
  await page.waitForFunction(() => (window as never as { __lw: { world(): World } }).__lw.world().shown.warmth > 0.8, null, { timeout: 90_000 });
  await page.waitForTimeout(6000);
  const three = await lw<World>(page, 'world');
  expect(three.mood.storm).toBe(0);
  expect(three.people.grumpy).toBe(0);
  expect(three.people.warm).toBeGreaterThan(3);
  expect(three.events.length).toBeGreaterThanOrEqual(5);
  const stats = await lw<{ drawCalls: number }>(page, 'stats');
  console.info(`[${info.project.name}] events ${three.events.join(',')} people ${JSON.stringify(three.people)} drawCalls ${stats.drawCalls}`);
  expect(stats.drawCalls).toBeLessThan(100);
  await shot(page, info, 'M10', 'town-after-3');
  await lw(page, 'teleport', 0, 2, 0);
  await page.waitForTimeout(2000);
  await shot(page, info, 'M10', 'lane-after-3');

  // Reload: the changed town comes back.
  await page.goto('/?debug&noai');
  await page.getByTestId('continue').click();
  await waitState(page, 'outer');
  const back = await lw<World>(page, 'world');
  expect(back.events).toEqual(three.events);
  expect(back.decorations).toBe(three.decorations);
  expectClean(w);
});
