import {useEffect,useRef,useState} from 'react';
import {BudgetsPanel,GoalsPanel} from './PlanningPanels';
import {moneyPlanSummary,periodLabel} from './planning';
import {money} from './finance';
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
  <p className="summary-scope">Whole-period plan · {periodLabel(period)} · {currency} only</p>
  <dl className="plan-total-grid">
   <div><dt>Income received</dt><dd>{money(summary.received,currency)}</dd></div>
   <div><dt>Planned goal contributions</dt><dd>{money(summary.plannedGoals,currency)}</dd></div>
   <div><dt>Spending limit</dt><dd>{summary.spending.target===null?'No spending limit set':money(summary.spending.target,currency)}</dd></div>
   <div className={summary.unallocated<0?'plan-deficit':'plan-remainder'}><dt>{summary.spending.target===null?'Income after planned goals':'Income not yet allocated'}</dt><dd>{money(summary.unallocated,currency)}</dd></div>
  </dl>
  {summary.spending.target===null&&<p className="small">Spending has not been planned.</p>}
  {summary.received===0&&<p className="small">No income recorded for this period. You can still make a plan.</p>}
  {summary.unallocated<0&&<div className="plan-warning" role="status"><strong>Plan exceeds received income by {money(-summary.unallocated,currency)}</strong><p>You can keep this plan or adjust it. This does not describe money outside your recorded income.</p><div className="planning-actions"><button className="text-button" disabled={busy} onClick={()=>setEditRequest(n=>n+1)}>Edit spending plan</button><button className="text-button" onClick={()=>focusSection('goals')}>Edit goal contributions</button></div></div>}
  <div className="planning-actions"><button className="text-button" disabled={busy} onClick={()=>entry('income')}>Record income</button><button className="text-button" disabled={busy} onClick={()=>entry('expense')}>Record expense</button></div>
  <p className="small muted">Planning figures, not cash or bank balances. Recording spending or contributions fulfils the plan; it does not allocate the same money again.</p>
 </section>
 {otherCurrencies.length>0&&<p className="other-currency-goals">You also have goals in {otherCurrencies.join(', ')}. {otherCurrencies.map(c=><button className="text-button" key={c} onClick={()=>changeCurrency(c)}>View {c} goals</button>)}</p>}
 <div ref={goalsRef}><GoalsPanel ledger={ledger} period={period} currency={currency} busy={busy} save={saveGoal} entry={entry} link={link}/></div>
 <div ref={spendingRef}><BudgetsPanel ledger={ledger} period={period} currency={currency} busy={busy} save={saveBudget} editRequest={editRequest}/></div>
 <details className="panel recorded-activity"><summary>Recorded activity</summary><dl className="plan-total-grid">
  <div><dt>Spending recorded</dt><dd>{money(summary.actual.expense,currency)}</dd></div>
  <div><dt>Savings added, net</dt><dd>{money(summary.actual.saving,currency)}</dd></div>
  <div><dt>Investments added, net</dt><dd>{money(summary.actual.investment,currency)}</dd></div>
  <div><dt>Recorded income left</dt><dd>{money(summary.recordedLeft,currency)}</dd></div>
 </dl><p className="small muted">Income received − spending − net savings − net investments. Based on entries recorded for this period; not your bank balance. Includes linked and unlinked contributions once; starting goal savings are excluded.</p><button className="text-button" onClick={records}>View recorded activity in Money Log</button></details>
 </div>;
}
