import {go,record} from './helpers';
import {selectCategory} from './helpers';
import {logFilters,logActions} from './helpers';
import {logMonth} from './helpers';
import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';
test('daily entry, correction, category rename/archive, reporting and Excel download', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/demo/overview');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  await go(page,'Categories'); await page.locator('.workspace-primary').getByRole('button', { name: 'Add category', exact: true }).click();
  await page.getByLabel('Name', { exact: true }).fill('Test groceries'); await page.getByRole('button', { name: 'Save category' }).click();
  await go(page,'Money Log'); await record(page,'expense');
  await page.getByLabel('Amount', { exact: true }).fill('0.29'); await selectCategory(page,'Category','Test groceries'); await page.getByLabel('Date', { exact: true }).fill('2026-01-15'); await page.getByRole('dialog').getByText('More details',{exact:true}).click(); await page.getByLabel('Note', { exact: false }).fill('=1+1'); await page.getByRole('button', { name: /^Save (?:expense|income|savings|investment|withdrawal)$/ }).click();
  await logMonth(page,'2026','01'); await logFilters(page);await page.getByLabel('Filter category').selectOption({ label: 'Test groceries' });
  await expect(page.getByText('PKR 0.29', { exact: true }).first()).toBeVisible();
  await entryAction(page, 'Edit entry Test groceries 2026-01-15'); await page.getByLabel('Amount', { exact: true }).fill('0.39'); await page.getByRole('button', { name: /^Save (?:expense|income|savings|investment|withdrawal)$/ }).click();
  await expect(page.getByText('PKR 0.39', { exact: true }).first()).toBeVisible();
  const download = page.waitForEvent('download'); await logActions(page);await page.getByRole('button', { name: 'Export Excel' }).click(); expect((await download).suggestedFilename()).toBe('paisatrace-2026-01.xlsx');
  await go(page,'Categories'); await page.getByRole('button', { name: 'Edit Test groceries', exact: true }).click(); await page.getByLabel('Name', { exact: true }).fill('My groceries'); await page.getByRole('button', { name: 'Save category' }).click();
  await page.getByRole('button', { name: 'Archive My groceries', exact: true }).click(); await expect(page.getByRole('heading', { name: 'Archive this category?' })).toBeVisible(); await page.getByRole('button', { name: 'Archive category',exact:true }).click();
  await go(page,'Money Log'); await expect(page.getByText('My groceries · archived', { exact: true })).toBeVisible();
  await page.reload(); await go(page,'Money Log'); await logMonth(page,'2026','01'); await page.getByLabel('Search entries').fill('=1+1');
  await expect(page.getByText('My groceries · archived', { exact: true })).toBeVisible();
  await entryAction(page, 'Remove entry My groceries 2026-01-15'); await page.getByRole('button', { name: 'Remove entry',exact:true }).click(); await expect(page.getByRole('heading', { name: 'No entries match this view' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); expect(errors).toEqual([]);
});
test('planning, currency precision and viewport layout', async ({ page }) => {
  await page.goto('/demo/overview');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await go(page,'Settings'); await page.getByLabel('Default entry currency').selectOption('JPY'); await page.getByRole('button', { name: 'Save settings' }).click(); await page.getByRole('button',{name:'Confirm currency change'}).click();
  await go(page,'Money Log'); await record(page,'expense'); await selectCategory(page,'Category','Food → Groceries'); await page.getByLabel('Amount', { exact: true }).fill('1.25'); await page.getByRole('button', { name: /^Save (?:expense|income|savings|investment|withdrawal)$/ }).click(); await expect(page.getByRole('alert')).toContainText('up to 0 decimal places');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click(); await page.getByRole('button',{name:'Discard changes',exact:true}).click(); expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('PKR defaults and multiple entries on the same day survive reload', async ({ page }) => {
  await page.goto('/demo/overview');
  await go(page,'Money Log');
  for (const note of ['First same-day expense', 'Second same-day expense']) {
    await record(page,'expense');
    await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Currency', exact: true })).toHaveValue('PKR');
    await selectCategory(page,'Category','Food → Groceries'); await page.getByLabel('Amount', { exact: true }).fill('125.50'); await page.getByLabel('Date', { exact: true }).fill('2026-02-03'); await page.getByRole('dialog').getByText('More details',{exact:true}).click(); await page.getByLabel('Note', { exact: false }).fill(note); await page.getByRole('button', { name: /^Save (?:expense|income|savings|investment|withdrawal)$/ }).click(); await expect(page.getByRole('dialog')).not.toBeVisible();
  }
  await page.reload(); await go(page,'Money Log'); await logMonth(page,'2026','02');
  await expect(page.getByText('First same-day expense', { exact: true })).toBeVisible(); await expect(page.getByText('Second same-day expense', { exact: true })).toBeVisible(); await expect(page.getByText('PKR 125.50',{exact:true})).toHaveCount(2);
});
