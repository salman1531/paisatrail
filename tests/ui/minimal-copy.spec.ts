import {test,expect,type Page} from '@playwright/test';
import {newDemo} from '../../src/demo';
import {currencies,type Ledger} from '../../src/types';
import {inputAmount,precision} from '../../src/finance';
const maxMinor=1_000_000_000_000;
async function open(page:Page,ledger:Ledger=newDemo()){
 await page.clock.install({time:new Date('2026-10-12T12:00:00Z')});
 await page.addInitScript(data=>localStorage.setItem('pocket-ledger-demo-v1',JSON.stringify(data)),ledger);
 await page.goto('/');await page.getByRole('link',{name:'Explore the demo',exact:true}).click();
}
async function assertIntact(page:Page){
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
 const values=await page.locator('.money-number:visible').evaluateAll(elements=>elements.map(el=>{const range=document.createRange();range.selectNodeContents(el);const rects=[...range.getClientRects()];const rect=el.getBoundingClientRect();return {number:el.textContent,lines:rects.length,left:rect.left,right:rect.right,viewport:innerWidth};}));
 expect(values.length).toBeGreaterThan(0);
 for(const v of values){expect(v.lines,v.number??'').toBe(1);expect(v.left).toBeGreaterThanOrEqual(0);expect(v.right).toBeLessThanOrEqual(v.viewport+1);}
}
test('maximum amounts retain all digits in reports, summaries and transactions for every currency',async({page})=>{
 const l=newDemo();l.entries=[];l.namedGoals=[];l.contributionPlans=[];l.spendingBudgets=[];l.budgetAllocations=[];
 for(const c of currencies)for(const kind of ['income','expense','saving','investment'])l.entries.push({id:crypto.randomUUID(),user_id:'demo',category_id:l.categories.find(x=>x.kind===kind)!.id,date:'2026-10-02',currency:c,amount_minor:maxMinor,notes:'Maximum-value fixture',withdrawal:false});
 await page.setViewportSize({width:390,height:844});await open(page,l);
 for(const c of currencies){await page.getByRole('button',{name:'Reports',exact:true}).click();await page.getByLabel('Reporting currency',{exact:true}).selectOption(c);await assertIntact(page);const expected=new Intl.NumberFormat('en',{minimumFractionDigits:precision(c),maximumFractionDigits:precision(c)}).format(Number(inputAmount(maxMinor,c)));await expect(page.locator('.report-actuals')).toContainText(expected);await page.getByRole('button',{name:'Money Plan',exact:true}).click();await assertIntact(page);await page.getByRole('button',{name:'Money Log',exact:true}).click();await assertIntact(page);}
});
test('recorded money stays visible while plan remainder is optional',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Money Plan',exact:true}).click();await expect(page.getByRole('region',{name:'Recorded money'})).toContainText('Income left (recorded)');const summary=page.getByRole('region',{name:'Period plan summary'});await expect(summary.getByText('Unassigned in plan',{exact:true})).toBeHidden();await summary.locator('.plan-details>summary').press('Enter');await expect(summary.getByText('Unassigned in plan',{exact:true})).toBeVisible();await expect(page.locator('.spending-limit-breakdown')).toHaveCount(0);
});
test('basic spending editor saves one limit and disables overlapping category choices',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Money Plan',exact:true}).click();await page.locator('#money-plan-spending').getByRole('button',{name:'Edit',exact:true}).click();const dialog=page.getByRole('dialog');await expect(page.getByLabel('Percentage')).toBeHidden();await expect(page.getByLabel('Carry unused limit forward')).toBeHidden();await page.getByLabel('Spending limit',{exact:true}).fill('65000');await page.getByRole('button',{name:'Save spending plan',exact:true}).click();await expect(page.locator('#money-plan-spending')).toContainText('65,000.00');await page.locator('#money-plan-spending').getByRole('button',{name:'Edit',exact:true}).click();await dialog.locator('.budget-category-editor>summary').click();await page.getByRole('button',{name:'Add category limit',exact:true}).click();await dialog.getByLabel('Category',{exact:true}).selectOption({label:'Food (all)'});await page.getByRole('button',{name:'Add category limit',exact:true}).click();const next=dialog.getByLabel('Category',{exact:true}).nth(1);await expect(next.getByRole('option',{name:'Food → Groceries',exact:true})).toBeDisabled();await expect(next.getByRole('option',{name:'Home (all)',exact:true})).toBeEnabled();
});
test('goal card is compact and met-plan Add money has a goal title and no suggested amount',async({page})=>{
 await page.setViewportSize({width:390,height:844});await open(page);await page.getByRole('button',{name:'Money Plan',exact:true}).click();const card=page.locator('.compact-goal-card');await expect(card).toContainText('Plan met');expect((await card.boundingBox())!.height).toBeLessThan(500);await card.getByRole('button',{name:'Add money',exact:true}).click();await expect(page.getByRole('dialog',{name:'Add money to Emergency cushion',exact:true})).toBeVisible();await expect(page.getByLabel('Amount',{exact:true})).toHaveValue('');await expect(page.getByLabel('Named goal (optional)',{exact:true})).toBeHidden();
});
test('empty income matching, category plan placeholders and routine settings clutter are absent',async({page})=>{
 const l=newDemo();l.incomeSources=[];l.expectedPayments=[];await open(page,l);await page.getByRole('button',{name:'Income',exact:true}).click();await page.getByRole('button',{name:'Record income',exact:true}).click();await expect(page.getByLabel('Income source (optional)',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Match upcoming payment',{exact:true})).toHaveCount(0);await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.getByRole('button',{name:'Categories',exact:true}).filter({visible:true}).click();await expect(page.getByRole('region',{name:'Reporting period'})).toHaveCount(0);await expect(page.locator('.category-workspace')).not.toContainText('Plan Not set');await page.getByRole('button',{name:'Settings',exact:true}).filter({visible:true}).click();await expect(page.getByLabel('New cycle start day')).toBeHidden();await page.locator('.cycle-change>summary').click();await page.getByLabel('New cycle start day').selectOption('25');await page.getByRole('button',{name:'Preview cycle change',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('first period is shortened');
});
test('report drill-down preserves its year and currency in Money Log',async({page})=>{
 await open(page);await page.getByRole('button',{name:'Reports',exact:true}).click();await page.getByRole('button',{name:'Edit dates',exact:true}).click();await page.getByLabel('Date mode',{exact:true}).selectOption('year');await page.getByLabel('Year',{exact:true}).selectOption('2026');await page.locator('.flow-category').filter({hasText:'Food'}).click();await expect(page.getByRole('heading',{name:'Money Log',exact:true})).toBeVisible();await page.getByRole('button',{name:'Edit dates',exact:true}).click();await expect(page.getByLabel('Date mode',{exact:true})).toHaveValue('year');await expect(page.getByLabel('Year',{exact:true})).toHaveValue('2026');await expect(page.locator('.transaction-row')).toHaveCount(8);
});
