import type {Page} from '@playwright/test';
export async function entryAction(page:Page, name:string|RegExp) {
 const button=page.getByRole('button',{name,exact:typeof name==='string'}).first();
 if(!await button.isVisible())await page.getByRole('row').filter({has:page.getByRole('button',{name,exact:typeof name==='string'})}).first().getByRole('button',{name:/^Actions for/}).click();
 await button.click();
}
export async function openQuickExpense(page:Page){await page.getByRole('button',{name:'Money Log',exact:true}).click();if(!await page.getByLabel('Expense amount',{exact:false}).isVisible())await page.getByText('Quick expense entry',{exact:true}).click();}
export async function openBudget(page:Page){await page.getByRole('button',{name:'Money Log',exact:true}).click();const details=page.locator('.entries-budget-summary');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function openSupportingTotals(page:Page){await page.getByRole('button',{name:'Overview',exact:true}).click();const details=page.locator('.supporting-totals');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function selectCategory(page:Page, field:string, name:string){const options=await page.getByLabel(field,{exact:true}).locator('option').evaluateAll(opts=>opts.map(o=>({label:o.textContent??'',value:(o as HTMLOptionElement).value})));const option=options.find(o=>o.label===name||o.label.endsWith('→ '+name));if(!option)throw new Error('Missing category '+name);await page.getByLabel(field,{exact:true}).selectOption(option.value);}
