import {ChartPanel,EmptyState,BarChart} from './WorkspaceUI';
import {useMemo} from 'react';
import {activitySeries,cumulativeMovement,type ActivityBucket} from './analytics';
import MoneyValue from './MoneyValue';
import {filtered,money,totals} from './finance';
import {addDays,periodFilter,periodForDate} from './planning';
import {compactPeriodLabel} from './PeriodControls';
import type {PlanningPeriod} from './types';
import type {Filter,Ledger,Kind} from './types';
import {reportPeriodLabel} from './ReportPeriod';
import {trackedBalance} from './accounts';
import {today} from './finance';
type Props={ledger:Ledger;filter:Filter;records:(kind:Kind|undefined,dates?:Filter)=>void};
function DataTable({rows,currency,open}:{rows:ActivityBucket[];currency:Ledger['profile']['currency'];open?:(kind:'income'|'expense',row:ActivityBucket)=>void}){return <details className="chart-data"><summary>View exact amounts</summary><div className="table-scroll"><table><caption>Recorded income and expenses by period · {currency}</caption><thead><tr><th>Period</th><th>Income</th><th>Expenses</th><th>Net movement</th></tr></thead><tbody>{rows.map(r=><tr key={r.start}><th scope="row">{compactPeriodLabel(r)}</th>{(['income','expense'] as const).map(k=><td key={k}>{open?<button type="button" className="text-button" aria-label={`View ${k==='expense'?'expenses':'income'} · ${compactPeriodLabel(r)} · ${money(r[k],currency)}`} onClick={()=>open(k,r)}><MoneyValue amount={r[k]} currency={currency}/></button>:<MoneyValue amount={r[k]} currency={currency}/>}</td>)}<td><MoneyValue amount={r.net} currency={currency}/></td></tr>)}</tbody></table></div></details>;}
/** Match the day count, including when the previous cycle is shorter. */
export function spendingComparison(ledger:Ledger,period:PlanningPeriod,filter:Filter,calendar:boolean,now=today(ledger.profile.timezone)){
 if(now<period.start)return null;
 const prior=periodForDate(addDays(period.start,-1),ledger.budgetCycles,calendar);
 const days=(start:string,end:string)=>Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
 const count=Math.min(days(period.start,now<period.end?now:period.end),days(prior.start,prior.end));
 const categoryIds=new Set(ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id));
 return [period,prior].map(p=>{
  const range={start:p.start,end:addDays(p.start,count-1)},scope={...filter,...periodFilter(range),currency:ledger.profile.currency};
  const entries=filtered(ledger.entries,scope).filter(e=>categoryIds.has(e.category_id));
  return {range,scope,count:entries.length,amount:totals(ledger,entries,ledger.profile.currency).expense};
 });
}
export function IncomeExpenseChart({ledger,filter,records,period,calendar=false}:Props&{period?:PlanningPeriod;calendar?:boolean}){
 const rows=useMemo(()=>activitySeries(ledger,filter),[ledger,filter]),c=ledger.profile.currency,comparison=period?spendingComparison(ledger,period,filter,calendar):null;
 const open=(kind:Kind,r:ActivityBucket)=>records(kind,{...filter,startDate:r.start,endDate:r.end});
 return <ChartPanel title="Income vs expenses" actions={<button className="text-button" onClick={()=>records(undefined)}>View records</button>}><p className="small muted">{reportPeriodLabel(filter)} · {c}</p><BarChart label="Received income and expenses" currency={c} rows={rows.map(r=>({id:r.start,label:r.label,values:[{id:'income',label:'Received income',amount:r.income,colour:'var(--chart-income)'},{id:'expense',label:'Expenses',amount:r.expense,colour:'var(--chart-expense)'}]}))} select={(id,series)=>{const r=rows.find(r=>r.start===id)!;open(series as Kind,r);}}/><DataTable rows={rows} currency={c} open={open}/>{period&&<section className="spending-comparison" aria-label="Spending compared with the previous period"><h3>Spending comparison · {c}</h3>{comparison?<><p className="small muted">Same number of days from the start of each period.</p><div className="spending-comparison-values">{comparison.map(({range,scope,count,amount},index)=><div key={range.start}><span>{index?'Previous':'Current'} · {compactPeriodLabel(range)}</span>{count?<button type="button" className="text-button" onClick={()=>records('expense',scope)}><MoneyValue amount={amount} currency={c}/><span className="sr-only"> · View {index?'previous':'current'} expenses</span></button>:<strong>{index?'No earlier expense records':'No expense records'}</strong>}</div>)}</div>{comparison.some(p=>!p.count)&&<p className="small muted">Comparison unavailable for these dates.</p>}</>:<p className="small muted">This period has not started. Comparison unavailable.</p>}</section>}</ChartPanel>;
}
export function MovementChart({ledger,filter,forceMovement=false}:Pick<Props,'ledger'|'filter'>&{forceMovement?:boolean}){
 const rows=useMemo(()=>cumulativeMovement(activitySeries(ledger,filter)),[ledger,filter]),last=rows.at(-1)?.cumulative??0,lo=Math.min(0,...rows.map(r=>r.cumulative)),hi=Math.max(1,...rows.map(r=>r.cumulative));
 const point=(n:number,i:number)=>`${38+i*(480/Math.max(1,rows.length-1))},${160-(n-lo)/(hi-lo)*125}`;
 if(!forceMovement&&trackedBalance(ledger,ledger.profile.currency,today(ledger.profile.timezone),filter.account)!==null)return <BalanceHistory ledger={ledger} filter={filter}/>;
 return <section className="panel movement-panel"><div className="panel-head"><div><h2>Recorded cash movement</h2><p>Income less expenses · {ledger.profile.currency} only</p></div></div><strong className="chart-total"><MoneyValue amount={last} currency={ledger.profile.currency}/></strong><p className="small muted">Cumulative within this period, before savings and investment allocations. This is not an account balance.</p><svg viewBox="0 0 550 205" role="img" aria-label={`Net movement ${money(last,ledger.profile.currency)}. Exact period values follow.`}><line x1="38" x2="518" y1={160-(0-lo)/(hi-lo)*125} y2={160-(0-lo)/(hi-lo)*125} className="chart-grid-line"/><polyline points={rows.map((r,i)=>point(r.cumulative,i)).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="3"/>{rows.map((r,i)=><circle key={r.start} cx={point(r.cumulative,i).split(',')[0]} cy={point(r.cumulative,i).split(',')[1]} r="4" fill="var(--primary)"/>)}<text x="38" y="195" className="chart-axis-label">{rows[0]?.label}</text><text x="518" y="195" textAnchor="end" className="chart-axis-label">{rows.at(-1)?.label}</text></svg><DataTable rows={rows} currency={ledger.profile.currency}/></section>;
}
function BalanceHistory({ledger,filter}:Pick<Props,'ledger'|'filter'>){
 const now=today(ledger.profile.timezone),buckets=activitySeries(ledger,filter),dates=buckets.map(b=>b.end).filter(d=>d<=now);
 if(buckets[0]?.start<=now&&buckets.at(-1)!.end>=now&&!dates.includes(now))dates.push(now);
 const rows=dates.map(date=>({date,value:trackedBalance(ledger,ledger.profile.currency,date,filter.account)}));
 const known=rows.filter((r):r is {date:string;value:number}=>r.value!==null),lo=Math.min(0,...known.map(r=>r.value)),hi=Math.max(1,...known.map(r=>r.value)),last=known.at(-1);
 return <section className="panel movement-panel"><div className="panel-head"><div><h2>Account balance over time</h2><p>Opened accounts · {ledger.profile.currency} · period-end snapshots</p></div></div>{last?<strong className="chart-total"><MoneyValue amount={last.value} currency={ledger.profile.currency}/></strong>:<p>No known account balance in this range.</p>}<p className="small muted">Opening balances plus assigned activity and transfers. Unassigned records and forecasts are excluded. New accounts enter from their opening date.</p>{known.length>0&&<svg viewBox="0 0 550 205" role="img" aria-label={`Tracked account balance ${money(last!.value,ledger.profile.currency)} as of ${last!.date}. Exact values follow.`}><polyline points={known.map((r,i)=>`${38+i*480/Math.max(1,known.length-1)},${160-(r.value-lo)/(hi-lo)*125}`).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="3"/>{known.map((r,i)=><circle key={r.date} cx={38+i*480/Math.max(1,known.length-1)} cy={160-(r.value-lo)/(hi-lo)*125} r="4" fill="var(--primary)"/>)}<text x="38" y="195" className="chart-axis-label">{known[0].date}</text><text x="518" y="195" textAnchor="end" className="chart-axis-label">{last!.date}</text></svg>}<details className="chart-data"><summary>View exact balances</summary><div className="table-scroll"><table><caption>Tracked accounts · {ledger.profile.currency}</caption><thead><tr><th>Date</th><th>Balance</th></tr></thead><tbody>{rows.map(r=><tr key={r.date}><th>{r.date}</th><td>{r.value===null?'Not known yet':<MoneyValue amount={r.value} currency={ledger.profile.currency}/>}</td></tr>)}</tbody></table></div></details></section>;
}
