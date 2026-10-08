import {test,expect} from '@playwright/test';
import {entryAction} from './helpers';

test('overview leads with answers and entry-list filters cannot change report totals or charts',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 const summary=page.locator('.overview-summary'),charts=page.locator('.cash-flow-panel');const before=await summary.innerText(),chartBefore=await charts.innerText();
 expect(await summary.evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(await charts.evaluate(e=>e.getBoundingClientRect().top));await expect(page.getByLabel('Search entries',{exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Expense amount',{exact:false})).toBeHidden();
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByLabel('Filter category',{exact:true}).selectOption({label:'Food'});await page.getByLabel('Search entries',{exact:true}).fill('Lunch');
 await expect(page.locator('.transaction-row')).toHaveCount(1);await page.getByRole('button',{name:'Overview',exact:true}).click();await expect(summary).toHaveText(before);await expect(charts).toHaveText(chartBefore);
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await expect(page.locator('.overview-summary')).toHaveCount(0);await expect(page.locator('.entries-budget-summary')).not.toHaveAttribute('open');await expect(page.locator('.transaction-row')).toHaveCount(1);
 await entryAction(page,/^Edit entry Food/);await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('default currency changes preserve plans, reporting scope and deliberate category choice',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();const summary=await page.locator('.overview-summary').innerText();
 await page.getByRole('button',{name:'Add expense',exact:true}).click();await expect(page.getByLabel('Category',{exact:true})).toHaveValue('');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Default entry currency').selectOption('USD');await page.getByRole('button',{name:'Save settings'}).click();await expect(page.getByRole('dialog')).toContainText('No currency conversion');await page.getByRole('button',{name:'Confirm currency change'}).click();
 await page.getByRole('button',{name:'Overview',exact:true}).click();await expect(page.locator('.overview-summary')).toHaveText(summary);await expect(page.getByLabel('Reporting currency')).toHaveValue('PKR');
 await page.getByRole('button',{name:'Add expense',exact:true}).click();await expect(page.getByLabel('Currency',{exact:true})).toHaveValue('USD');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Goals',exact:true}).click();await expect(page.locator('.goal-saved-status').filter({hasText:'Using default plan'})).toBeVisible();await page.getByLabel('Savings target',{exact:true}).fill('123');await page.getByLabel('Goal currency').selectOption('USD');await expect(page.getByRole('dialog')).toContainText('Unsaved goal edits');await page.getByRole('button',{name:'Cancel',exact:true}).click();await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('123');
});
