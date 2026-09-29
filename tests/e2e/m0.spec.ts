import { expect, test } from '@playwright/test';
import { expectClean, shot, watch } from './helpers';

test('M0 start screen shows title and build stamp', async ({ page }, info) => {
  const w = watch(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Light Within' })).toBeVisible();
  await expect(page.getByTestId('stamp')).toContainText(/build [0-9a-f]{7}|build dev/);
  await shot(page, info, 'M0', 'start');
  expectClean(w);
});
