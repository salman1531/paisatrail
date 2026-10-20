import {activityChange} from '../src/reviewLogic';
import {describe,it,expect} from 'vitest';
import {newDemo} from '../src/demo';
import {filtered,totals} from '../src/finance';
import {moneyPlanSummary,spendingSummary,periodFilter} from '../src/planning';
import type {Entry,Kind} from '../src/types';
const period={start:'2026-10-01',end:'2026-10-31'};
function fixture(){
 const ledger=newDemo(); const user=ledger.profile.user_id;
 const row=(id:string,kind:Kind,amount_minor:number,extra:Partial<Entry>={}):Entry=>({id,user_id:user,category_id:ledger.categories.find(c=>c.kind===kind)!.id,date:'2026-10-10',currency:'PKR',amount_minor,notes:'',withdrawal:false,...extra});
 ledger.entries=[row('income','income',100000),row('expense','expense',35000),row('saving','saving',30000,{named_goal_id:'goal'}),row('saving-back','saving',5000,{withdrawal:true,named_goal_id:'goal'}),row('investment','investment',20000),row('investment-back','investment',15000,{withdrawal:true}),row('foreign','expense',900000,{currency:'USD'}),row('earlier','expense',100000,{date:'2026-09-30'})];
 ledger.namedGoals=[{id:'goal',user_id:user,name:'Fictional purchase',currency:'PKR',funding_kind:'saving',status:'active',target_minor:200000,starting_minor:40000,deadline:null}];
 ledger.contributionPlans=[{id:'plan',user_id:user,goal_id:'goal',period_start:period.start,period_end:period.end,amount_minor:20000}];
 ledger.spendingBudgets=[{id:'budget',user_id:user,period_start:period.start,period_end:period.end,currency:'PKR',total_minor:50000,rollover:false}];ledger.budgetAllocations=[];
 ledger.expectedPayments=[];
 return ledger;
}
describe('financial meaning baseline before presentation changes',()=>{
 it('reconciles signed contributions once without including plans, starting savings or other scopes',()=>{
  const l=fixture(),before=JSON.stringify(l),actual=totals(l,filtered(l.entries,{...periodFilter(period),currency:'PKR'}),'PKR'),summary=moneyPlanSummary(l,period,'PKR');
  expect(actual).toEqual({income:100000,expense:35000,saving:25000,investment:5000});
  expect(summary.recordedLeft).toBe(35000);expect(summary.spending.remaining).toBe(15000);expect(summary.unallocated).toBe(30000);
  expect(JSON.stringify(l)).toBe(before);
 });
 it('adds net withdrawals back to the residual without turning them into earned income',()=>{
  const l=fixture();l.entries=l.entries.filter(e=>!['saving','investment'].includes(e.id));
  const s=moneyPlanSummary(l,period,'PKR');expect(s.received).toBe(100000);expect(s.actual.saving).toBe(-5000);expect(s.actual.investment).toBe(-15000);expect(s.recordedLeft).toBe(85000);
 });
 it('distinguishes an absent budget, an intentional zero and overspending',()=>{
  const l=fixture();l.spendingBudgets=[];expect(spendingSummary(l,period,'PKR').remaining).toBeNull();
  l.spendingBudgets=[{id:'zero',user_id:l.profile.user_id,period_start:period.start,period_end:period.end,currency:'PKR',total_minor:0,rollover:false}];
  expect(spendingSummary(l,period,'PKR')).toMatchObject({target:0,remaining:-35000});
 });
 it('includes positive unused rollover in the spending allowance, never recorded income',()=>{
  const l=fixture();l.entries=l.entries.filter(e=>e.date.startsWith('2026-10'));
  l.spendingBudgets![0].rollover=true;l.spendingBudgets!.push({id:'prior',user_id:l.profile.user_id,period_start:'2026-09-01',period_end:'2026-09-30',currency:'PKR',total_minor:5000,rollover:false});
  const s=moneyPlanSummary(l,period,'PKR');expect(s.spending).toMatchObject({base:50000,carry:5000,target:55000,remaining:20000});expect(s.received).toBe(100000);expect(s.recordedLeft).toBe(35000);
 });
});

describe('factual activity comparisons',()=>{
 it('distinguishes missing records from observed zero totals',()=>{
  expect(activityChange(200,0,1,0)).toMatchObject({change:null,percent:null});
  expect(activityChange(0,200,0,1)).toMatchObject({change:null,percent:null});
  expect(activityChange(200,0,1,2)).toMatchObject({change:200,percent:null});
 });
 it('reports signed differences without claiming a financial improvement',()=>{
  expect(activityChange(50,100,1,1)).toMatchObject({change:-50,percent:-50,message:'Lower across these comparison dates.'});
  expect(activityChange(-100,-200,1,1)).toMatchObject({change:100,percent:null});
  expect(activityChange(100,100,1,1)).toMatchObject({change:0,percent:0});
 });
});
