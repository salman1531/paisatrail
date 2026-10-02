import { expect, test } from '@playwright/test';
test('dashboard charts drill into a month and handle empty income without overflow', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.getByRole('heading', { name: 'Income & spending', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Where your spending goes' })).toBeVisible();
  const month = await page.getByLabel('Month', { exact: true }).inputValue();
  await page.getByRole('button', { name: /^Jan: income/ }).click();
  await expect(page.getByLabel('Month', { exact: true })).toHaveValue('01');
  await expect(page.getByRole('region', { name: 'Financial details' })).toContainText('Record positive income to calculate');
  await expect(page.getByText('No expenses in this view.', { exact: false })).toBeVisible();
  await page.getByLabel('Month', { exact: true }).selectOption(month);
  await page.getByText('View chart data', { exact: true }).click();
  await expect(page.locator('.chart-data tbody tr')).toHaveCount(12);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await expect(page.getByRole('heading', { name: 'Emergency fund', exact: true })).toBeVisible();
});
