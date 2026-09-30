import { expect, test, type Page } from '@playwright/test';
import { clearSave, expectClean, lw, shot, waitState, watch } from './helpers';

const CHIPS = ['want', 'afraid', 'angry', 'excited', 'pushAway', 'unsure'];
const HARD: Record<string, string> = { want: 'wall', afraid: 'canyon', angry: 'cracks', excited: 'wind', pushAway: 'wall', unsure: 'fog' };

async function waitStep(page: Page, step: string) {
  await page.waitForFunction((s) => (window as never as { __lw: { step(): string } }).__lw.step() === s, step, { timeout: 90_000 });
}

async function goInside(page: Page) {
  await clearSave(page);
  await page.goto('/?autostart&autopick&noai&debug');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
  await lw(page, 'teleport', 0, 5.8, 0);
  await waitState(page, 'choosing');
  await page.getByTestId('choice-within').click();
  await lw(page, 'breathe');
  await waitState(page, 'inner');
}

test('M5 inner', async ({ page }, info) => {
  const chips = info.project.name === 'mobile' ? ['afraid'] : CHIPS;
  test.setTimeout(240_000 * chips.length);
  const w = watch(page);
  for (const chip of chips) {
    await goInside(page);
    await waitStep(page, 'soul');
    await page.getByTestId('soul-ask').click();
    await waitStep(page, 'answer');
    await expect(page.getByTestId('question')).toHaveText('What are you looking for in me?');
    await page.getByTestId(`chip-${CHIPS.indexOf(chip)}`).click();
    await waitStep(page, 'answer2');
    expect(await lw<string>(page, 'hardElement')).toBe(HARD[chip]);
    await page.getByTestId('chip-0').click();
    await waitStep(page, 'heart');
    if (chip === 'want') await page.waitForTimeout(1500);
    await lw(page, 'heart');
    await expect(page.getByTestId('body-outline')).toBeVisible();
    if (chip === 'want') await shot(page, info, 'M5', 'heart');
    await page.getByTestId('zone-chest').click();
    await waitStep(page, 'one');
    for (let i = 1; i <= 3; i++) {
      await lw(page, 'breathe');
      await page.waitForTimeout(400);
    }
    await page.waitForFunction(() => (window as never as { __lw: { progress(): number } }).__lw.progress() > 2.95, null, { timeout: 60_000 });
    await shot(page, info, 'M5', `transformed-${chip}-${HARD[chip]}`);
    const st = await lw<{ drawCalls: number }>(page, 'stats');
    console.info(`[${info.project.name}] ${chip}/${HARD[chip]} inner draw calls ${st.drawCalls}`);
    expect(st.drawCalls).toBeLessThan(40);
    await waitStep(page, 'seed');
    const seed = await page.getByTestId('seed-text').inputValue();
    expect(seed.length).toBeGreaterThan(5);
    if (chip === 'want') await shot(page, info, 'M5', 'seed');
    await page.getByTestId('seed-keep').click();
    await waitStep(page, 'return');
    const mem = await lw<{ seeds: { text: string }[]; themes: Record<string, string> }>(page, 'memory');
    expect(mem.seeds.at(-1)?.text).toBe(seed);
    expect(mem.themes.phone).toBeTruthy();
    // The hard element is still there (transformed, never gone).
    expect(await lw<string>(page, 'hardElement')).toBe(HARD[chip]);
  }
  if (info.project.name === 'desktop') {
    await lw(page, 'previewHard', 'water', 3);
    await page.waitForTimeout(2600);
    await shot(page, info, 'M5', 'transformed-water');
  }
  expectClean(w);
});
