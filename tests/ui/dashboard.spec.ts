import {openBudget,openSupportingTotals} from './helpers';
import {expect,test} from '@playwright/test';
test('dashboard compares plans, drills into a month and handles an empty period',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await openBudget(page);await expect(page.getByRole('heading',{name:'Plan vs. actual',exact:true})).toBeVisible();
 const month=await page.getByLabel('Month',{exact:true}).inputValue();await page.getByLabel('Month',{exact:true}).selectOption('all');await page.getByText('Income & spending trend',{exact:true}).click();await page.getByRole('button',{name:/^2026-01: income/}).click();await expect(page.getByLabel('Month',{exact:true})).toHaveValue('01');await expect(page.getByText('No recorded activity for this period.',{exact:true})).toBeVisible();
 await openSupportingTotals(page);await expect(page.locator('.summary-card.remaining')).toContainText('Record income to see this total');await page.getByLabel('Overview month').fill('2026-'+month);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await expect(page.locator('.budget-hero')).toBeVisible();
});
