import {selectCategory} from './helpers';
import {logFilters,logActions} from './helpers';
import {expect,test} from '@playwright/test';
test('budget leads overview and recent activity shares its currency scope',async({page})=>{
 await page.goto('/');await page.getByRole('link',{name:'Explore the demo',exact:true}).click();
 const hero=page.locator('.budget-hero');await expect(hero.getByRole('heading',{name:'Budget remaining',exact:true})).toBeVisible();await expect(page.getByLabel('Currency filter')).toHaveValue('PKR');await expect(page.getByRole('progressbar',{name:'Expense budget used'})).toBeVisible();
 await expect(page.getByLabel('Search entries',{exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Export Excel',exact:true})).toHaveCount(0);
 const before=await hero.innerText();await page.getByRole('button',{name:'Add expense',exact:true}).click();await page.getByLabel('Currency',{exact:true}).selectOption('USD');await selectCategory(page,'Category','Food → Groceries');await page.getByLabel('Amount',{exact:true}).fill('23');await page.getByRole('button',{name:/^Save (?:expense|income|savings|investment|withdrawal)$/,exact:true}).click();
 await page.getByLabel('Currency filter').selectOption('PKR');await expect(hero).toHaveText(before);await expect(page.locator('.transaction-row').filter({hasText:'USD'})).toHaveCount(0);await page.getByLabel('Currency filter').selectOption('USD');await expect(page.locator('.transaction-row').filter({hasText:'23.00'})).toHaveCount(1);
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await logFilters(page);await page.getByLabel('Entry currency').selectOption('all');await expect(page.getByLabel('Search entries',{exact:true})).toBeVisible();await logActions(page);await expect(page.getByRole('button',{name:'Export Excel',exact:true})).toBeVisible();
});
test('category search, optional details and save footer fit a shortened phone screen',async({page})=>{
 await page.setViewportSize({width:390,height:500});await page.goto('/');await page.getByRole('link',{name:'Explore the demo',exact:true}).click();await page.getByRole('button',{name:'Add expense',exact:true}).click();await page.getByRole('combobox',{name:'Category',exact:true}).fill('groc');await expect(page.getByRole('option',{name:'Food → Groceries',exact:true})).toBeVisible();await selectCategory(page,'Category','Food → Groceries');
 await page.getByRole('dialog').getByText('More details',{exact:true}).click();await page.getByLabel('Note (optional)',{exact:true}).fill('Keyboard layout test');const save=await page.getByRole('button',{name:/^Save (?:expense|income|savings|investment|withdrawal)$/,exact:true}).boundingBox();expect(save!.y+save!.height).toBeLessThanOrEqual(500);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.getByRole('button',{name:'Close dialog',exact:true}).click();expect(await page.evaluate(()=>document.body.style.position)).toBe('');
});
