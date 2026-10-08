import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';
test('daily entry, correction, category rename/archive, reporting and Excel download', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/'); await page.getByRole('button', { name: 'Explore the demo' }).click();
  await expect(page.getByRole('heading', { name: 'Your money, at a glance.' })).toBeVisible();
  await page.getByRole('button', { name: 'Categories', exact: true }).click(); await page.getByRole('button', { name: 'Add category', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Test groceries'); await page.getByRole('button', { name: 'Save category' }).click();
  await page.getByRole('button', { name: 'Money Log', exact: true }).click(); await page.getByRole('button', { name: 'Add entry', exact: true }).first().click();
  await page.getByLabel('Amount', { exact: true }).fill('0.29'); await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Test groceries' }); await page.getByLabel('Date', { exact: true }).fill('2026-01-15'); await page.getByRole('dialog').getByText('More details',{exact:true}).click(); await page.getByLabel('Note', { exact: false }).fill('=1+1'); await page.getByRole('button', { name: 'Save entry' }).click();
  await page.getByLabel('Year', { exact: true }).selectOption('2026'); await page.getByLabel('Month', { exact: true }).selectOption('01'); await page.getByLabel('Filter category').selectOption({ label: 'Test groceries' });
  await expect(page.getByText('PKR 0.29', { exact: true }).first()).toBeVisible();
  await entryAction(page, 'Edit entry Test groceries 2026-01-15'); await page.getByLabel('Amount', { exact: true }).fill('0.39'); await page.getByRole('button', { name: 'Save entry' }).click();
  await expect(page.getByText('PKR 0.39', { exact: true }).first()).toBeVisible();
  const download = page.waitForEvent('download'); await page.getByRole('button', { name: 'Export Excel' }).click(); expect((await download).suggestedFilename()).toBe('paisatrace-2026-01.xlsx');
  await page.getByRole('button', { name: 'Categories', exact: true }).click(); await page.getByRole('button', { name: 'Edit Test groceries', exact: true }).click(); await page.getByLabel('Name', { exact: true }).fill('My groceries'); await page.getByRole('button', { name: 'Save category' }).click();
  await page.getByRole('button', { name: 'Archive My groceries', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Archive this category?' })).toBeVisible(); await page.getByRole('button', { name: 'Archive category',exact:true }).click();
  await page.getByRole('button', { name: 'Money Log', exact: true }).click(); await expect(page.getByText('My groceries · archived', { exact: true })).toBeVisible();
  await page.reload(); await page.getByRole('button', { name: 'Explore the demo' }).click(); await page.getByRole('button', { name: 'Money Log', exact: true }).click(); await page.getByLabel('Year', { exact: true }).selectOption('2026'); await page.getByLabel('Month', { exact: true }).selectOption('01'); await page.getByLabel('Search entries').fill('=1+1');
  await expect(page.getByText('My groceries · archived', { exact: true })).toBeVisible();
  await entryAction(page, 'Delete entry My groceries 2026-01-15'); await page.getByRole('button', { name: 'Delete entry',exact:true }).click(); await expect(page.getByRole('heading', { name: 'No entries match this view' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); expect(errors).toEqual([]);
});
test('planning, currency precision and viewport layout', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore the demo' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Goals', exact: true }).click(); await page.getByLabel('Earnings target').fill('100'); await page.getByLabel('Expense limit').fill('120'); await page.getByRole('button', { name: 'Save monthly goals' }).click(); await expect(page.getByText(/Your goals exceed your earnings target/)).toBeVisible();
  await page.getByRole('button', { name: 'Settings', exact: true }).click(); await page.getByLabel('Default entry currency').selectOption('JPY'); await page.getByRole('button', { name: 'Save settings' }).click(); await page.getByRole('button',{name:'Confirm currency change'}).click();
  await page.getByRole('button', { name: 'Money Log', exact: true }).click(); await page.getByRole('button', { name: 'Add entry', exact: true }).first().click(); await page.getByLabel('Category',{exact:true}).selectOption({label:'Food → Groceries'}); await page.getByLabel('Amount', { exact: true }).fill('1.25'); await page.getByRole('button', { name: 'Save entry' }).click(); await expect(page.getByRole('alert')).toContainText('up to 0 decimal places');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('PKR defaults and multiple entries on the same day survive reload', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.getByRole('button', { name: 'Money Log', exact: true }).click();
  for (const note of ['First same-day expense', 'Second same-day expense']) {
    await page.getByRole('button', { name: 'Add entry', exact: true }).first().click();
    await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Currency', exact: true })).toHaveValue('PKR');
    await page.getByLabel('Category',{exact:true}).selectOption({label:'Food → Groceries'}); await page.getByLabel('Amount', { exact: true }).fill('125.50'); await page.getByLabel('Date', { exact: true }).fill('2026-02-03'); await page.getByRole('dialog').getByText('More details',{exact:true}).click(); await page.getByLabel('Note', { exact: false }).fill(note); await page.getByRole('button', { name: 'Save entry' }).click(); await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  await page.reload(); await page.getByRole('button', { name: 'Explore the demo' }).click(); await page.getByRole('button', { name: 'Money Log', exact: true }).click(); await page.getByLabel('Year', { exact: true }).selectOption('2026'); await page.getByLabel('Month', { exact: true }).selectOption('02');
  await expect(page.getByText('First same-day expense', { exact: true })).toBeVisible(); await expect(page.getByText('Second same-day expense', { exact: true })).toBeVisible(); await expect(page.getByText('PKR 125.50',{exact:true})).toHaveCount(2);
});
