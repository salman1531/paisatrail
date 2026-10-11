import {money} from './finance';
import {incomeSummary,spendingSummary,periodForDate,goalProgress} from './planning';
import {filtered,totals} from './finance';
import {reportPeriodLabel} from './ReportPeriod';
import type {Filter, Kind, Ledger} from './types';
export default function OverviewSummary({ledger,filter,editGoals,details,addExpense,busy}:{ledger:Ledger;filter:Filter;editGoals:()=>void;details:(kind?:Kind)=>void;addExpense:()=>void;busy:boolean}) {
 const c=ledger.profile.currency,p=filter.startDate&&filter.endDate?{start:filter.startDate,end:filter.endDate}:periodForDate(filter.year+'-'+filter.month+'-01',[],true);const values=totals(ledger,filtered(ledger.entries,filter),c),expense={...spendingSummary(ledger,p,c),percent:0,source:'Saved spending plan · Category limits are included within the overall allowance'};expense.percent=expense.target?values.expense/expense.target*100:values.expense>0?100:0;const income=incomeSummary(ledger,p,c);
 const left=values.income-values.expense-values.saving-values.investment;
 const monthly=!filter.startDate&&filter.year!=='all'&&filter.month!=='all';
 const cards=[
  {id:'income',name:'Income recorded',amount:values.income,foot:'Money received',kind:'income' as Kind},
  {id:'remaining',name:'Income left after allocations',amount:values.income<=0?null:left,foot:values.income<=0?'Record income to see this total':'Income − spending − net contributions',negative:values.income>0&&left<0},
  {id:'saving',name:'Savings added, net',amount:values.saving,foot:'Contributions minus withdrawals',kind:'saving' as Kind},
  {id:'investment',name:'Investments added, net',amount:values.investment,foot:'Contributions, not market value',kind:'investment' as Kind}
 ];
 return <section className="overview-summary" aria-label="Financial overview">
  <div className={`budget-hero ${expense.remaining!==null&&expense.remaining<0?'over-budget':''}`}>
   <p className="summary-scope">{reportPeriodLabel(filter)} · {c} only · All categories</p>
   <h2>{expense.remaining===null?'Budget not set':expense.remaining<0?'Over budget':'Budget remaining'}</h2>
   <strong className="budget-hero-amount">{expense.remaining===null?'Set your monthly budget':money(Math.abs(expense.remaining),c)}</strong>
   <p className="budget-spent">{money(values.expense,c)} spent{expense.target===null?' · No target set':` of ${money(expense.target,c)}`} · {reportPeriodLabel(filter)}</p>
   {expense.target!==null&&<div className="budget-hero-progress" role="progressbar" aria-label="Expense budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.max(0,expense.percent??(values.expense>0?100:0)))} aria-valuetext={expense.target===0?'Zero budget target':`${expense.percent?.toFixed(1)}% spent`}><span style={{width:`${Math.min(100,Math.max(0,expense.percent??(values.expense>0?100:0)))}%`}}/></div>}
   <div className="budget-hero-actions"><button className="button" onClick={addExpense} disabled={busy}>Add expense</button><button className="text-button" onClick={editGoals}>{expense.target===null?'Set budget':'Edit budget'}</button><button className="text-button" onClick={()=>details('expense')}>{monthly?'Spent this month':'Spending records'}</button></div>
   <small>{expense.target===null?'Budgets are optional. You can record expenses now.':expense.source}</small>
  </div>
  <details className="supporting-totals"><summary>Income, savings & investments</summary><div className="summary-grid supporting-summary-grid">{cards.map(card=><button key={card.id} className={`summary-card ${card.id} ${card.negative?'negative':''}`} onClick={()=>details(card.kind)} aria-label={card.name+' summary'}><span>{card.name}</span><strong>{card.amount===null?'—':money(card.amount,c)}</strong><small>{card.foot}</small></button>)}</div><p className="small muted">Income left after allocations = income recorded − spending − net savings − net investments. This is a record-based total, not a bank balance. Category limits are included within your overall budget.</p></details>
   <div className="overview-planning-preview"><span>Forecast only: {money(income.remaining,c)} still expected</span><span>{(ledger.namedGoals??[]).filter(g=>g.status==='active').length} active goals</span></div>
  {!!ledger.namedGoals?.length&&<details className="supporting-totals"><summary>Named goal progress · Lifetime</summary><div className="planning-cards">{ledger.namedGoals.filter(g=>g.status==='active').slice(0,3).map(g=><div className="planning-card" key={g.id}><h3>{g.name}</h3><p>{money(goalProgress(ledger,g).saved,g.currency)} of {money(g.target_minor,g.currency)}</p><progress max={100} value={goalProgress(ledger,g).percent} aria-label={g.name+' progress'}/></div>)}</div></details>}
 </section>;
}
