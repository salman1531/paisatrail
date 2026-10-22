import {financialAccountsEnabled} from './productFeatures';
import {useState} from 'react';
import {IncomeSourceBreakdown,AccountBreakdown} from './ReportBreakdowns';
import {analysisFilter} from './analytics';
import MoneyValue from './MoneyValue';
import {addDays,periodForDate,periodFilter,periodLabel} from './planning';
import {comparisonRanges,activityChange} from './reviewLogic';
import {filtered,totals,today} from './finance';
import type {Ledger,PlanningPeriod,Filter} from './types';
const activity=['income','expense','saving','investment'] as const;
const labels={income:'Income recorded',expense:'Spending',saving:'Net savings contributions',investment:'Net investment contributions'};
export default function OverviewInsights({ledger,period,calendar,account,records}:{ledger:Ledger;period:PlanningPeriod;calendar:boolean;account:string;records:(filter:Filter)=>void}) {
 const [fullPrevious,setFullPrevious]=useState(false);
 account=financialAccountsEnabled?account:'all';
 const currency=ledger.profile.currency,filter=analysisFilter(period,null,account,currency);
 const previous=periodForDate(addDays(period.start,-1),ledger.budgetCycles,calendar),ranges=comparisonRanges(period,previous,today(ledger.profile.timezone),fullPrevious);
 const currentEntries=filtered(ledger.entries,{...periodFilter(ranges.current),currency,account}),priorEntries=filtered(ledger.entries,{...periodFilter(ranges.previous),currency,account});
 const current=totals(ledger,currentEntries,currency),before=totals(ledger,priorEntries,currency);
 const accountLabel=account==='all'?'All accounts and unassigned':account==='__unassigned__'?'Unassigned':ledger.accounts?.find(a=>a.id===account)?.name??'Selected account';
 return <details className="panel overview-insights"><summary>More insights</summary><p className="insights-description">Compare periods and review income sources.</p><p className="recorded-basis">{periodLabel(period)} · {currency} only{financialAccountsEnabled?' · '+accountLabel:''}</p><div className="insights-content">
<section className="panel period-comparison"><div className="panel-head"><h2>Compare activity</h2><details className="context-help"><summary>Comparison details</summary><p>Only saved records through the current comparison end are included. Savings and investments are net of withdrawals. Missing earlier records do not imply an improvement. Matching elapsed days is capped at the previous period end; full periods and transition periods can have different lengths.</p></details></div>
 <div className="comparison-heading"><p className="comparison-status">{ranges.notStarted?'Not started':ranges.inProgress?'Through '+new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short'}).format(new Date(ranges.asOf+'T12:00:00')):'Completed period'}</p>{ranges.inProgress&&<label className="comparison-mode"><span className="sr-only">Compare with</span><select aria-label="Comparison mode" value={fullPrevious?'full':'elapsed'} onChange={e=>setFullPrevious(e.target.value==='full')}><option value="elapsed">Matching elapsed days</option><option value="full">Full previous period</option></select></label>}</div>
 <p className="comparison-method">{ranges.inProgress&&!fullPrevious?'Matching elapsed days':'Full previous period'} · {currency} only</p><dl className="comparison-ranges"><div><dt>Current</dt><dd>{periodLabel(ranges.current)}</dd></div><div><dt>Previous</dt><dd>{periodLabel(ranges.previous)}</dd></div></dl>
 {ranges.notStarted?<p>No activity comparison yet.</p>:<div className="activity-comparison-list">{activity.map(k=>{const currentCount=currentEntries.filter(e=>ledger.categories.find(c=>c.id===e.category_id)?.kind===k).length,priorCount=priorEntries.filter(e=>ledger.categories.find(c=>c.id===e.category_id)?.kind===k).length,change=activityChange(current[k],before[k],currentCount,priorCount);return <article key={k} className="activity-comparison-row"><h3>{labels[k]}</h3><dl><div><dt>Current</dt><dd>{currentCount?<MoneyValue amount={current[k]} currency={currency}/>:'No records'}</dd></div><div><dt>Previous</dt><dd>{priorCount?<MoneyValue amount={before[k]} currency={currency}/>:'No earlier records'}</dd></div><div><dt>Change</dt><dd>{currentCount&&priorCount?<MoneyValue amount={current[k]-before[k]} currency={currency}/>:'—'}</dd></div></dl><p className="comparison-insight">{change.message}{change.percent!==null&&<> {Math.abs(change.percent).toFixed(1)}% {change.percent<0?'lower':change.percent>0?'higher':'change'}.</>}{change.change!==null&&change.percent===null&&<> A percentage is not shown from a zero or negative earlier value.</>}</p></article>;})}</div>}
 </section>
 <IncomeSourceBreakdown ledger={ledger} filter={filter}/>
 {financialAccountsEnabled&&<AccountBreakdown ledger={ledger} filter={filter} records={records}/>}
 </div></details>;
}
