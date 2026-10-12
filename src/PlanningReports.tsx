import {useState} from 'react';
import CashFlowChart from './CashFlowChart';
import AnalysisScope from './AnalysisScope';
import MoneyValue from './MoneyValue';
import {addDays,periodForDate,periodFilter,periodLabel} from './planning';
import {comparisonRanges} from './reviewLogic';
import {filtered,totals,today} from './finance';
import type {DrillScope} from './BudgetDashboard';
import type {Ledger,PlanningPeriod,Filter} from './types';
const activity=['income','expense','saving','investment'] as const;
const labels={income:'Income recorded',expense:'Spending',saving:'Savings added, net',investment:'Investments added, net'};
export default function PlanningReports({ledger,period,calendar,changePeriod,changeCurrency,records}:{ledger:Ledger;period:PlanningPeriod;calendar:boolean;changePeriod:(date:string)=>void;changeCurrency:(c:Ledger['profile']['currency'])=>void;records:(scope:DrillScope,filter:Filter)=>void}) {
 const [custom,setCustom]=useState<Filter|null>(null),[fullPrevious,setFullPrevious]=useState(false);
 const filter=custom??periodFilter(period),currency=ledger.profile.currency,entries=filtered(ledger.entries,{...filter,currency}),values=totals(ledger,entries,currency);
 const previous=periodForDate(addDays(period.start,-1),ledger.budgetCycles,calendar),ranges=comparisonRanges(period,previous,today(ledger.profile.timezone),fullPrevious);
 const currentEntries=filtered(ledger.entries,{...periodFilter(ranges.current),currency}),priorEntries=filtered(ledger.entries,{...periodFilter(ranges.previous),currency});
 const current=totals(ledger,currentEntries,currency),before=totals(ledger,priorEntries,currency);
 return <><AnalysisScope ledger={ledger} period={period} filter={custom} change={setCustom} changePeriod={changePeriod} currency={currency} changeCurrency={changeCurrency}/>
 <section className="panel report-actuals"><div className="panel-head"><h2>Recorded activity</h2><details className="context-help"><summary>About these totals</summary><p>Savings and investments are contributions minus withdrawals. Upcoming income is excluded. Open a total to see its Money Log records.</p></details></div>
 <div className="summary-grid">{activity.map(k=><button className="summary-card" key={k} onClick={()=>records({kind:k},filter)} aria-label={'View '+labels[k]+' records'}><span>{labels[k]}</span><strong><MoneyValue amount={values[k]} currency={currency}/></strong></button>)}</div></section>
 <CashFlowChart ledger={ledger} filter={filter} drill={scope=>records(scope,filter)} showScope={false}/>
 {!custom&&<section className="panel period-comparison"><div className="panel-head"><h2>Compare activity</h2><details className="context-help"><summary>Comparison details</summary><p>Only saved records through the current comparison end are included. Savings and investments are net of withdrawals. Missing earlier records do not imply an improvement. Matching elapsed days is capped at the previous period end; full periods and transition periods can have different lengths.</p></details></div>
 <div className="comparison-heading"><p className="comparison-status">{ranges.notStarted?'Not started':ranges.inProgress?'Through '+new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(ranges.asOf+'T12:00:00')):'Completed period'}</p>{ranges.inProgress&&<label className="comparison-mode"><span className="sr-only">Compare with</span><select aria-label="Comparison mode" value={fullPrevious?'full':'elapsed'} onChange={e=>setFullPrevious(e.target.value==='full')}><option value="elapsed">Matching elapsed days</option><option value="full">Full previous period</option></select></label>}</div>
 <dl className="comparison-ranges"><div><dt>Current</dt><dd>{periodLabel(ranges.current)}</dd></div><div><dt>Previous</dt><dd>{periodLabel(ranges.previous)}</dd></div></dl>
 {ranges.notStarted?<p>No activity comparison yet.</p>:<div className="activity-comparison-list">{activity.map(k=>{const currentCount=currentEntries.filter(e=>ledger.categories.find(c=>c.id===e.category_id)?.kind===k).length,priorCount=priorEntries.filter(e=>ledger.categories.find(c=>c.id===e.category_id)?.kind===k).length;return <article key={k} className="activity-comparison-row"><h3>{labels[k]}</h3><dl><div><dt>Current</dt><dd>{currentCount?<MoneyValue amount={current[k]} currency={currency}/>:'No records'}</dd></div><div><dt>Previous</dt><dd>{priorCount?<MoneyValue amount={before[k]} currency={currency}/>:'No earlier records'}</dd></div><div><dt>Change</dt><dd>{currentCount&&priorCount?<MoneyValue amount={current[k]-before[k]} currency={currency}/>:'—'}</dd></div></dl></article>;})}</div>}
 </section>}</>;
}
