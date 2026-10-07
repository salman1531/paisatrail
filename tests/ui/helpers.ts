import type {Page} from '@playwright/test';
export async function entryAction(page:Page, name:string|RegExp) {
 const button=page.getByRole('button',{name,exact:typeof name==='string'}).first();
 if(!await button.isVisible())await page.getByRole('row').filter({has:page.getByRole('button',{name,exact:typeof name==='string'})}).first().getByRole('button',{name:/^Actions for/}).click();
 await button.click();
}
export async function openQuickExpense(page:Page){if(!await page.getByLabel('Expense amount',{exact:false}).isVisible())await page.locator('.compact-expense>summary').click();}
