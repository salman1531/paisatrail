import {useEffect,useRef,useState} from 'react';
import {BudgetsPanel,GoalsPanel} from './PlanningPanels';
import {moneyPlanSummary} from './planning';
import MoneyValue from './MoneyValue';
import type {BudgetAllocation,Currency,Entry,Kind,Ledger,NamedGoal,PlanningPeriod,SpendingBudget} from './types';
export type MoneyPlanSection='goals'|'spending';
export default function MoneyPlan({ledger,period,currency,busy,saveBudget,saveGoal,entry,link,records,changeCurrency,section}:{ledger:Ledger;period:PlanningPeriod;currency:Currency;busy:boolean;saveBudget:(b:SpendingBudget,rows:BudgetAllocation[])=>Promise<void>;saveGoal:(g:NamedGoal,a:number|null,legacyId?:string)=>Promise<void>;entry:(k:Kind,seed?:Partial<Entry>)=>void;link:(e:Entry)=>Promise<void>;records:()=>void;changeCurrency:(c:Currency)=>void;section?:{name:MoneyPlanSection;request:number}}) {
 const summary=moneyPlanSummary(ledger,period,currency),[editRequest,setEditRequest]=useState(0);
 const goalsRef=useRef<HTMLDivElement>(null),spendingRef=useRef<HTMLDivElement>(null);
 function focusSection(name:MoneyPlanSection){const element=(name==='goals'?goalsRef:spendingRef).current?.querySelector<HTMLElement>('section');element?.scrollIntoView({behavior:'instant',block:'start'});element?.focus({preventScroll:true});}
 useEffect(()=>{if(section)focusSection(section.name);},[section?.request]);
 const otherCurrencies=[...new Set((ledger.namedGoals??[]).filter(g=>g.currency!==currency).map(g=>g.currency))];
 return <div className="money-plan-page">
 <section className="panel money-plan-summary" aria-label="Period plan summary">
  <div className="panel-head"><h2>Planned commitments</h2></div>
  <dl className="plan-total-grid plan-commitment-values">
   <div><dt>Goals planned</dt><dd><MoneyValue amount={summary.plannedGoals} currency={currency}/></dd></div>
   <div><dt>Spending limit</dt><dd>{summary.spending.target===null?'No limit':<MoneyValue amount={summary.spending.target} currency={currency}/>}</dd></div>
  </dl>
  <details className="plan-details"><summary>Plan details</summary><dl className="plan-total-grid">
   <div className={summary.unallocated<0?'plan-deficit':'plan-remainder'}><dt>Unassigned in plan</dt><dd><MoneyValue amount={summary.unallocated} currency={currency}/></dd></div>
  </dl><details className="context-help"><summary aria-label="How the plan summary is calculated">How it works</summary><p>Unassigned in plan = received income − planned goal contributions − spending limit. When no spending limit exists, this is income after planned goals. Recorded spending and contributions fulfil commitments without assigning the same money again. These figures are not bank balances.</p></details></details>
  {summary.unallocated<0&&<div className="plan-warning" role="status"><strong>Plan exceeds received income by <MoneyValue amount={-summary.unallocated} currency={currency}/></strong><div className="planning-actions"><button className="text-button" disabled={busy} onClick={()=>setEditRequest(n=>n+1)}>Edit spending plan</button><button className="text-button" onClick={()=>focusSection('goals')}>Edit goal contributions</button></div></div>}
 </section>
 {otherCurrencies.length>0&&<p className="other-currency-goals">You also have goals in {otherCurrencies.join(', ')}. {otherCurrencies.map(c=><button className="text-button" key={c} onClick={()=>changeCurrency(c)}>View {c} goals</button>)}</p>}
 <div ref={goalsRef}><GoalsPanel ledger={ledger} period={period} currency={currency} busy={busy} save={saveGoal} entry={entry} link={link}/></div>
 <div ref={spendingRef}><BudgetsPanel ledger={ledger} period={period} currency={currency} busy={busy} save={saveBudget} editRequest={editRequest}/></div>
 <section className="panel recorded-money" aria-label="Recorded money">
  <div className="panel-head"><h2>Recorded money</h2><details className="context-help"><summary>How income left is calculated</summary><p>Income recorded − spending − net savings − net investments. Starting goal savings and upcoming income are excluded. This is based on your records, not a bank balance.</p></details></div>
  <dl className="recorded-money-values">
   <div className={summary.recordedLeft<0?'recorded-income-left recorded-deficit':'recorded-income-left'}><dt>Income left (recorded)</dt><small>Income after recorded outflows</small><dd><MoneyValue amount={summary.recordedLeft} currency={currency}/></dd></div>
   <div><dt>Income recorded</dt><dd><MoneyValue amount={summary.received} currency={currency}/></dd></div>
   <div><dt>Spending recorded</dt><dd><MoneyValue amount={summary.actual.expense} currency={currency}/></dd></div>
   <div><dt>Savings added, net</dt><dd><MoneyValue amount={summary.actual.saving} currency={currency}/></dd></div>
   <div><dt>Investments added, net</dt><dd><MoneyValue amount={summary.actual.investment} currency={currency}/></dd></div>
  </dl>
  <div className="planning-actions"><button className="text-button" disabled={busy} onClick={()=>entry('income')}>Record income</button><button className="text-button" disabled={busy} onClick={()=>entry('expense')}>Record expense</button><button className="text-button" onClick={records}>View Money Log</button></div>
 </section>


 </div>;
}
