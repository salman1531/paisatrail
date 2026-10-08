import {openBudget} from './helpers';
import {test,expect} from '@playwright/test';
import {entryAction} from './helpers';

test('bulk expenses validate, remove, save once, recalculate and survive reload',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByRole('button',{name:'Add multiple expenses',exact:true}).click();
 await page.getByRole('button',{name:'Save all expenses',exact:true}).click();await expect(page.getByRole('alert')).toContainText('Nothing has been saved');
 await page.getByLabel('Expense 1 category').selectOption({label:'Food → Groceries'});await page.getByLabel('Expense 1 amount').fill('2500');
 await page.getByRole('button',{name:'Add another expense',exact:true}).click();await expect(page.getByLabel('Expense 2 category').locator('option:checked')).toHaveText('Food → Groceries');await page.getByLabel('Expense 2 amount').fill('1200');await page.getByLabel('Expense 2 category').selectOption({label:'Transport → Petrol'});
 await page.getByRole('button',{name:'Add another expense',exact:true}).click();await page.getByRole('button',{name:'Remove expense 3',exact:true}).click();
 await expect(page.locator('.batch-save-bar')).toContainText('PKR 3,700.00');
 await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Keep editing',exact:true}).click();await expect(page.getByLabel('Expense 1 amount')).toHaveValue('2500');
 await page.getByRole('button',{name:'Save all expenses',exact:true}).dblclick();await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await expect(page.getByRole('row').filter({hasText:'PKR 2,500.00'})).toHaveCount(1);await expect(page.getByRole('row').filter({hasText:'PKR 1,200.00'})).toHaveCount(1);
 await page.reload();await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Money Log',exact:true}).click();await expect(page.getByRole('row').filter({hasText:'PKR 2,500.00'})).toHaveCount(1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('custom-date plans and drill-down use the same period and currency',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByRole('button',{name:'Custom dates',exact:true}).click();await page.getByLabel('Start date').fill('2026-09-01');await page.getByLabel('End date').fill('2026-09-15');await page.getByRole('button',{name:'Apply dates',exact:true}).click();
 await openBudget(page);await expect(page.getByRole('region',{name:'Plan vs. actual'})).toContainText('prorated by calendar days');await page.getByRole('button',{name:'Food',exact:true}).click();await expect(page.getByRole('heading',{name:'Money Log',exact:true})).toBeVisible();await expect(page.getByLabel('Filter category')).toHaveValue(/./);await expect(page.getByLabel('Filter entry currency')).toHaveValue('PKR');
 for(const date of await page.locator('.transaction-row').evaluateAll(rows=>rows.map(r=>r.querySelector('.transaction-date')?.textContent))){expect(date).toMatch(/Sep/);}
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByRole('button',{name:'Use month / year',exact:true}).click();await page.getByLabel('Month',{exact:true}).selectOption('all');await openBudget(page);await expect(page.getByRole('region',{name:'Plan vs. actual'})).toContainText('12 months');
});

test('category search and compact dialogs preserve linked history',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Categories',exact:true}).click();await page.getByLabel('Search categories').fill('Groceries');await expect(page.locator('.compact-category-family')).toHaveCount(1);
 await page.getByRole('button',{name:'Edit Groceries in Food',exact:true}).click();await expect(page.getByLabel('Subcategory name')).toHaveValue('Groceries');await page.getByLabel('Subcategory name').fill('Weekly groceries');await page.getByRole('button',{name:'Save subcategory',exact:true}).click();await expect(page.getByText('Weekly groceries',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Archive Weekly groceries in Food',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('past entries keep their detail');await page.getByRole('button',{name:'Archive subcategory',exact:true}).click();
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByLabel('Search entries').fill('Weekly groceries');await expect(page.getByRole('row').filter({hasText:'Weekly groceries'}).first()).toContainText('archived');await entryAction(page,/^Edit entry Food/);await expect(page.getByLabel('Category',{exact:true}).locator('option:checked')).toContainText('archived');
});

test('phone login starts with sign-in fields and keeps its submit above the fold',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 const email=await page.getByLabel('Email address').boundingBox(),signIn=await page.getByRole('button',{name:'Sign in',exact:true}).boundingBox();expect(email?.y).toBeLessThan(400);expect(signIn!.y+signIn!.height).toBeLessThan(700);
 await expect(page.locator('.login-preview')).toBeHidden();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 const firstInput=await page.locator('main input').first().getAttribute('type');expect(firstInput).toBe('email');
});


test('fixed payment dropdown and income chart keep record scopes consistent',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo',exact:true}).click();
 await page.getByRole('button',{name:'Add expense',exact:true}).click();await page.getByRole('dialog').getByText('More details',{exact:true}).click();await expect(page.getByLabel('Payment type (optional)').locator('option')).toHaveText(['Not specified','Cash','Credit Card','Debit Card','Bank Account','Others']);await page.getByLabel('Payment type (optional)').selectOption('Others');await expect(page.getByText('Custom payment name (optional)',{exact:true})).toHaveCount(0);
 await page.getByLabel('Amount',{exact:true}).fill('2500');await page.getByLabel('Category',{exact:true}).selectOption({label:'Food → Groceries'});await page.getByRole('button',{name:'Save entry',exact:true}).click();await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByLabel('Filter payment type').selectOption('Others');await expect(page.getByRole('row').filter({hasText:'Others'})).toHaveCount(1);
 await page.getByRole('button',{name:'Overview',exact:true}).click();await page.getByRole('region',{name:'See where your money goes'}).getByRole('button',{name:'Income',exact:true}).click();await page.getByRole('button',{name:/^Salary: .*View records/}).click();await expect(page.getByLabel('Filter entry type')).toHaveValue('income');await expect(page.getByLabel('Filter payment type')).toHaveValue('all');
 await page.getByRole('button',{name:'Add entry',exact:true}).click();await page.getByRole('radio',{name:'Income',exact:true}).check();for(const name of ['Salary','Business','Freelance','Gifts','Rental income','Investment returns','Other income'])await expect(page.getByLabel('Category',{exact:true}).locator('option').filter({hasText:name})).toHaveCount(1);
});
