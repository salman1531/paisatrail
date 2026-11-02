import {go,record,metric} from './helpers';
import {selectCategory} from './helpers';
import {logFilters,logActions} from './helpers';
import {expect,test} from '@playwright/test';
test('budget leads overview and recent activity shares its currency scope',async({page})=>{
 await page.goto('/demo/overview');
 const hero=metric(page,'Budget remaining');await expect(hero.getByText('Budget remaining',{exact:true})).toBeVisible();await expect(page.getByLabel('Currency filter')).toHaveValue('PKR');await expect(hero).toContainText('Spending allowance less expenses');
 await expect(page.getByLabel('Search entries',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Export Excel',exact:true})).toHaveCount(0);
 const before=await hero.textContent();await record(page,'expense');await page.getByRole('combobox',{name:'Currency',exact:true}).selectOption('USD');await selectCategory(page,'Category','Food → Groceries');await page.getByLabel('Amount',{exact:true}).fill('23');await page.getByRole('button',{name:/^Save (?:expense|income|savings|investment|withdrawal)$/,exact:true}).click();
 await page.getByLabel('Currency filter').selectOption('PKR');await expect(hero).toHaveText(before);await expect(page.locator('.personal-record').filter({hasText:'USD'})).toHaveCount(0);await page.getByLabel('Currency filter').selectOption('USD');await expect(page.locator('.personal-record').filter({hasText:'23.00'})).toHaveCount(1);
 await go(page,'Money Log');await logFilters(page);await page.getByLabel('Entry currency').selectOption('all');await expect(page.getByLabel('Search entries',{exact:true})).toBeVisible();await logActions(page);await expect(page.getByRole('button',{name:'Export Excel',exact:true})).toBeVisible();
});
test('category search, optional details and save footer fit a shortened phone screen',async({page})=>{
 await page.setViewportSize({width:390,height:500});await page.goto('/demo/overview');await record(page,'expense');await page.getByRole('combobox',{name:'Category',exact:true}).fill('groc');await expect(page.getByRole('option',{name:'Food → Groceries',exact:true})).toBeVisible();await selectCategory(page,'Category','Food → Groceries');
 await page.getByRole('dialog').getByText('More details',{exact:true}).click();await page.getByLabel('Note (optional)',{exact:true}).fill('Keyboard layout test');const save=await page.getByRole('button',{name:/^Save (?:expense|income|savings|investment|withdrawal)$/,exact:true}).boundingBox();expect(save!.y+save!.height).toBeLessThanOrEqual(500);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();await page.getByRole('button',{name:'Discard changes',exact:true}).click();expect(await page.evaluate(()=>document.body.style.position)).toBe('');
});
