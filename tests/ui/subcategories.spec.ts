import {openQuickExpense} from './helpers';
import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';

test('optional expense subcategories persist and keep parent totals', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await page.getByRole('button', { name: 'Add subcategory to Home', exact: true }).click();
  await page.getByLabel('Subcategory name').fill('Utilities');
  await page.getByRole('button', { name: 'Save subcategory', exact: true }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await openQuickExpense(page); await page.getByLabel('Expense category', { exact: true }).selectOption({ label: 'Utilities' });
  await expect(page.getByLabel('Subcategory (optional)', { exact: true })).toHaveCount(0);
  await page.getByLabel('Expense amount · PKR', { exact: true }).fill('50');
  await page.getByText('Change date or add a note', { exact: true }).click();
  await page.getByLabel('Expense date', { exact: true }).fill('2026-03-04');
  await page.getByRole('button', { name: 'Save expense', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Where your spending goes' })).toContainText('Utilities');
  await expect(page.getByRole('region', { name: 'Where your spending goes' })).toContainText('PKR 50.00');
  await page.reload();
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.getByRole('button', { name: 'Daily entries', exact: true }).click();
  await page.getByLabel('Month', { exact: true }).selectOption('03');
  await page.getByLabel('Search entries', { exact: true }).fill('Utilities');
  await expect(page.getByRole('row').filter({ hasText: 'Utilities' })).toContainText('Home');
  await entryAction(page,'Edit entry Home 2026-03-04');
  await expect(page.getByLabel('Category', { exact: true }).locator('option:checked')).toHaveText('Utilities');
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Petrol' });
  await expect(page.getByLabel('Subcategory', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

 test('savings and investments pick subcategories and preserve parent totals',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 for(const [kind,choice,amount] of [['Savings','Travel savings','100'],['Investments','Stocks','200']]){
 await page.getByRole('button',{name:'Add expense',exact:true}).first().click();await page.getByRole('radio',{name:kind,exact:true}).check();await page.getByLabel('Category',{exact:true}).selectOption({label:choice});await page.getByLabel('Amount',{exact:true}).fill(amount);await page.getByRole('button',{name:'Save entry',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(page.getByText(choice,{exact:true})).toBeVisible();
 }
 await entryAction(page,/^Edit entry Investments/);await expect(page.getByLabel('Category',{exact:true}).locator('option:checked')).toHaveText('Stocks');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 });
