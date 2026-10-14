import {describe,it,expect} from 'vitest';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import MoneyPlan from '../src/MoneyPlan';
import {eligibleGoalEntries} from '../src/reviewLogic';
import {newDemo} from '../src/demo';
import type {Entry,Ledger} from '../src/types';
const period={start:'2026-10-01',end:'2026-10-31'};
function render(ledger:Ledger){return renderToStaticMarkup(createElement(MoneyPlan,{ledger,period,currency:'PKR',busy:false,saveBudget:async()=>{},saveGoal:async()=>{},entry:()=>{},link:async()=>{},records:()=>{},changeCurrency:()=>{}}));}
describe('recorded money and existing savings',()=>{
 it('offers only owned, unlinked contributions in the fixed goal currency and funding type',()=>{
  const l=newDemo(),g=l.namedGoals![0],cat=l.categories.find(c=>c.kind==='saving')!;
  const base:Entry={id:'valid',user_id:l.profile.user_id,category_id:cat.id,currency:'PKR',date:'2026-10-01',amount_minor:50000,notes:'',withdrawal:false};
  l.entries=[base,{...base,id:'linked',named_goal_id:g.id},{...base,id:'usd',currency:'USD'},{...base,id:'foreign',user_id:'another-account'},{...base,id:'withdrawal',withdrawal:true},{...base,id:'zero',amount_minor:0},{...base,id:'income',category_id:l.categories.find(c=>c.kind==='income')!.id}];
  const before=JSON.stringify(l.entries);
  expect(eligibleGoalEntries(l,g,true).map(e=>e.id)).toEqual(['valid']);
  expect(eligibleGoalEntries(l,{...g,user_id:'another-account'},true)).toEqual([]);
  expect(eligibleGoalEntries(l,g).map(e=>e.id)).toEqual(['valid','withdrawal','zero']);
  expect(JSON.stringify(l.entries)).toBe(before);
 });
 it('renders received activity separately from commitments without deducting the plan twice',()=>{
  const l=newDemo(),html=render(l),recorded=html.match(/<section class="panel recorded-money"[\s\S]*?<\/section>/)![0],planned=html.match(/<section class="panel money-plan-summary"[\s\S]*?<\/section>/)![0];
  expect(recorded).toContain('Income left (recorded)');
  expect(recorded).toContain('66,240.00'); // 180,000 - 68,760 - 27,000 - 18,000
  expect(recorded).not.toContain('Unassigned in plan');
  expect(planned).toContain('41,400.00'); // 180,000 - 21,600 planned - 117,000 limit
  expect(planned).not.toContain('Income left (recorded)');
  expect(planned).toContain('<details class="plan-details"><summary>Plan details</summary>');
 });
 it('uses the same financial and action labels for demo and ordinary-account ledgers',()=>{
  const demo=newDemo(),normal=structuredClone(demo);normal.profile.user_id='ordinary-account';
  for(const rows of Object.values(normal))if(Array.isArray(rows))for(const row of rows)if(row&&typeof row==='object'&&'user_id' in row)row.user_id='ordinary-account';
  expect(render(normal)).toBe(render(demo));
 });
});
