import {parseAmount,validDate} from './finance';
import {filtered} from './finance';
import type {Account,AccountTransfer,Entry,Ledger,Currency,Filter} from './types';
export function signedAmount(value:string,currency:Currency){const negative=value.trim().startsWith('-');return parseAmount(value.trim().replace(/^[-+]/,''),currency,true)*(negative?-1:1);}
export function entryMovement(ledger:Ledger,entry:Entry){const kind=ledger.categories.find(c=>c.id===entry.category_id)?.kind;if(!kind)throw Error('Entry category is missing.');return entry.amount_minor*(kind==='income'||entry.withdrawal?1:-1);}
export function accountBalance(ledger:Ledger,account:Account,asOf:string){
 if(asOf<account.opening_date)return null;
 let result=account.opening_minor;
 for(const e of ledger.entries)if(e.account_id===account.id&&!e.funding_transfer_id&&e.currency===account.currency&&e.date>=account.opening_date&&e.date<=asOf)result+=entryMovement(ledger,e);
 for(const t of ledger.transfers??[])if(!t.removed_at&&t.currency===account.currency&&t.date>=account.opening_date&&t.date<=asOf)result+=t.amount_minor*(t.to_account_id===account.id?1:t.from_account_id===account.id?-1:0);
 if(!Number.isSafeInteger(result))throw Error('Account balance exceeds the supported range.');return result;
}
export function validateAccountEntry(ledger:Ledger,e:Entry){if(!e.account_id)return;const a=ledger.accounts?.find(a=>a.id===e.account_id&&a.user_id===e.user_id);if(!a||a.currency!==e.currency)throw Error('Choose an owned account in this currency.');if(e.date<a.opening_date)throw Error('Entry date must be on or after the account opening date.');if(a.archived&&!ledger.entries.some(x=>x.id===e.id&&x.account_id===a.id))throw Error('Choose an active account.');}
export function validateTransfer(ledger:Ledger,t:AccountTransfer){
 const from=ledger.accounts?.find(a=>a.id===t.from_account_id&&a.user_id===t.user_id),to=ledger.accounts?.find(a=>a.id===t.to_account_id&&a.user_id===t.user_id);
 if(!from||!to||from.id===to.id)throw Error('Choose two different accounts in your account.');
 if(from.currency!==to.currency||from.currency!==t.currency)throw Error('Transfers require accounts in the same currency.');
 if(!validDate(t.date)||t.date<from.opening_date||t.date<to.opening_date)throw Error('Transfer date must be on or after both opening dates.');
 const previous=ledger.transfers?.find(x=>x.id===t.id);
 if(from.archived&&previous?.from_account_id!==from.id||to.archived&&previous?.to_account_id!==to.id)throw Error('Choose active accounts for a new transfer or account assignment.');
 if(!Number.isSafeInteger(t.amount_minor)||t.amount_minor<=0||t.amount_minor>1e12)throw Error('Enter a positive amount within the supported limit.');
}
export function trackedBalance(ledger:Ledger,currency:Currency,date:string,account='all'){
 const values=(ledger.accounts??[]).filter(a=>a.currency===currency&&(account==='all'||a.id===account)).map(a=>accountBalance(ledger,a,date)).filter((n):n is number=>n!==null);
 if(!values.length)return null;const sum=values.reduce((s,n)=>s+n,0);if(!Number.isSafeInteger(sum))throw Error('Combined account balances exceed the supported range.');return sum;
}
export function matchingTransfers(ledger:Ledger,filter:Filter,search=''){
 if(filter.kind&&filter.kind!=='all'&&filter.kind!=='transfer'||filter.category!=='all'||filter.subcategory||filter.payment&&filter.payment!=='all')return [];
 return (ledger.transfers??[]).filter(t=>!t.removed_at&&filtered([{...t,category_id:'all',withdrawal:false,account_id:undefined}],{...filter,category:'all',kind:'all',account:undefined}).length&&(!filter.account||filter.account==='all'||t.from_account_id===filter.account||t.to_account_id===filter.account)&&`${t.notes} Transfer ${ledger.accounts?.find(a=>a.id===t.from_account_id)?.name} ${ledger.accounts?.find(a=>a.id===t.to_account_id)?.name}`.toLowerCase().includes(search.toLowerCase())).sort((a,b)=>b.date.localeCompare(a.date));
}

export function validateAccount(ledger:Ledger,a:Account){
 if(a.user_id!==ledger.profile.user_id||!a.name.trim()||a.name.length>80||!validDate(a.opening_date))throw Error('Enter a name and valid opening date for your account.');
 if(!Number.isSafeInteger(a.opening_minor)||Math.abs(a.opening_minor)>1e12)throw Error('Enter an opening balance within the supported limit.');
 const history=[...ledger.entries,...(ledger.removedEntries??[]).map(r=>r.entry)];
 if(history.some(e=>e.account_id===a.id&&(e.currency!==a.currency||e.date<a.opening_date))||(ledger.transfers??[]).some(t=>(t.from_account_id===a.id||t.to_account_id===a.id)&&(t.currency!==a.currency||t.date<a.opening_date))||(ledger.schedules??[]).some(s=>s.account_id===a.id&&(s.currency!==a.currency||s.start_date<a.opening_date)))throw Error('Keep the currency and opening date compatible with existing activity, removed entries and schedules.');
}
