import type {Page} from '@playwright/test';
export async function entryAction(page:Page, name:string|RegExp) {
 const button=page.getByRole('button',{name,exact:typeof name==='string'}).first();
 if(!await button.isVisible())await page.getByRole('row').filter({has:page.getByRole('button',{name,exact:typeof name==='string'})}).first().getByRole('button',{name:/^Actions for/}).click();
 await button.click();
}
export async function openQuickExpense(page:Page){await page.getByRole('button',{name:'Money Log',exact:true}).click();if(!await page.getByLabel('Expense amount',{exact:false}).isVisible())await page.getByText('Quick expense entry',{exact:true}).click();}
export async function openSupportingTotals(page:Page){await page.getByRole('button',{name:'Overview',exact:true}).click();const details=page.locator('.supporting-totals');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function selectCategory(page:Page, field:string, name:string){const options=await page.getByLabel(field,{exact:true}).locator('option').evaluateAll(opts=>opts.map(o=>({label:o.textContent??'',value:(o as HTMLOptionElement).value})));const option=options.find(o=>o.label===name||o.label.endsWith('→ '+name));if(!option)throw new Error('Missing category '+name);await page.getByLabel(field,{exact:true}).selectOption(option.value);}

export async function logMonth(page:Page,year:string,month:string){await page.getByRole("button",{name:"Money Log",exact:true}).click();const toggle=page.getByRole("button",{name:"Search another date range",exact:true});if(await toggle.getAttribute("aria-expanded")!=="true")await toggle.click();const regular=page.getByRole("button",{name:"Use month / year",exact:true});if(await regular.isVisible())await regular.click();await page.getByLabel("Year",{exact:true}).selectOption(year);await page.getByLabel("Month",{exact:true}).selectOption(month);}
export async function planningDate(page:Page,date:string){const options=page.locator(".period-options");if(await options.getAttribute("open")===null)await options.locator("summary").click();await page.getByLabel("Go to date",{exact:true}).fill(date);}
