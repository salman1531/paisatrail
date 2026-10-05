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
 await page.getByRole('combobox',{name:'Planning example',exact:true}).selectOption('cushion');await page.getByRole('button',{name:'Use this split in my draft',exact:true}).click();await expect(page.getByLabel('Savings target',{exact:true})).toHaveValue('40000.00');await expect(page.getByLabel('Investment target',{exact:true})).toHaveValue('0.00');
});
