import {openBudget} from './helpers';
import {openQuickExpense} from './helpers';
import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';

test('optional expense subcategories persist and keep parent totals', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.getByRole('button', { name: 'Categories', exact: true }).click();
  await page.locator('.compact-category-family').filter({has:page.getByText('Home',{exact:true})}).locator('summary').click();
  await page.getByRole('button', { name: 'Add subcategory to Home', exact: true }).click();
  await page.getByLabel('Subcategory name').fill('Utilities');
  await page.getByRole('button', { name: 'Save subcategory', exact: true }).click();
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await openQuickExpense(page); await page.getByLabel('Expense category', { exact: true }).selectOption({ label: 'Home → Utilities' });
  await expect(page.getByLabel('Subcategory (optional)', { exact: true })).toHaveCount(0);
  await page.getByLabel('Expense amount · PKR', { exact: true }).fill('50');
  await page.getByText('Date, payment type & note', { exact: true }).click();
  await page.getByLabel('Expense date', { exact: true }).fill('2026-03-04');
  await page.getByRole('button', { name: 'Save expense', exact: true }).click();
  await openBudget(page);await page.locator('.category-budget-item').filter({has:page.getByRole('button',{name:'Home',exact:true})}).getByRole('button',{name:'Show subcategories'}).click();
  await expect(page.getByRole('region', { name: 'Expenses breakdown' })).toContainText('Utilities');
  await expect(page.getByRole('region', { name: 'Expenses breakdown' })).toContainText('PKR 50.00');
  await page.reload();
  await page.getByRole('button', { name: 'Explore the demo' }).click();
  await page.getByRole('button', { name: 'Money Log', exact: true }).click();
  await page.getByLabel('Month', { exact: true }).selectOption('03');
  await page.getByLabel('Search entries', { exact: true }).fill('Utilities');
  await expect(page.getByRole('row').filter({ hasText: 'Utilities' })).toContainText('Home');
  await entryAction(page,'Edit entry Home 2026-03-04');
  await expect(page.getByLabel('Category', { exact: true }).locator('option:checked')).toHaveText('Home → Utilities');
  await page.getByLabel('Category', { exact: true }).selectOption({ label: 'Transport → Petrol' });
  await expect(page.getByLabel('Subcategory', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

 test('savings and investments pick subcategories and preserve parent totals',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 for(const [kind,choice,amount] of [['Savings','Travel savings','100'],['Investments','Stocks','200']]){
 await page.getByRole('button',{name:'Add expense',exact:true}).first().click();await page.getByRole('radio',{name:kind,exact:true}).check();await page.getByLabel('Category',{exact:true}).selectOption({label:kind+' → '+choice});await page.getByLabel('Amount',{exact:true}).fill(amount);await page.getByRole('button',{name:'Save entry',exact:true}).click();await expect(page.getByRole('dialog')).not.toBeVisible();
 await expect(page.getByText(choice,{exact:true})).toBeVisible();
 }
 await entryAction(page,/^Edit entry Investments/);await expect(page.getByLabel('Category',{exact:true}).locator('option:checked')).toHaveText('Investments → Stocks');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 });
