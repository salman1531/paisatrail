import { today, precision } from './finance';
import { starterCategories } from './starterCategories';
import type { Ledger, Category, Entry, Currency, Subcategory } from './types';
const user = 'demo';
// Independent fictional scenarios, not exchange-rate conversions or income recommendations.
export const demoIncome:Record<Currency,number>={PKR:180000,USD:4800,EUR:3400,GBP:3000,AED:15000,JPY:380000,KWD:1200};
export function newDemo(currency:Currency='PKR'): Ledger {
  const day=today();const salary=demoIncome[currency];const unit=10**precision(currency);
  const minor=(amount:number)=>Math.round(amount*unit);
  const categories:Category[]=starterCategories.map((c,i)=>({id:`demo-cat-${i}`,user_id:user,name:c.name,kind:c.kind,archived:false,essential:c.essential??false,emergency:false}));
  const subcategories:Subcategory[]=starterCategories.flatMap((c,i)=>c.children.map((s,j)=>({id:`demo-sub-${i}-${j}`,user_id:user,category_id:categories[i].id,name:s.name,archived:false,emergency:s.emergency??false})));
  const entries:Entry[]=[];
  function sample(date:string,parent:string,child:string|null,amount:number,notes:string,withdrawal=false){if(date>day)return;const category=categories.find(c=>c.name===parent)!;const sub=subcategories.find(s=>s.category_id===category.id&&s.name===child);entries.push({id:crypto.randomUUID(),user_id:user,category_id:category.id,subcategory_id:sub?.id??null,date,amount_minor:minor(amount),currency,notes,withdrawal});}
  for(let back=0;back<4;back++){
    const month=new Date(Date.UTC(Number(day.slice(0,4)),Number(day.slice(5,7))-1-back,1)).toISOString().slice(0,7);const variation=1+back*.025;
    sample(`${month}-01`,'Salary',null,salary,'Monthly salary');
    sample(`${month}-01`,'Home','Rent',salary*.25,'Monthly rent');
    sample(`${month}-02`,'Food','Groceries',salary*.045*variation,'Weekly groceries');
    sample(`${month}-03`,'Food','Dining',salary*.009,'Lunch with friends');
    sample(`${month}-04`,'Transport','Petrol',salary*.028*variation,'Fuel refill');
    sample(`${month}-05`,'Home','Bills',salary*.05*variation,'Utilities and internet');
    sample(`${month}-02`,'Savings','Emergency fund',salary*.12,'Monthly safety cushion');
    sample(`${month}-02`,'Savings','Travel savings',salary*.03,'Holiday savings');
    sample(`${month}-02`,'Investments','Mutual funds',salary*.10,'Monthly contribution');
    if(back===1)sample(`${month}-12`,'Savings','Travel savings',salary*.015,'Weekend trip withdrawal',true);
  }
  return {incomeChoicesInitialized:true,categories,subcategories,entries,profile:{user_id:user,currency,planning_currency:currency,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,income_target:minor(salary),spending_target:minor(salary*.65),saving_target:minor(salary*.15),investment_target:minor(salary*.1),emergency_target:minor(salary*3),emergency_contribution:minor(salary*.12)}};
}
const storageKey = 'pocket-ledger-demo-v1';
export function readDemo(): Ledger {
  try { const raw = localStorage.getItem(storageKey); if (raw) { const v = JSON.parse(raw); if (Array.isArray(v.categories) && Array.isArray(v.entries) && v.profile?.user_id === user) { if(!v.incomeChoicesInitialized){for(const name of ['Salary', 'Business', 'Freelance', 'Gifts', 'Rental income', 'Investment returns', 'Other income']){if(!v.categories.some((c:Category)=>c.kind==='income'&&c.name.toLowerCase()===name.toLowerCase()))v.categories.push({id:crypto.randomUUID(),user_id:user,name,kind:'income',archived:false,essential:false,emergency:false});}v.incomeChoicesInitialized=true;localStorage.setItem(storageKey,JSON.stringify(v));}return { ...v, subcategories: Array.isArray(v.subcategories) ? v.subcategories : [], profile: { ...v.profile, planning_currency:v.profile.planning_currency??v.profile.currency,saving_target: v.profile.saving_target ?? v.profile.emergency_contribution } }; } } } catch { /* Start a fresh demo if saved data is unavailable. */ }
  return newDemo();
}
export function persistDemo(ledger: Ledger) { localStorage.setItem(storageKey, JSON.stringify(ledger)); }
