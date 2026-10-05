import { expect, test } from '@playwright/test';
test('monthly category changes and actual versus goals update from saved entries and plans', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore the demo' }).click(); await page.getByRole('button', { name: 'Goals', exact: true }).click();
  await page.getByLabel('Goal month').fill('2026-02'); await page.getByLabel('Savings target').fill('100'); await page.getByRole('button', { name: 'Save monthly goals' }).click(); await expect(page.getByRole('status')).toContainText('2026-02'); await page.getByLabel('Goal month').fill('2026-01'); await page.getByLabel('Expense limit').fill('150'); await page.getByLabel('Savings target').fill('100'); await page.getByRole('button', { name: 'Save monthly goals' }).click();
  await page.getByRole('button', { name: 'Daily entries', exact: true }).click();
  for (const [date, kind, category, amount] of [['2025-12-05', 'Expenses', 'Expenses', '100'], ['2026-01-05', 'Expenses', 'Expenses', '200'], ['2025-12-05', 'Savings', 'Savings', '80'], ['2026-01-05', 'Savings', 'Savings', '40']]) {
    await page.getByRole('button', { name: 'Add entry', exact: true }).first().click(); await page.getByRole('radio', { name: kind, exact: true }).check(); await page.getByLabel('Category', { exact: true }).selectOption({ label: category }); await page.getByLabel('Amount', { exact: true }).fill(amount); await page.getByLabel('Date', { exact: true }).fill(date); await page.getByRole('button', { name: 'Save entry' }).click(); await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  await page.getByRole('button', { name: 'Overview', exact: true }).click(); await page.getByLabel('Year', { exact: true }).selectOption('2026'); await page.getByLabel('Month', { exact: true }).selectOption('01');
  await expect(page.getByText('January 2026 vs December 2025 · PKR', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: /^Expenses: January 2026/ })).toContainText('Up 100%');
  await page.getByLabel('Comparison type').selectOption('saving'); await expect(page.getByRole('group', { name: /^Savings: January 2026/ })).toContainText('Down 50%');
  const expense = page.getByRole('group', { name: 'Expense goal comparison', exact: true }); await expect(expense).toContainText('Over limit by PKR 50.00');
  await expect(page.getByRole('group', { name: 'Savings goal comparison', exact: true })).toContainText('above your goal');
  await page.getByLabel('Month', { exact: true }).selectOption('02'); await expect(page.getByRole('group', { name: 'Savings goal comparison', exact: true })).toContainText('PKR 100.00 to your savings goal');
  await page.getByLabel('Month', { exact: true }).selectOption('all'); await expect(page.getByText('Select a year and month to compare.', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
