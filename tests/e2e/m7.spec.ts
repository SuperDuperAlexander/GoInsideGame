import { expect, test, type Page } from '@playwright/test';
import { APPROACH, clearSave, expectClean, lw, shot, waitState, waitStep, watch } from './helpers';

const PLACE = {
  question: 'What would the screen give you tonight?',
  chips: ['Rest', 'Being seen', 'Belonging', 'Peace'],
  theme: null,
  sceneSpec: { place: 'restless', parts: ['openSpace', 'water', 'light', 'particles'], hardElement: 'water', lightLevel: 0.5 },
  seed: null,
};
const THEME = { question: null, chips: [], theme: 'Belonging', sceneSpec: null, seed: 'Behind the screen, I want to belong.' };

async function inside(page: Page) {
  await clearSave(page);
  await page.goto('/?autostart&autopick&debug');
  await waitState(page, 'opening');
  await lw(page, 'breathe');
  await waitState(page, 'outer');
  const [x, z, h] = APPROACH[1];
  await lw(page, 'teleport', x, z, h);
  await waitState(page, 'choosing');
  await page.getByTestId('choice-within').click();
  await lw(page, 'breathe');
  await waitState(page, 'inner');
  await waitStep(page, 'soul');
  await page.getByTestId('soul-ask').click();
  await waitStep(page, 'answer');
}

async function ownWords(page: Page, text: string, allow = true, shotName?: string, info?: import('@playwright/test').TestInfo) {
  await page.getByTestId('chip-own').click();
  await expect(page.getByTestId('consent')).toBeVisible();
  if (shotName && info) await shot(page, info, 'M7', shotName);
  await page.getByTestId(allow ? 'consent-yes' : 'consent-no').click();
  await page.getByTestId('own-words').fill(text);
  await page.getByTestId('say-it').click();
}

test('M7 ai good response', async ({ page }, info) => {
  const w = watch(page);
  const bodies: string[] = [];
  await page.route('**/api/reflect', async (route) => {
    const body = route.request().postData() ?? '';
    bodies.push(body);
    const step = JSON.parse(body).step;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(step === 'place' ? PLACE : THEME) });
  });
  await inside(page);
  await ownWords(page, 'I keep scrolling, I want to feel close to people', true, 'consent', info);
  await waitStep(page, 'answer2');
  await expect(page.getByTestId('question')).toHaveText(PLACE.question);
  expect(await lw<string>(page, 'hardElement')).toBe('water');
  expect((await lw<{ AI: string }>(page, 'stats')).AI).toBe('live');
  await page.waitForTimeout(1500);
  await shot(page, info, 'M7', 'ai-question');
  await page.getByTestId('chip-2').click();
  await waitStep(page, 'heart');
  expect(await lw<string>(page, 'theme')).toBe('Belonging');
  expect(bodies.length).toBe(2);
  expect(JSON.parse(bodies[0])).toMatchObject({ type: 'phone', step: 'place', freeText: 'I keep scrolling, I want to feel close to people' });
  expectClean(w);
});

test('M7 ai bad JSON falls back', async ({ page }) => {
  const w = watch(page);
  await page.route('**/api/reflect', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"question": 7, oops' }));
  await inside(page);
  await ownWords(page, 'I want it so much');
  await waitStep(page, 'answer2');
  await expect(page.getByTestId('question')).toHaveText('What would having it give you?');
  expect((await lw<{ AI: string }>(page, 'stats')).AI).toBe('fallback');
  expectClean(w);
});

test('M7 ai timeout falls back', async ({ page }) => {
  test.setTimeout(240_000);
  const w = watch(page);
  await page.route('**/api/reflect', async (route) => {
    await new Promise((r) => setTimeout(r, 9000));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PLACE) }).catch(() => undefined);
  });
  await inside(page);
  await ownWords(page, 'I am afraid to lose it');
  await waitStep(page, 'answer2', 30_000);
  await expect(page.getByTestId('question')).toHaveText('What are you afraid of losing?');
  expectClean(w);
});

test('M7 ai crisis from the model shows help', async ({ page }) => {
  const w = watch(page);
  await page.route('**/api/reflect', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"crisis": true}' }));
  await inside(page);
  await ownWords(page, 'everything is heavy lately');
  await expect(page.getByTestId('help-panel')).toBeVisible();
  await waitState(page, 'help');
  await page.getByTestId('help-return').click();
  await waitState(page, 'outer');
  const ds = await lw<{ phase: string }[]>(page, 'disturbances');
  expect(ds[1].phase).not.toBe('connected');
  expectClean(w);
});

test('M7 local crisis check sends nothing and stores nothing', async ({ page }, info) => {
  const w = watch(page);
  let calls = 0;
  await page.route('**/api/reflect', (route) => {
    calls++;
    return route.fulfill({ status: 200, body: JSON.stringify(PLACE) });
  });
  await inside(page);
  await ownWords(page, 'sometimes I want to die');
  await expect(page.getByTestId('help-panel')).toBeVisible();
  await shot(page, info, 'M7', 'help-panel');
  expect(calls).toBe(0);
  const mem = await lw<{ fragments: string[] }>(page, 'memory');
  expect(mem.fragments).toEqual([]);
  await page.getByTestId('help-return').click();
  await waitState(page, 'outer');
  expectClean(w);
});
