import {expect,it} from 'vitest';
import {spendingComparison} from '../src/ActivityCharts';
import {periodFilter} from '../src/planning';
import type {Ledger} from '../src/types';

it('compares the same elapsed days in the selected currency and exposes the matching record dates',()=>{
 const expense=(date:string,amount_minor:number,currency='PKR')=>({date,amount_minor,currency,category_id:'food'});
 const ledger={
  profile:{currency:'PKR',timezone:'UTC'},categories:[{id:'food',kind:'expense'}],
  entries:[expense('2026-10-05',18000),expense('2026-09-05',12000),expense('2026-09-06',100000),expense('2026-10-05',5000,'USD')]
 } as Ledger;
 const period={start:'2026-10-01',end:'2026-10-31'};
 const results=spendingComparison(ledger,period,periodFilter(period),true,'2026-10-05')!;
 expect(results.map(p=>[p.range,p.amount,p.count])).toEqual([
  [{start:'2026-10-01',end:'2026-10-05'},18000,1],
  [{start:'2026-09-01',end:'2026-09-05'},12000,1]
 ]);
 expect(results[1].scope).toMatchObject({startDate:'2026-09-01',endDate:'2026-09-05',currency:'PKR'});
 expect(spendingComparison(ledger,period,periodFilter(period),true,'2026-09-30')).toBeNull();
 const full=spendingComparison(ledger,period,periodFilter(period),true,'2026-11-01')!;
 expect(full[0].range.end).toBe('2026-10-30');
});
