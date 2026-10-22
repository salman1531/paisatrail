import {upcomingRecurring} from './recurring';
import {paymentProgress} from './planning';
import {today} from './finance';
import MoneyValue from './MoneyValue';
import type {Ledger,PlanningPeriod} from './types';
export default function UpcomingSummary({ledger,period,account='all',review}:{ledger:Ledger;period:PlanningPeriod;account?:string;review:(page:string)=>void}){
 const now=today(ledger.profile.timezone),c=ledger.profile.currency;
 const repeats=upcomingRecurring(ledger,period.start,period.end).filter(({schedule:s})=>s.currency===c&&(account==='all'||account==='__unassigned__'?!s.account_id||account==='all':s.account_id===account)).map(({schedule:s,date})=>({id:s.id+date,name:s.name,date,amount:s.amount_minor,type:s.kind==='expense'?'Not paid':'Expected income',page:'accounts'}));
 const expected=account==='all'?(ledger.expectedPayments??[]).filter(p=>p.currency===c&&p.expected_date&&p.expected_date>=period.start&&p.expected_date<=period.end&&paymentProgress(ledger,p).remaining>0&&!p.cancelled).map(p=>({id:p.id,name:p.name,date:p.expected_date!,amount:paymentProgress(ledger,p).remaining,type:'Expected income',page:'income'})):[];
 const rows=[...repeats,...expected].sort((a,b)=>a.date.localeCompare(b.date));
 if(!rows.length)return null;
 return <section className="panel upcoming-summary"><div className="panel-head"><div><h2>Upcoming & unpaid</h2><p>{c} · Expected items, excluded from actual totals</p></div></div><ul className="recurring-list">{rows.slice(0,4).map(r=><li key={r.id}><div><strong>{r.name}</strong><small className={r.date<now?'status-warning':undefined}>{r.date<now?'Overdue · ':''}{r.date} · {r.type}</small></div><MoneyValue amount={r.amount} currency={c}/><button className="text-button" onClick={()=>review(r.page)}>Review</button></li>)}</ul>{rows.length>4&&<p className="small muted">{rows.length-4} more expected items. Review Income and Accounts for the full schedule.</p>}</section>;
}
