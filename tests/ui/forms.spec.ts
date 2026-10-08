import {openSupportingTotals,openQuickExpense} from './helpers';
import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';
test('popup restores scrolling and amount words reflect currency precision', async ({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('heading',{name:/Recent entries/}).scrollIntoViewIfNeeded();

 await entryAction(page,/^Edit entry/);
 await page.getByLabel('Amount',{exact:true}).fill('150000.50');
 await expect(page.getByText('One lakh fifty thousand and fifty paisa pkr',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.body.style.position)).toBe('fixed');
 const before=await page.evaluate(()=>-parseFloat(document.body.style.top));
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await page.evaluate(()=>document.body.style.position)).toBe('');
 expect(Math.abs((await page.evaluate(()=>window.scrollY))-before)).toBeLessThan(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('percentage goals recalculate, save amounts and preserve amount entry',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Goals',exact:true}).click();
 await page.getByLabel('Earnings target',{exact:true}).fill('150000');await page.getByRole('radio',{name:'Percentages of earnings',exact:true}).check();
 await page.getByLabel('Expense limit percentage',{exact:true}).fill('80');await page.getByLabel('Savings target percentage',{exact:true}).fill('10');await page.getByLabel('Investment target percentage',{exact:true}).fill('10');
 await expect(page.locator('.percentage-preview').nth(1)).toContainText('15,000.00');
 await page.getByLabel('Earnings target',{exact:true}).fill('200000');await expect(page.locator('.percentage-preview').nth(1)).toContainText('20,000.00');
 await page.getByRole('button',{name:'Save monthly goals',exact:true}).click();await expect(page.getByText(/^Goals saved for/)).toBeVisible();
 await page.getByRole('radio',{name:'Amounts',exact:true}).check();await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('20000.00');
 await page.getByText('Need help splitting your earnings?',{exact:true}).click();await page.getByRole('combobox',{name:'Planning example',exact:true}).selectOption('cushion');await page.getByRole('button',{name:/^Save plan for/}).click();await expect(page.getByRole('dialog')).toContainText('40,000.00');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('20000.00');await page.getByRole('button',{name:/^Save plan for/}).click();await page.getByRole('button',{name:'Confirm and save goals',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('40000.00');await expect(page.getByLabel('Investment target',{exact:true})).toHaveValue('0.00');
});


test('custom plan confirms only the selected month and keeps category limits',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Goals',exact:true}).click();
 await page.getByLabel('Goal month').fill('2026-04');await page.getByLabel('Earnings target',{exact:true}).fill('1000');
 await page.getByText('Category limits & targets (optional)',{exact:true}).click();await page.locator('.category-budget-editor').getByLabel('Food',{exact:true}).fill('200');
 await page.getByText('Need help splitting your earnings?',{exact:true}).click();await page.getByRole('combobox',{name:'Planning example',exact:true}).selectOption('custom');
 await page.getByLabel('Spending %',{exact:true}).fill('85');await expect(page.getByRole('alert')).toContainText('100% or less');await expect(page.getByRole('button',{name:/^Save plan for/})).toHaveCount(0);
 await page.getByLabel('Spending %',{exact:true}).fill('60');await page.getByLabel('Cash savings %',{exact:true}).fill('25');await page.getByLabel('Investments %',{exact:true}).fill('10');
 await page.getByRole('button',{name:'Save plan for April 2026',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('April 2026');await expect(page.getByRole('dialog')).toContainText('PKR 600.00');
 await page.getByRole('button',{name:'Confirm and save goals',exact:true}).click();await expect(page.getByText('Goals saved for 2026-04.',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Expense limit',{exact:true})).toHaveValue('600.00');await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('250.00');await expect(page.locator('.category-budget-editor').getByLabel('Food',{exact:true})).toHaveValue('200.00');
 await page.getByLabel('Goal month').fill('2026-05');await expect(page.getByLabel('Expense limit',{exact:true})).not.toHaveValue('600.00');await page.getByLabel('Goal month').fill('2026-04');await expect(page.getByLabel('Expense limit',{exact:true})).toHaveValue('600.00');
 await page.reload();await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Goals',exact:true}).click();await page.getByLabel('Goal month').fill('2026-04');await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('250.00');
});

test('supporting income remains independent of entry filters and shows a deficit honestly',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await openSupportingTotals(page);
 const period=await page.getByLabel('Overview month').inputValue();const summary=page.locator('.summary-card.remaining');const original=await summary.innerText();
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByLabel('Filter category',{exact:true}).selectOption({label:'Food'});await openSupportingTotals(page);await expect(summary).toHaveText(original);
 await page.getByRole('button',{name:'Add expense',exact:true}).click();await page.getByLabel('Category',{exact:true}).selectOption({label:'Food → Groceries'});await page.getByLabel('Amount',{exact:true}).fill('1000000');await page.getByLabel('Date',{exact:true}).fill(period+'-01');await page.getByRole('button',{name:'Save entry',exact:true}).click();await expect(summary.locator(':scope>strong')).toContainText('-');
 await page.getByLabel('Overview month').fill('2026-01');await expect(summary.locator(':scope>strong')).toHaveText('—');await expect(summary).toContainText('Record income to see this total');
});
