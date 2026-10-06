import { expect, test } from '@playwright/test';
test('popup restores scrolling and amount words reflect currency precision', async ({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 await page.getByRole('heading',{name:/Recent entries/}).scrollIntoViewIfNeeded();

 await page.getByRole('button',{name:/^Edit entry/}).first().click();
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
 await page.getByText('Category spending limits (optional)',{exact:true}).click();await page.locator('.category-budget-editor').getByLabel('Groceries',{exact:true}).fill('200');
 await page.getByText('Need help splitting your earnings?',{exact:true}).click();await page.getByRole('combobox',{name:'Planning example',exact:true}).selectOption('custom');
 await page.getByLabel('Spending %',{exact:true}).fill('85');await expect(page.getByRole('alert')).toContainText('100% or less');await expect(page.getByRole('button',{name:/^Save plan for/})).toHaveCount(0);
 await page.getByLabel('Spending %',{exact:true}).fill('60');await page.getByLabel('Cash savings %',{exact:true}).fill('25');await page.getByLabel('Investments %',{exact:true}).fill('10');
 await page.getByRole('button',{name:'Save plan for April 2026',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('April 2026');await expect(page.getByRole('dialog')).toContainText('PKR 600.00');
 await page.getByRole('button',{name:'Confirm and save goals',exact:true}).click();await expect(page.getByText('Goals saved for 2026-04.',{exact:true})).toBeVisible();
 await expect(page.getByLabel('Expense limit',{exact:true})).toHaveValue('600.00');await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('250.00');await expect(page.locator('.category-budget-editor').getByLabel('Groceries',{exact:true})).toHaveValue('200.00');
 await page.getByRole('button',{name:'May 2026',exact:true}).click();await expect(page.getByLabel('Expense limit',{exact:true})).not.toHaveValue('600.00');await page.getByRole('button',{name:'April 2026, saved goals',exact:true}).click();await expect(page.getByLabel('Expense limit',{exact:true})).toHaveValue('600.00');
 await page.reload();await page.getByRole('button',{name:'Explore the demo'}).click();await page.getByRole('button',{name:'Goals',exact:true}).click();await page.getByLabel('Goal month').fill('2026-04');await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('250.00');
});

test('income summary uses all categories and avoids negative balances without income',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore the demo'}).click();
 const activeMonth=await page.getByLabel('Month',{exact:true}).inputValue();const year=await page.getByLabel('Year',{exact:true}).inputValue();const emptyMonth=activeMonth==='06'?'07':'06';
 const summary=page.getByRole('group',{name:'Income remaining summary'});const original=await summary.innerText();
 await page.getByRole('combobox',{name:'Filter category',exact:true}).selectOption({label:'Groceries'});await expect(summary).toHaveText(original);await page.getByRole('combobox',{name:'Filter category',exact:true}).selectOption('all');
 await page.getByLabel('Expense amount',{exact:false}).fill('1');await page.getByText('Change date or add a note',{exact:true}).click();const currentDate=await page.getByLabel('Expense date',{exact:true}).inputValue();await page.getByLabel('Expense date',{exact:true}).fill(`${year}-${emptyMonth}-01`);await page.getByRole('button',{name:'Save expense',exact:true}).click();
 await expect(summary).toContainText('Income not recorded');await expect(summary.locator('strong')).toHaveText('—');
 await page.getByRole('combobox',{name:'Month',exact:true}).selectOption(activeMonth);await page.getByLabel('Expense date',{exact:true}).fill(currentDate);
 await page.getByLabel('Expense amount',{exact:false}).fill('10000');await page.getByRole('button',{name:'Save expense',exact:true}).click();await expect(summary).toContainText('Above recorded income');await expect(summary.locator('strong')).not.toContainText('-');
});
