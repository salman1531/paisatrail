import type {Page} from '@playwright/test';
export async function entryAction(page:Page, name:string|RegExp) {
 const button=page.getByRole('button',{name,exact:typeof name==='string'}).first();
 if(!await button.isVisible())await page.getByRole('row').filter({has:page.getByRole('button',{name,exact:typeof name==='string'})}).first().getByRole('button',{name:/^Actions for/}).click();
 await button.click();
}
export async function openSupportingTotals(page:Page){await page.getByRole('button',{name:'Overview',exact:true}).click();await page.getByRole('button',{name:'Income recorded summary',exact:true}).waitFor({state:'visible'});}
export async function selectCategory(page:Page, field:string, name:string){const picker=page.getByRole('combobox',{name:field,exact:true});await picker.fill(name);const options=page.getByRole('option');const labels=await options.allTextContents();const label=labels.find(label=>label===name||label.endsWith('→ '+name));if(!label)throw Error('Missing category '+name);await page.getByRole('option',{name:label,exact:true}).click();}

export async function logMonth(page:Page,year:string,month:string){await page.getByRole('button',{name:'Money Log',exact:true}).click();await page.getByRole('button',{name:'Edit dates',exact:true}).click();await page.getByLabel('Date mode',{exact:true}).selectOption(month==='all'?'year':'calendar');await page.getByLabel('Year',{exact:true}).selectOption(year);if(month!=='all')await page.getByLabel('Month',{exact:true}).selectOption(month);}
export async function logFilters(page:Page){const details=page.locator('.log-filter-disclosure');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function logActions(page:Page){const details=page.locator('.log-secondary-actions');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function planningDate(page:Page,date:string){if(!await page.getByLabel('Go to date',{exact:true}).isVisible())await page.getByRole('button',{name:'Edit dates',exact:true}).click();await page.getByLabel('Go to date',{exact:true}).fill(date);}
