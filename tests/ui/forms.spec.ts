import {selectCategory} from './helpers';
import {logFilters,logActions} from './helpers';
import {planningDate} from './helpers';
import {openSupportingTotals} from './helpers';
import {entryAction} from './helpers';
import { expect, test } from '@playwright/test';
test('popup restores scrolling and amount words reflect currency precision', async ({page})=>{
 await page.goto('/');await page.getByRole('link',{name:'Explore the demo'}).click();
 await page.getByRole('heading',{name:/Recent transactions/}).scrollIntoViewIfNeeded();

 await entryAction(page,/^Edit entry/);
 await page.getByLabel('Amount',{exact:true}).fill('150000.50');
 await expect(page.getByText('One lakh fifty thousand and fifty paisa pkr',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>document.body.style.position)).toBe('fixed');
 const before=await page.evaluate(()=>-parseFloat(document.body.style.top));
 await page.getByRole('button',{name:'Cancel',exact:true}).click();
 expect(await page.evaluate(()=>document.body.style.position)).toBe('');
 expect(Math.abs((await page.evaluate(()=>window.scrollY))-before)).toBeLessThan(3);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('supporting income remains independent of entry filters and shows a deficit honestly',async({page})=>{
 await page.goto('/');await page.getByRole('link',{name:'Explore the demo'}).click();await openSupportingTotals(page);
 const period=new Date().toISOString().slice(0,7);const summary=page.locator('.summary-card.remaining');const original=await summary.innerText();
 await page.getByRole('button',{name:'Money Log',exact:true}).click();await logFilters(page);await page.getByLabel('Filter category',{exact:true}).selectOption({label:'Food'});await openSupportingTotals(page);await expect(summary).toHaveText(original);
 await page.getByRole('button',{name:'Add expense',exact:true}).click();await selectCategory(page,'Category','Food → Groceries');await page.getByLabel('Amount',{exact:true}).fill('1000000');await page.getByLabel('Date',{exact:true}).fill(period+'-01');await page.getByRole('button',{name:/^Save (?:expense|income|savings|investment|withdrawal)$/,exact:true}).click();await expect(summary.locator(':scope>strong')).toContainText('-');
 await planningDate(page,'2026-01-01');await expect(summary.locator(':scope>strong')).toHaveText('—');await expect(summary).toContainText('Record income to see this total');
});
