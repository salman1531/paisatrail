import {accountBalance,entryMovement,matchingTransfers} from './accounts';
import {today,filtered} from './finance';
import {activitySeries} from './analytics';
import MoneyValue from './MoneyValue';
import type {Ledger,Filter,Currency} from './types';
export function IncomeSourceBreakdown({ledger,filter}:{ledger:Ledger;filter:Filter}){
 const rows=filtered(ledger.entries,{...filter,currency:ledger.profile.currency}).filter(e=>ledger.categories.some(c=>c.id===e.category_id&&c.kind==='income'));
 const groups=new Map<string,{name:string;amount:number}>();
 for(const e of rows){const source=ledger.incomeSources?.find(s=>s.id===e.income_source_id),key=source?.id??'unassigned-'+e.category_id,previous=groups.get(key);groups.set(key,{name:source?.name??'Unassigned source · '+ledger.categories.find(c=>c.id===e.category_id)?.name,amount:(previous?.amount??0)+e.amount_minor});}
 const total=rows.reduce((sum,e)=>sum+e.amount_minor,0);
 return <section className="panel"><div className="panel-head"><div><h2>Income by source</h2><p>Received only · {ledger.profile.currency}</p></div></div>{!total?<p>No received income in this scope.</p>:<div className="source-bars">{[...groups].sort((a,b)=>b[1].amount-a[1].amount).map(([id,row])=><div key={id}><div><span>{row.name}</span><strong><MoneyValue amount={row.amount} currency={ledger.profile.currency}/></strong></div><progress value={row.amount} max={total} aria-label={`${row.name}: ${(row.amount/total*100).toFixed(1)}% of received income`}/></div>)}</div>}</section>;
}
export function AccountBreakdown({ledger,filter,records}:{ledger:Ledger;filter:Filter;records:(f:Filter)=>void}){
 const c=ledger.profile.currency,range=activitySeries(ledger,filter),start=range[0]?.start??today(),end=range.at(-1)?.end??today(),asOf=end<today(ledger.profile.timezone)?end:today(ledger.profile.timezone),transfers=matchingTransfers(ledger,{...filter,account:'all'});
 const accounts=(ledger.accounts??[]).filter(a=>a.currency===c&&(!filter.account||filter.account==='all'||a.id===filter.account));
 if(!accounts.length)return null;
 return <section className="panel"><div className="panel-head"><div><h2>Account breakdown</h2><p>{c} · Balances as of {asOf}</p></div></div><p className="small muted">Balances include dated opening amounts. Period movement excludes opening balances and includes assigned contributions and internal transfers. Unassigned entries are excluded.</p><div className="table-scroll"><table><caption>Tracked accounts in the overview scope</caption><thead><tr><th>Account</th><th>Balance</th><th>Net period movement</th></tr></thead><tbody>{accounts.map(a=>{const balance=accountBalance(ledger,a,asOf),movement=filtered(ledger.entries,{...filter,currency:c,account:a.id}).filter(e=>!e.funding_transfer_id).reduce((sum,e)=>sum+entryMovement(ledger,e),0)+transfers.reduce((sum,t)=>sum+t.amount_minor*(t.to_account_id===a.id?1:t.from_account_id===a.id?-1:0),0);return <tr key={a.id}><th><button className="text-button" onClick={()=>records({...filter,account:a.id})}>{a.name}{a.archived?' · Archived':''}</button></th><td>{balance===null?'Not opened':<MoneyValue amount={balance} currency={c}/>}</td><td><MoneyValue amount={movement} currency={c}/></td></tr>;})}</tbody></table></div><p className="small muted">Period movement: {start} – {end}. Future-dated records, if present, stay in period activity but never in a balance before their date.</p></section>;
}
