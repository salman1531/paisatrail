import {go,record} from './helpers';
import {logFilters,logActions} from './helpers';
import {test,expect} from '@playwright/test';
import {entryAction} from './helpers';

test('overview leads with answers and entry-list filters cannot change report totals or charts',async({page})=>{
 await page.clock.install({time:new Date('2026-10-17T12:00:00Z')});
 await page.goto('/demo/overview');
 const summary=page.locator('.overview-summary'),charts=page.locator('.cash-flow-panel');const before=await summary.textContent(),chartBefore=await charts.textContent();
 expect(await summary.evaluate(e=>e.getBoundingClientRect().top)).toBeLessThan(await charts.evaluate(e=>e.getBoundingClientRect().top));await expect(page.getByLabel('Search entries',{exact:true})).toHaveCount(0);
 await expect(page.getByLabel('Expense amount',{exact:false})).toBeHidden();
 await go(page,'Money Log');await logFilters(page);await page.getByLabel('Filter category',{exact:true}).selectOption({label:'Food'});await page.getByLabel('Search entries',{exact:true}).fill('Lunch');
 await expect(page.locator('.personal-record')).toHaveCount(1);await go(page,'Overview');await expect(summary).toHaveText(before);await expect(charts).toHaveText(chartBefore);
 await go(page,'Money Log');await expect(page.locator('.overview-summary')).toHaveCount(0);await expect(page.locator('.entries-budget-summary')).toHaveCount(0);await expect(page.locator('.personal-record')).toHaveCount(1);
 await entryAction(page,/^Edit entry Food/);await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('default currency changes preserve plans, reporting scope and deliberate category choice',async({page})=>{
 await page.clock.install({time:new Date('2026-10-17T12:00:00Z')});
 await page.goto('/demo/overview');const summary=await page.locator('.overview-summary').textContent();
 await record(page,'expense');await expect(page.getByLabel('Category',{exact:true})).toHaveValue('');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await go(page,'Settings');await page.getByLabel('Default entry currency').selectOption('USD');await page.getByRole('button',{name:'Save settings'}).click();await expect(page.getByRole('dialog')).toContainText('No currency conversion');await page.getByRole('button',{name:'Confirm currency change'}).click();
 await go(page,'Overview');await expect(page.locator('.overview-summary')).toHaveText(summary);await expect(page.getByLabel('Currency filter')).toHaveValue('PKR');
 await record(page,'expense');await expect(page.getByRole('combobox',{name:'Currency',exact:true})).toHaveValue('USD');await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await go(page,'Money Plan');await expect(page.locator('#money-plan-spending')).toContainText('117,000');await page.getByLabel('Currency filter').selectOption('USD');await expect(page.locator('#money-plan-spending')).toContainText('No spending limit');await page.getByLabel('Currency filter').selectOption('PKR');await expect(page.locator('#money-plan-spending')).toContainText('117,000');
});
