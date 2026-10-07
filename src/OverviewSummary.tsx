import {filtered, money, totals} from './finance';
import {periodGoalRows} from './goals';
import type {Filter, Ledger} from './types';

export default function OverviewSummary({ledger,filter,editGoals}:{ledger:Ledger;filter:Filter;editGoals:()=>void}) {
  const currency=ledger.profile.currency;
  const values=totals(ledger,filtered(ledger.entries,{...filter,category:'all'}),currency);
  const rows=filter.month==='all'?[]:periodGoalRows(ledger,filter);
  const expense=rows.find(r=>r.category_id===null&&r.kind==='expense');
  const savings=rows.find(r=>r.category_id===null&&r.kind==='saving');
  const left=values.income-values.expense-values.saving-values.investment;
  function progress(actual:number,target:number|null|undefined,label:string){return target!=null&&target>0 ? <div className={`summary-progress ${actual>target&&label==='Spending'?'over':''}`} role="progressbar" aria-label={label+' progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,actual/target*100))} aria-valuetext={`${money(actual,currency)} of ${money(target,currency)}`}><span style={{width:`${Math.max(0,Math.min(100,actual/target*100))}%`}}/></div>:null;}
  return <section className="overview-summary" aria-label="Financial overview"><p className="summary-scope">All categories · {currency} only · selected period</p><div className="summary-grid">
    <section className="summary-card remaining" role="group" aria-label="Income remaining summary"><span>{values.income<=0?'Income not recorded':left<0?'Above recorded income':'Remaining income'}</span><strong className={values.income>0&&left<0?'negative':''}>{values.income<=0?'—':money(Math.abs(left),currency)}</strong><p>{values.income<=0?'Add actual income to see what remains.':'After expenses, savings and investments. Not a bank balance.'}</p><div className="summary-fact">Recorded income <b>{money(values.income,currency)}</b></div></section>
    <section className="summary-card"><span>Spending against budget</span><strong>{money(values.expense,currency)}</strong>{expense?.target!=null?<><p>of {money(expense.target,currency)} budget</p>{progress(values.expense,expense.target,'Spending')}<small className={values.expense>expense.target?'negative':''}>{money(Math.abs(expense.target-values.expense),currency)} {values.expense>expense.target?'over budget':'left to spend'}</small><small>{expense.source}</small></>:<><p>No budget set for this period.</p>{filter.month!=='all'&&<button className="text-button" onClick={editGoals}>Set a monthly budget</button>}</>}</section>
    <section className="summary-card savings"><span>Savings progress</span><strong>{money(values.saving,currency)}</strong>{savings?.target!=null?<><p>of {money(savings.target,currency)} savings goal</p>{progress(values.saving,savings.target,'Savings')}<small>{values.saving>=savings.target?'Savings goal reached':`${money(savings.target-values.saving,currency)} to goal`}</small><small>{savings.source}</small></>:<p>Net savings contributions.</p>}<div className="summary-fact">Net investments <b>{money(values.investment,currency)}</b></div></section>
  </div></section>;
}
