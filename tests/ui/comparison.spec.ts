import {openBudget} from './helpers';
import { expect, test } from '@playwright/test';
test('monthly category changes and actual versus goals update from saved entries and plans', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore the demo' }).click(); await page.getByRole('button', { name: 'Goals', exact: true }).click();
  await page.getByLabel('Goal month').fill('2026-02'); await page.getByLabel('Savings target').fill('100'); await page.getByRole('button', { name: 'Save monthly goals' }).click(); await expect(page.getByRole('status')).toContainText('2026-02'); await page.getByLabel('Goal month').fill('2026-01'); await page.getByLabel('Expense limit').fill('150'); await page.getByLabel('Savings target').fill('100'); await page.getByRole('button', { name: 'Save monthly goals' }).click();
  await page.getByRole('button', { name: 'Money Log', exact: true }).click();
  for (const [date, kind, category, amount] of [['2025-12-05', 'Expenses', 'Rent', '100'], ['2026-01-05', 'Expenses', 'Rent', '200'], ['2025-12-05', 'Savings', 'Travel savings', '80'], ['2026-01-05', 'Savings', 'Travel savings', '40']]) {
    await page.getByRole('button', { name: 'Add entry', exact: true }).first().click(); await page.getByRole('radio', { name: kind, exact: true }).check(); await page.getByLabel('Category', { exact: true }).selectOption({ label: category }); await page.getByLabel('Amount', { exact: true }).fill(amount); await page.getByLabel('Date', { exact: true }).fill(date); await page.getByRole('button', { name: 'Save entry' }).click(); await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  await page.getByRole('button', { name: 'Overview', exact: true }).click(); await page.getByLabel('Year', { exact: true }).selectOption('2026'); await page.getByLabel('Month', { exact: true }).selectOption('01');
  await page.getByText('Compare with the previous month',{exact:true}).click();
  await expect(page.getByText('January 2026 vs December 2025 · PKR', { exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: /^Home: January 2026/ })).toContainText('Up 100%');
  await page.getByLabel('Comparison type').selectOption('saving'); await expect(page.getByRole('group', { name: /^Savings: January 2026/ })).toContainText('Down 50%');
  await openBudget(page);const expense = page.locator('.main-budget-row.expense'); await expect(expense).toContainText('PKR 50.00 · Over budget');
  await openBudget(page);await expect(page.locator('.main-budget-row.saving')).toContainText('PKR 60.00 · To target');
  await page.getByLabel('Month', { exact: true }).selectOption('02'); await openBudget(page);await expect(page.locator('.main-budget-row.saving')).toContainText('PKR 100.00 · To target');
  await page.getByLabel('Month', { exact: true }).selectOption('all'); await expect(page.getByText('Compare with the previous month',{exact:true})).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
