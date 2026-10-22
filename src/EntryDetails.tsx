import {financialAccountsEnabled} from './productFeatures';
import {useDisplayPreferences} from './displayPreferences';
import Modal from './Modal';
import MoneyValue from './MoneyValue';
import {dateLabel,kindLabels} from './finance';
import type {Entry,Ledger} from './types';
export default function EntryDetails({ledger,entry:e,close,edit}:{ledger:Ledger;entry:Entry;close:()=>void;edit:()=>void}){
 const display=useDisplayPreferences();
 const c=ledger.categories.find(c=>c.id===e.category_id)!,sub=ledger.subcategories?.find(s=>s.id===e.subcategory_id),occurrence=ledger.occurrences?.find(o=>o.entry_id===e.id);
 const fields=[['Date',dateLabel(e.date,display.dateFormat)],['Type',e.withdrawal?'Withdrawal':kindLabels[c.kind]],['Category',c.name+(sub?' → '+sub.name:'')],...(financialAccountsEnabled?[["Account",ledger.accounts?.find(a=>a.id===e.account_id)?.name??'Unassigned']]:[]),['Payment type',e.payment_method??'Not specified'],['Goal',ledger.namedGoals?.find(g=>g.id===e.named_goal_id)?.name??'Not linked'],['Income source',ledger.incomeSources?.find(s=>s.id===e.income_source_id)?.name??'Not linked'],['Expected payment',ledger.expectedPayments?.find(p=>p.id===e.expected_payment_id)?.name??'Not linked']];
 return <Modal title="Transaction details" close={close}><strong className="detail-amount"><MoneyValue amount={e.amount_minor*(e.withdrawal?-1:1)} currency={e.currency}/></strong><dl className="entry-detail-grid">{fields.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{occurrence&&<p className="small muted">Confirmed recurring occurrence · scheduled {occurrence.scheduled_date}. Editing this record does not change future occurrences.</p>}{e.funding_transfer_id&&<p className="small muted">This contribution is linked to an earlier transfer. Correct the pair together to preserve its goal progress.</p>}<h3>Note</h3><p className="entry-detail-note">{e.notes||'No note added.'}</p><div className="modal-actions"><button className="button secondary" onClick={close}>Close</button><button className="button" onClick={edit}>{e.funding_transfer_id?'Edit linked contribution':'Edit transaction'}</button></div></Modal>;
}
