import {openQuickExpense} from './helpers';
import { expect, test } from '@playwright/test';
test('quick expenses and independent monthly goals persist after reload',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
  await openQuickExpense(page); await page.getByLabel('Expense amount',{exact:false}).fill('12.50');
  await page.getByRole('combobox',{name:'Expense category',exact:true}).selectOption({label:'Groceries'});
  await page.getByText('Change date or add a note',{exact:true}).click();
  await page.getByLabel('Expense date',{exact:true}).fill('2026-02-03');
  await page.getByLabel('Expense note (optional)',{exact:true}).fill('Quick entry verification');
  await page.getByRole('button',{name:'Save expense',exact:true}).click();
  await expect(page.getByLabel('Month',{exact:true})).toHaveValue('02');
  await expect(page.getByText('Quick entry verification',{exact:true})).toBeVisible();
  await page.getByText('Monthly goals & category limits',{exact:true}).click();
  await page.getByRole('button',{name:'Edit goals',exact:true}).click();
  await expect(page.getByLabel('Goal month',{exact:true})).toHaveValue('2026-02');
  await page.getByLabel('Expense limit',{exact:true}).fill('10');await page.getByLabel('Earnings target',{exact:true}).fill('100');
  await page.getByLabel('Investment target',{exact:true}).fill('25');
  await page.getByText('Category spending limits (optional)',{exact:true}).click();
  await page.locator('.category-budget-editor').getByLabel('Food',{exact:true}).fill('10');
  await page.getByRole('button',{name:'Save monthly goals',exact:true}).click();
  await expect(page.getByText('Goals saved for 2026-02.',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'March 2026',exact:true}).click();
  await page.getByLabel('Expense limit',{exact:true}).fill('1200');await page.getByRole('button',{name:'Save monthly goals',exact:true}).click();
  await expect(page.getByText('Goals saved for 2026-03.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'Default monthly plan & emergency fund'})).toHaveCount(0);
  await expect(page.getByRole('combobox',{name:'Goal period'})).toHaveCount(0);
  await page.reload();await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.getByLabel('Month',{exact:true}).selectOption('02');
  await page.getByText('Monthly goals & category limits',{exact:true}).click();
  await expect(page.getByRole('group',{name:'Expense goal comparison',exact:true})).toContainText('Over limit by PKR 2.50');
  await expect(page.getByRole('group',{name:'Food goal comparison',exact:true})).toContainText('Over limit by PKR 2.50');
  await page.getByLabel('Month',{exact:true}).selectOption('03');
  await expect(page.getByRole('group',{name:'Expense goal comparison',exact:true})).toContainText('PKR 1,200.00 planned');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('month switching protects unsaved edits', async ({page})=>{
 await page.goto('/'); await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('button',{name:'Goals',exact:true}).click();
 await page.getByLabel('Goal month').fill('2026-01'); await page.getByLabel('Expense limit').fill('123');
 await page.getByRole('button',{name:'February 2026',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('unsaved changes'); await expect(page.getByLabel('Goal month')).toHaveValue('2026-01');
 await page.getByRole('button',{name:'Keep editing'}).click(); await expect(page.getByLabel('Expense limit')).toHaveValue('123');
 await page.getByRole('button',{name:'Save monthly goals'}).click(); await expect(page.getByRole('status')).toContainText('2026-01');
 await page.getByRole('button',{name:'February 2026',exact:true}).click(); await page.getByLabel('Expense limit').fill('456'); await page.getByRole('button',{name:'Save monthly goals'}).click(); await expect(page.getByRole('status')).toContainText('2026-02');
 await page.getByRole('button',{name:'January 2026, saved goals',exact:true}).click(); await expect(page.getByLabel('Expense limit')).toHaveValue('123.00');
});


test('saving another month selects it and exposes the same goals on both reporting tabs', async ({page}) => {
  await page.goto('/'); await page.getByRole('button',{name:'Explore the demo'}).click();
  await page.getByRole('button',{name:'Goals',exact:true}).click();
  await page.getByLabel('Goal month').fill('2026-05');
  await page.getByLabel('Expense limit',{exact:true}).fill('4321');
  await page.getByRole('button',{name:'Save monthly goals',exact:true}).click();
  await expect(page.getByText('Goals saved for 2026-05.',{exact:true})).toBeVisible();
  for (const tab of ['Overview','Daily entries']) {
    await page.getByRole('button',{name:tab,exact:true}).click();
    if (tab === 'Overview') await page.getByText('Monthly goals & category limits',{exact:true}).click(); else await page.locator('.entries-budget-summary>summary').click();
    await expect(page.getByLabel('Month',{exact:true})).toHaveValue('05');
    await expect(page.getByRole('group',{name:'Expense goal comparison',exact:true})).toContainText('PKR 4,321.00 planned');
  }
});
