import {money} from './finance';
import {budgetReport,reportTarget} from './budgetReport';
import type {Filter, Kind, Ledger} from './types';
export default function OverviewSummary({ledger,filter,editGoals,details}:{ledger:Ledger;filter:Filter;editGoals:()=>void;details:(kind?:Kind)=>void}) {
 const {values,main}=budgetReport(ledger,filter);const c=ledger.profile.currency;
 const incomeTarget=reportTarget(ledger,filter,'income').target;const expense=main[0],left=values.income-values.expense-values.saving-values.investment;
 const cards=[
  {id:'income',name:'Recorded income',amount:values.income,foot:incomeTarget===null?'View earnings':`Goal ${money(incomeTarget,c)}`,kind:'income' as Kind},
  {id:'budget',name:'Expense budget',amount:expense.target,foot:expense.target===null?'Set monthly goals':expense.source,goals:true},
  {id:'expense',name:'Actual expenses',amount:values.expense,foot:expense.remaining===null?'Budget not set':expense.remaining<0?`${money(-expense.remaining,c)} over budget`:`${money(expense.remaining,c)} budget remaining`,kind:'expense' as Kind},
  {id:'remaining',name:values.income<=0?'Income not recorded':left<0?'Above recorded income':'Recorded income remaining',amount:values.income<=0?null:Math.abs(left),foot:'After expenses & net contributions',negative:values.income>0&&left<0},
  {id:'saving',name:'Net savings',amount:values.saving,foot:'Contributions minus withdrawals',kind:'saving' as Kind},
  {id:'investment',name:'Net investments',amount:values.investment,foot:'Contributions, not market value',kind:'investment' as Kind}
 ];
 return <section className="overview-summary" aria-label="Financial overview"><p className="summary-scope">All categories · {c} only · selected period</p><div className="summary-grid compact-summary-grid">{cards.map(card=><button key={card.id} className={`summary-card ${card.id} ${card.negative?'negative':''}`} onClick={()=>card.goals?editGoals():details(card.kind)} aria-label={card.name+' summary'}><span>{card.name}</span><strong>{card.amount===null?card.id==='budget'?'Not set':'—':money(card.amount,c)}</strong><small>{card.foot}</small></button>)}</div><details className="summary-explainer"><summary>How these totals work</summary><p>Recorded income remaining is income minus expenses and net savings/investment contributions. It is not a bank balance. Plans are compared with actual records; unsaved contributions are not deducted.</p>{expense.target!==null&&<p>{expense.source}. Category limits are included within the expense budget.</p>}</details></section>;
}
