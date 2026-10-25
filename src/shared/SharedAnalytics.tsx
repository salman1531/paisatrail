import {useEffect,useState} from 'react';
import {dateLabel,money} from '../finance';
import {periodDates,validRange,spendingBuckets,type Scope,type Period} from './reporting';
import type {Report,Summary} from './model';
export type Drill={category?:string;participant?:string;role?:'paid'|'share';recordStart?:string;recordEnd?:string;context?:string};
export function ScopeControls({scope,rows,change,fixedSpace}:{scope:Scope;rows:Summary[];change:(patch:Partial<Scope>)=>void;fixedSpace?:boolean}){
 const [editing,setEditing]=useState(false),[from,setFrom]=useState(scope.start),[to,setTo]=useState(scope.end),[error,setError]=useState('');
 useEffect(()=>{setFrom(scope.start);setTo(scope.end);setError('');},[scope.start,scope.end]);
 return <section className="shared-scope-controls" aria-label="Reporting period and space">
  <div className="shared-filters"><label>Reporting period<select value={editing?'custom':scope.period} onChange={e=>{const period=e.target.value as Period;if(period==='custom'){setEditing(true);return;}setEditing(false);change({period,...periodDates(period),offset:0});}}><option value="all">All time</option><option value="month">This month</option><option value="last">Last month</option><option value="custom">Custom dates…</option></select></label>
  {!fixedSpace&&<label>Shared space<select value={scope.context} onChange={e=>change({context:e.target.value,offset:0,category:'',participant:''})}><option value="">All spaces</option>{rows.map(r=><option key={r.context.id} value={r.context.id}>{r.context.name}{r.context.archived?' · Archived':''}</option>)}</select></label>}
  <span className="shared-fixed-currency">Currency <b>PKR</b></span>{scope.period==='custom'&&<button className="text-button" onClick={()=>setEditing(v=>!v)}>Edit dates</button>}
  {(scope.period!=='all'||scope.context)&&<button className="text-button" onClick={()=>{setEditing(false);change({period:'all',start:'',end:'',context:'',offset:0,category:'',participant:'',recordStart:'',recordEnd:'',records:false});}}>Clear filters</button>}</div>
  {editing&&<form className="shared-date-editor" onSubmit={e=>{e.preventDefault();if(!validRange(from,to)){setError('Enter valid dates from 1900 to 2100, with From on or before To. Your current report has not changed.');return;}change({period:'custom',start:from,end:to,offset:0});setError('');setEditing(false);}}><p className="shared-date-draft">Editing dates · The report keeps its applied dates until you choose Apply dates.</p><label>From<input autoFocus required type="date" min="1900-01-01" max="2100-12-31" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input required type="date" min="1900-01-01" max="2100-12-31" value={to} onChange={e=>setTo(e.target.value)}/></label><button className="button secondary">Apply dates</button><button className="text-button" type="button" onClick={()=>{setEditing(false);setError('');}}>Keep current dates</button>{error&&<p className="form-error" role="alert">{error}</p>}</form>}
  <p className="shared-period-label">{scope.start?`${dateLabel(scope.start)} – ${dateLabel(scope.end)}`:'All time · All recorded dates'}{scope.context?' · '+(rows.find(r=>r.context.id===scope.context)?.context.name??'Selected space'):' · All shared spaces'} · PKR</p>
 </section>;
}
const Mask=()=> <p className="shared-empty">Amounts hidden. Show amounts to view chart values and proportions.</p>;
export function PeriodTotals({report,hidden}:{report:Report;hidden:boolean}){
 if(!report.totals)return <p className="shared-unavailable" role="status">Period summaries need the reporting update. Existing balances and records remain available.</p>;
 const t=report.totals;
 return <div className="shared-period-totals" role="group" aria-label="Included expenses in this period">{[['Shared spending',t.spending_minor],['Your share',t.share_minor],['You paid',t.paid_minor]].map(([label,value])=><div key={label}><span>{label}</span><strong>{hidden?'•••• PKR':money(Number(value),'PKR')}</strong></div>)}<p>{t.expense_count} included expenses · Cancelled expenses excluded</p></div>;
}
export function Trend({report,start,end,hidden,drill}:{report:Report;start:string;end:string;hidden:boolean;drill:(d:Drill)=>void}){
 if(!report.timeline)return <p className="shared-unavailable">Spending over time is unavailable until the reporting update is installed.</p>;
 if(hidden)return <Mask/>;
 const {interval,buckets}=spendingBuckets(report.timeline,start,end),max=Math.max(...buckets.map(b=>b.amount_minor),1);
 if(!buckets.length)return <p className="shared-empty">No included expenses in this period. Try another period or record an expense.</p>;
 return <><p className="small muted">{interval}ly shared expenses · PKR · Scale starts at zero</p><div className="shared-trend" role="group" aria-label={interval+'ly shared spending, select a bar to view expenses'}>{buckets.map(b=><button key={b.start} className="shared-trend-column" onClick={()=>drill({recordStart:b.start,recordEnd:b.end})} aria-label={`${dateLabel(b.start)} to ${dateLabel(b.end)}: ${money(b.amount_minor,'PKR')}. View included expenses.`}><span className="shared-trend-track"><span style={{height:(100*b.amount_minor/max)+'%'}}/></span><span>{dateLabel(b.start).replace(/ \d{4}$/,'')}</span></button>)}</div><details className="shared-chart-table"><summary>Exact spending values</summary><table><caption>{interval}ly shared spending · PKR</caption><thead><tr><th scope="col">Dates</th><th scope="col">Shared spending</th></tr></thead><tbody>{buckets.map(b=><tr key={b.start}><th scope="row"><button className="text-button" onClick={()=>drill({recordStart:b.start,recordEnd:b.end})}>{dateLabel(b.start)} – {dateLabel(b.end)}</button></th><td>{money(b.amount_minor,'PKR')}</td></tr>)}</tbody></table></details></>;
}
export function Categories({report,hidden,drill}:{report:Report;hidden:boolean;drill:(d:Drill)=>void}){
 if(hidden)return <Mask/>;
 const total=report.categories.reduce((n,c)=>n+c.amount_minor,0);
 if(!total)return <p className="shared-empty">No included category spending for these dates.</p>;
 return <div className="shared-bars"><p className="small muted">Share of included spending · 0–100%</p>{[...report.categories].sort((a,b)=>b.amount_minor-a.amount_minor).map(c=><button className="shared-bar-button" key={c.category} onClick={()=>drill({category:c.category})}><span><strong>{c.category}</strong><span>{money(c.amount_minor,'PKR')} · {(100*c.amount_minor/total).toFixed(1)}%</span></span><span className="shared-bar-track" aria-hidden="true"><span style={{width:(100*c.amount_minor/total)+'%'}}/></span></button>)}</div>;
}
export function PeopleComparison({report,rows,hidden,drill}:{report:Report;rows:Summary[];hidden:boolean;drill:(d:Drill)=>void}){
 if(hidden)return <Mask/>;
 const people=report.people.filter(p=>p.paid_minor||p.share_minor),max=Math.max(1,...people.flatMap(p=>[p.paid_minor,p.share_minor]));
 return <><p className="small muted">Paid is what each person covered. Share is their allocation. This is not remaining debt; confirmed repayments affect outstanding balances separately.</p><p className="shared-chart-legend"><span><i/>Paid</span><span><i/>Share</span></p>{!people.length?<p className="shared-empty">No paid or allocated amounts in this period.</p>:people.map(p=><div className="shared-person-chart" key={p.id}><strong>{p.name}</strong><small>{rows.find(r=>r.context.id===p.context_id)?.context.name}</small>{(['paid','share'] as const).map(role=>{const value=role==='paid'?p.paid_minor:p.share_minor;return <button key={role} onClick={()=>drill({participant:p.id,role,context:p.context_id})} className={'shared-comparison '+role}><span>{role==='paid'?'Paid':'Share'}</span><span className="shared-bar-track" aria-hidden="true"><span style={{width:(100*value/max)+'%'}}/></span><b>{money(value,'PKR')}</b></button>;})}</div>)}</>;
}
