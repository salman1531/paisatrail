import {useState} from 'react';
import {dateLabel,money} from './finance';
import type {Entry,Ledger} from './types';
export default function RecoveryPanel({ledger,busy,restore}:{ledger:Ledger;busy:boolean;restore:(e:Entry)=>Promise<void>}){
 const [error,setError]=useState('');
 return <details className="panel removed-entries"><summary>Removed entries · {ledger.removedEntries?.length??0}</summary><p className="small muted">Removed records are excluded from totals and exports. They stay private here until restored or your account is deleted. Restore archived categories or reopen cancelled expectations first if needed; restoration also checks goal progress.</p>{error&&<p role="alert" className="form-error">{error}</p>}{!ledger.removedEntries?.length?<p>No removed entries. Your history is intact.</p>:ledger.removedEntries.map(r=><article className="recovery-row" key={r.id}><div><strong>{ledger.categories.find(c=>c.id===r.entry.category_id)?.name}</strong><span>{dateLabel(r.entry.date)} · {r.entry.withdrawal?'Withdrawal · ':''}{money(r.entry.amount_minor,r.entry.currency)}</span>{r.entry.notes&&<p>{r.entry.notes}</p>}</div><button className="button secondary" disabled={busy} onClick={async()=>{setError('');try{await restore(r.entry);}catch(e){setError((e as Error).message);}}}>Restore entry</button></article>)}</details>;
}
