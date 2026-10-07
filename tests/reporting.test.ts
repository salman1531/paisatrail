import {expect,it} from 'vitest';
import {newDemo,demoIncome} from '../src/demo';
import {preferenceUpdate,reportingLedger} from '../src/reporting';
import {periodGoalRows} from '../src/goals';
import {currencies} from '../src/types';
import {precision} from '../src/finance';
it('separates reporting and default entry currencies without destroying saved or legacy plans',()=>{
 const ledger=newDemo('PKR');const month=ledger.entries[0].date.slice(0,7);ledger.goals=[{id:'usd-plan',user_id:'demo',period:month,currency:'USD',kind:'expense',category_id:null,target_minor:10000}];
 const updated={...ledger,profile:preferenceUpdate(ledger.profile,'USD','UTC')};expect(updated.profile.income_target).toBe(ledger.profile.income_target);expect(updated.profile.emergency_target).toBe(ledger.profile.emergency_target);expect(updated.profile.planning_currency).toBe('PKR');
 const filter={year:month.slice(0,4),month:month.slice(5),category:'all'};
 expect(periodGoalRows(reportingLedger(updated,'PKR'),filter).find(r=>r.kind==='income')?.target).toBe(ledger.profile.income_target);
 expect(periodGoalRows(reportingLedger(updated,'USD'),filter).find(r=>r.kind==='income')?.target).toBeNull();
 expect(periodGoalRows(reportingLedger(updated,'USD'),filter).find(r=>r.kind==='expense')?.target).toBe(10000);
 expect(updated.entries).toBe(ledger.entries);expect(updated.goals).toBe(ledger.goals);
 expect(preferenceUpdate(updated.profile,'PKR','UTC').income_target).toBe(ledger.profile.income_target);
});
it('provides coherent fictional scenarios with trends for every supported currency',()=>{
 for(const currency of currencies){const ledger=newDemo(currency);expect(ledger.entries.every(e=>e.currency===currency&&Number.isInteger(e.amount_minor))).toBe(true);expect(new Set(ledger.entries.map(e=>e.date.slice(0,7))).size).toBe(4);expect(ledger.profile.income_target).toBe(demoIncome[currency]*10**precision(currency));const food=ledger.categories.find(c=>c.name==='Food')!;expect(ledger.subcategories?.filter(s=>s.category_id===food.id).map(s=>s.name)).toEqual(['Groceries','Dining','Coffee']);expect(ledger.categories.some(c=>c.name==='Coffee & dining')).toBe(false);}
});
