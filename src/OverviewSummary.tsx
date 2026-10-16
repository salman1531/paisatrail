import {money} from './finance';
import MoneyValue from './MoneyValue';
import {spendingSummary,periodForDate,goalProgress} from './planning';
import {filtered,totals} from './finance';
import type {Filter, Kind, Ledger} from './types';
export default function OverviewSummary({ledger,filter,editGoals,details,addExpense,busy}:{ledger:Ledger;filter:Filter;editGoals:()=>void;details:(kind?:Kind)=>void;addExpense:()=>void;busy:boolean}) {
 const c=ledger.profile.currency,p=filter.startDate&&filter.endDate?{start:filter.startDate,end:filter.endDate}:periodForDate(filter.year+'-'+filter.month+'-01',[],true);const values=totals(ledger,filtered(ledger.entries,filter),c),expense={...spendingSummary(ledger,p,c),percent:0,source:'Saved spending plan · Category limits are included within the overall allowance'};expense.percent=expense.target?values.expense/expense.target*100:values.expense>0?100:0;
 const left=values.income-values.expense-values.saving-values.investment;
 const monthly=!filter.startDate&&filter.year!=='all'&&filter.month!=='all';
 const cards=[
  {id:'income',name:'Income recorded',amount:values.income,foot:'Money received',kind:'income' as Kind},
  {id:'remaining',name:'Income left (recorded)',amount:values.income<=0?null:left,foot:values.income<=0?'Record income to see this total':'Income after recorded outflows',negative:values.income>0&&left<0},
  {id:'saving',name:'Savings added, net',amount:values.saving,foot:'Contributions minus withdrawals',kind:'saving' as Kind},
  {id:'investment',name:'Investments added, net',amount:values.investment,foot:'Contributions, not market value',kind:'investment' as Kind}
 ];
 return <section className="overview-summary" aria-label="Financial overview">
  <div className={`budget-hero ${expense.remaining!==null&&expense.remaining<0?'over-budget':''}`}>
   <h2>{expense.remaining===null?'Budget not set':expense.remaining<0?'Spending over budget':'Spending budget left'}</h2>
   <strong className="budget-hero-amount">{expense.remaining===null?'No spending limit':<MoneyValue amount={Math.abs(expense.remaining)} currency={c}/>}</strong>
   <p className="budget-explanation">Your spending allowance minus expenses.</p><p className="budget-spent"><MoneyValue amount={values.expense} currency={c}/> spent{expense.target!==null&&<> of <MoneyValue amount={expense.target} currency={c}/></>}</p>
   {expense.target!==null&&<div className="budget-hero-progress" role="progressbar" aria-label="Expense budget used" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.max(0,expense.percent??(values.expense>0?100:0)))} aria-valuetext={expense.target===0?'Zero budget target':`${expense.percent?.toFixed(1)}% spent`}><span style={{width:`${Math.min(100,Math.max(0,expense.percent??(values.expense>0?100:0)))}%`}}/></div>}
   <div className="budget-hero-actions"><button className="button" onClick={addExpense} disabled={busy}>Add expense</button><button className="text-button" onClick={editGoals}>{expense.target===null?'Set spending limit':'Edit spending plan'}</button><button className="text-button" onClick={()=>details('expense')}>{monthly?'Spent this month':'Spending records'}</button></div>
   <details className="context-help"><summary>About budget remaining</summary><p>Your spending limit minus recorded expenses, including any carryover. Category limits are included in the overall allowance. This is not a bank balance.</p></details>
  </div>
  <section className="supporting-totals" aria-label="Recorded money"><h2 className="summary-section-heading">Recorded money</h2><div className="summary-grid supporting-summary-grid">{cards.map(card=><button key={card.id} className={`summary-card ${card.id} ${card.negative?'negative':''}`} onClick={()=>details(card.kind)} aria-label={card.name+' summary'}><span>{card.name}</span><strong>{card.amount===null?'—':<MoneyValue amount={card.amount} currency={c}/>}</strong><small>{card.foot}</small></button>)}</div><details className="context-help"><summary>How income left is calculated</summary><p>Income recorded − spending − net savings − net investments. This is based on your records, not a bank balance.</p></details></section>
  {(ledger.namedGoals??[]).some(g=>g.status==='active'&&g.currency===c)&&<section className="overview-goals" aria-label="Goal progress"><div className="summary-section-heading">Goal progress <span className="small muted">Lifetime · {c}</span></div><div className="overview-goal-list">{ledger.namedGoals!.filter(g=>g.status==='active'&&g.currency===c).slice(0,3).map(g=>{const progress=goalProgress(ledger,g);return <article key={g.id}><div><h3>{g.name}</h3><span>{money(progress.saved,g.currency)} of {money(g.target_minor,g.currency)}</span></div><strong>{Math.round(progress.percent)}%</strong><progress max={100} value={progress.percent} aria-label={g.name+' progress'}/></article>;})}</div></section>}
 </section>;
}
