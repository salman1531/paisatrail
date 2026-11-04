import type {Page} from '@playwright/test';
export function mainNav(page:Page){return page.getByRole('navigation',{name:(page.viewportSize()?.width??1440)<=800?'Mobile navigation':'Personal Finance navigation',exact:true});}
export async function go(page:Page,name:string){
 const mobile=(page.viewportSize()?.width??1440)<=800;
 if(mobile&&['Categories','Settings'].includes(name)){await mainNav(page).getByRole('button',{name:'More',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name,exact:true}).click();return;}
 if(['Categories','Settings'].includes(name)){await page.locator('.workspace-utilities').getByRole('button',{name,exact:true}).click();return;}
 await mainNav(page).getByRole('button',{name:mobile&&name==='Money Plan'?'Plan':name,exact:true}).click();
}
export async function record(page:Page,kind:string){
 const income=page.locator('.workspace-primary').getByRole('button',{name:'Add income',exact:true});
 if(kind==='income'&&await income.isVisible()){await income.click();return;}
 await page.locator('.workspace-primary .record-action>summary').click();await page.locator('.workspace-primary').getByRole('button',{name:'Record '+kind,exact:true}).click();
}
export function metric(page:Page,label:string){return page.locator('.overview-summary .workspace-metric').filter({has:page.getByText(label,{exact:true})});}
export async function entryAction(page:Page, name:string|RegExp) {
 const row=page.locator('.personal-record').filter({has:page.getByRole('button',{name,exact:typeof name==='string',includeHidden:true})}).first();
 await row.getByRole('button',{name:/^Actions for/}).click();await row.getByRole('button',{name,exact:typeof name==='string'}).click();
}
export async function openSupportingTotals(page:Page){await go(page,'Overview');await metric(page,'Received income').waitFor({state:'visible'});}
export async function selectCategory(page:Page, field:string, name:string){
 const picker=field==='Category'?page.getByRole('dialog').getByRole('combobox',{name:/^(Category|Income category|Investment category|Savings category)$/}):page.getByRole('combobox',{name:field,exact:true});
 if(!await picker.isVisible()&&await page.getByRole('dialog').getByText('Category (optional)',{exact:true}).isVisible())await page.getByRole('dialog').getByText('Category (optional)',{exact:true}).click();
 await picker.fill(name);const options=page.getByRole('option');const labels=await options.allTextContents();const label=labels.find(label=>label===name||label.endsWith('→ '+name));if(!label)throw Error('Missing category '+name);await page.getByRole('option',{name:label,exact:true}).click();
}

export async function logMonth(page:Page,year:string,month:string){await go(page,'Money Log');await page.getByRole('button',{name:/^Edit dates(?: · |$)/}).click();await page.getByLabel('Date mode',{exact:true}).selectOption(month==='all'?'year':'calendar');await page.getByLabel('Year',{exact:true}).selectOption(year);if(month!=='all')await page.getByLabel('Month',{exact:true}).selectOption(month);}
export async function logFilters(page:Page){const details=page.locator('.log-filter-disclosure');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function logActions(page:Page){const details=page.locator('.log-secondary-actions');if(await details.getAttribute('open')===null)await details.locator('summary').click();}
export async function planningDate(page:Page,date:string){if(!await page.getByLabel('Go to date',{exact:true}).isVisible())await page.getByRole('button',{name:/^Edit dates(?: · |$)/}).click();await page.getByLabel('Go to date',{exact:true}).fill(date);}

export async function changeType(page:Page,name:string){const panel=page.locator('.record-type-options');if(await panel.getAttribute('open')===null)await panel.locator('summary').click();await panel.getByRole('radio',{name,exact:true}).check();}
