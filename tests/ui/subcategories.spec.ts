import {changeType} from './helpers';
import {go,record} from './helpers';
import {selectCategory} from './helpers';
import {logMonth} from './helpers';

import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';

test('optional expense subcategories persist and keep parent totals', async ({ page }) => {
  await page.goto('/demo/overview');
  await go(page,'Categories');
  await page.locator('.compact-category-family').filter({has:page.getByText('Home',{exact:true})}).locator('summary').filter({hasText:'Subcategories'}).click();
  await page.getByRole('button', { name: 'Add subcategory to Home', exact: true }).click();
  await page.getByLabel('Subcategory name').fill('Utilities');
  await page.getByRole('button', { name: 'Save subcategory', exact: true }).click();
  await go(page,'Overview');
  await record(page,'expense'); await selectCategory(page,'Category','Home → Utilities');
  await expect(page.getByLabel('Subcategory (optional)', { exact: true })).toHaveCount(0);
  await page.getByLabel('Amount', { exact: true }).fill('50');
  await page.getByLabel('Date', { exact: true }).fill('2026-03-04');
  await page.getByRole('button', { name: /^Save (?:expense|income|savings|investment|withdrawal)$/, exact: true }).click();
  await expect(page.getByRole('button',{name:'View entry',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'View entry',exact:true}).click();
  await expect(page.getByRole('row').filter({hasText:'Utilities'})).toContainText('Home');
  await page.reload();
  await go(page,'Money Log');
  await logMonth(page,'2026','03');
  await page.getByLabel('Search entries', { exact: true }).fill('Utilities');
  await expect(page.getByRole('row').filter({ hasText: 'Utilities' })).toContainText('Home');
  await entryAction(page,'Edit entry Home 2026-03-04');
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('Home → Utilities');
  await selectCategory(page,'Category','Transport → Petrol');
  await expect(page.getByLabel('Subcategory', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

 test('savings and investments pick subcategories and preserve parent totals',async({page})=>{
 await page.goto('/demo/overview');
 for(const [kind,choice,amount] of [['Savings','Travel savings','100'],['Investments','Stocks','200']]){
 await record(page,'expense');await changeType(page,kind==='Investments'?'Investment':kind);await selectCategory(page,'Category',kind+' → '+choice);await page.getByLabel('Amount',{exact:true}).fill(amount);await page.getByRole('button',{name:/^Save (?:expense|income|savings|investment|withdrawal)$/,exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(page.locator('.personal-record').filter({hasText:choice}).filter({hasText:'PKR '+Number(amount).toFixed(2)})).toHaveCount(1);
 }
 await entryAction(page,/^Edit entry Investments/);await expect(page.getByLabel('Investment category',{exact:true})).toHaveValue('Investments → Stocks');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 });
