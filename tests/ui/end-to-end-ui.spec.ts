import {expect,test} from '@playwright/test';
import {seedSharedDemo} from '../../src/shared/demo';
import {metric,selectCategory} from './helpers';

test('all spaces reconciles both groups and the date filter changes spending only',async({page})=>{
 const scenario=seedSharedDemo();
 scenario.contexts=scenario.contexts.slice(0,2);
 const ids=new Set(scenario.contexts.map(c=>c.id));
 scenario.expenses=scenario.expenses.filter(e=>ids.has(e.context_id));
 scenario.settlements=scenario.settlements.filter(e=>ids.has(e.context_id));
 scenario.participants=scenario.participants.filter(e=>ids.has(e.context_id));
 await page.addInitScript(data=>localStorage.setItem('paisatrace-shared-demo-v1',JSON.stringify(data)),scenario);
 await page.goto('/shared-demo/dashboard');
 const cards=page.getByRole('region',{name:'All-time outstanding',exact:true}),space=page.getByRole('combobox',{name:'Shared space',exact:true});
 const person=page.locator('.dash-people'),totals=page.getByRole('group',{name:'Included expenses in this period'});
 await expect(cards).toContainText('All spaces · PKR');
 await expect(cards).toContainText('6,800.00');
 await expect(person).toContainText('Ali');await expect(person).toContainText('Sana');
 await space.selectOption({label:'Weekend with friends'});
 await expect(cards).toContainText('-1,200.00');await expect(person).not.toContainText('Sana');
 await space.selectOption({label:'Our shared home'});
 await expect(cards).toContainText('8,000.00');await expect(person).not.toContainText('Ali');
 await expect(totals).toContainText('36,000.00');
 await page.getByRole('button',{name:/^Edit dates ·/}).press('Enter');
 await page.getByRole('combobox',{name:'Reporting period',exact:true}).selectOption('last');
 await expect(totals).toContainText('6,000.00');
 await expect(cards).toContainText('Our shared home · PKR');await expect(cards).toContainText('8,000.00');
});

test('expense drill-down retains the scope, validates and saves a single new record',async({page})=>{
 await page.setViewportSize({width:360,height:740});
 await page.goto('/demo/overview');
 await metric(page,'Expenses').click();
 const dates=page.getByRole('button',{name:/^Edit dates ·/}),scope=await dates.textContent();
 await expect(page.getByRole('combobox',{name:'Entry currency',exact:true})).toHaveValue('PKR');
 const search=page.getByLabel('Search entries',{exact:true});
 await search.fill('fictional-no-match');
 await expect(page.getByRole('heading',{name:'No search results',exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Clear search',exact:true}).click();
 await expect(search).toBeFocused();
 const records=page.locator('.personal-record'),count=await records.count();
 const add=page.getByRole('button',{name:'Add expense',exact:true});
 await add.press('Enter');
 const dialog=page.getByRole('dialog',{name:'Record expense',exact:true}),amount=dialog.getByLabel('Amount',{exact:true}),save=dialog.getByRole('button',{name:'Save expense',exact:true});
 await save.press('Enter');
 await expect(amount).toBeFocused();await expect(amount).toHaveAttribute('aria-invalid','true');
 await amount.fill('75.50');await selectCategory(page,'Category','Groceries');
 for(const width of [360,390]){
  await page.setViewportSize({width,height:430});
  await amount.press('End');
  await expect(save).toBeInViewport();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await save.click();await expect(dialog).toHaveCount(0);
 await expect(add).toBeFocused();await expect(dates).toHaveText(scope!);
 await expect(records).toHaveCount(count+1);await expect(records.filter({hasText:'75.50'})).toHaveCount(1);
});
