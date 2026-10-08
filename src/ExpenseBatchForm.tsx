import { useRef, useState, type FormEvent } from 'react';
import PaymentTypeField, {validatePaymentType} from './PaymentTypeField';
import { Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';
import AmountWords from './AmountWords';
import { money, parseAmount, today, validDate } from './finance';
import { expenseChoices, customCategoryChoice } from './expenseChoices';
import { currencies, type Currency, type Entry, type Ledger } from './types';

export type ExpenseDraft = { id:string; choice:string; customName:string; amount:string; date:string; notes:string; payment:string };
export type ExpenseSubmission = { entry:Entry; customName?:string };
export function expenseDraft(ledger:Ledger, choice=''):ExpenseDraft { return {id:crypto.randomUUID(),choice,customName:'',amount:'',date:today(ledger.profile.timezone),notes:'',payment:''}; }
export function validateExpenseDraft(ledger:Ledger, draft:ExpenseDraft, currency:Currency) {
  const errors:Partial<Record<keyof ExpenseDraft,string>>={};
  const selected=expenseChoices(ledger).find(c=>c.value===draft.choice);
  const custom=draft.choice===customCategoryChoice;
  if(!selected&&!custom)errors.choice='Choose an expense category.';
  if(custom&&(!draft.customName.trim()||draft.customName.trim().length>60))errors.customName='Enter a name between 1 and 60 characters.';
  let amount=0;try{amount=parseAmount(draft.amount,currency);}catch(e){errors.amount=(e as Error).message;}
  if(!validDate(draft.date))errors.date='Choose a valid date between 1900 and 2100.';
  let payment:string|null=null;try{payment=validatePaymentType(draft.payment);}catch(e){errors.payment=(e as Error).message;}
  if(draft.notes.length>500)errors.notes='Use no more than 500 characters.';
  const submission:ExpenseSubmission={entry:{id:draft.id,user_id:ledger.profile.user_id,category_id:selected?.categoryId??'',subcategory_id:selected?.subcategoryId??null,currency,amount_minor:amount,date:draft.date,notes:draft.notes.trim(),payment_method:payment,withdrawal:false},customName:custom?draft.customName.trim():undefined};
  return {errors,submission};
}
export default function ExpenseBatchForm({ledger,busy,close,save}:{ledger:Ledger;busy:boolean;close:()=>void;save:(entries:ExpenseSubmission[])=>Promise<void>}) {
  const [rows,setRows]=useState(()=>[expenseDraft(ledger)]);
  const [currency,setCurrency]=useState(ledger.profile.currency);
  const [errors,setErrors]=useState<Record<string,Partial<Record<keyof ExpenseDraft,string>>>>({});
  const [error,setError]=useState('');const [discard,setDiscard]=useState(false);
  const pending=useRef(false);
  const options=expenseChoices(ledger);
  const total=rows.reduce((v,r)=>{try{return v+parseAmount(r.amount,currency,true);}catch{return v;}},0);
  const invalidAmount=rows.some(r=>{if(!r.amount.trim())return false;try{parseAmount(r.amount,currency,true);return false;}catch{return true;}});
  const dirty=rows.some(r=>r.choice||r.amount||r.notes||r.customName||r.payment)||rows.length>1;
  function requestClose(){if(busy||pending.current)return;if(dirty)setDiscard(true);else close();}
  function update(id:string,key:keyof ExpenseDraft,value:string){setRows(rows=>rows.map(r=>r.id===id?{...r,[key]:value}:r));setErrors(old=>({...old,[id]:{...old[id],[key]:undefined}}));setError('');}
  async function submit(e:FormEvent){
    e.preventDefault();if(pending.current||busy)return;
    const checks=rows.map(r=>validateExpenseDraft(ledger,r,currency));
    const next=Object.fromEntries(checks.map((v,i)=>[rows[i].id,v.errors]));setErrors(next);
    if(checks.some(v=>Object.keys(v.errors).length)){setError('Review the highlighted fields. Nothing has been saved.');return;}
    pending.current=true;setError('');
    try{await save(checks.map(v=>v.submission));close();}catch(e){setError((e as Error).message+' Your entries are kept here. Retry this session to avoid duplicates.');}finally{pending.current=false;}
  }
  return <Modal wide title="Add expenses" close={requestClose}><form className="batch-expense-form" onSubmit={submit} noValidate>
    <div className="batch-heading"><p>Enter, review, then save together.</p><label>Currency<select aria-label="Batch currency" value={currency} disabled={busy} onChange={e=>setCurrency(e.target.value as Currency)}>{currencies.map(c=><option key={c}>{c}</option>)}</select></label></div>
    <div className="batch-rows">{rows.map((r,i)=>{const rowError=errors[r.id]??{};const prefix=`batch-${r.id}`;return <fieldset className="batch-row" key={r.id} disabled={busy}><legend>Expense {i+1}</legend><button className="icon-button batch-remove" type="button" aria-label={`Remove expense ${i+1}`} disabled={rows.length===1} onClick={()=>setRows(rows=>rows.filter(x=>x.id!==r.id))}><Trash2 size={17}/><span>Remove</span></button>
      <div className="batch-fields"><label>Category<select aria-label={`Expense ${i+1} category`} aria-invalid={!!rowError.choice} aria-describedby={rowError.choice?prefix+'-choice':undefined} value={r.choice} onChange={e=>update(r.id,'choice',e.target.value)}><option value="">Choose what you spent on</option>{options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}<option value={customCategoryChoice}>Other — enter a custom name</option></select>{rowError.choice&&<small className="field-error" id={prefix+'-choice'}>{rowError.choice}</small>}</label>
      <div className="amount-field"><label>Amount · {currency}<input aria-label={`Expense ${i+1} amount`} inputMode="decimal" placeholder="0.00" value={r.amount} onChange={e=>update(r.id,'amount',e.target.value)} aria-invalid={!!rowError.amount} aria-describedby={rowError.amount?prefix+'-amount':undefined}/>{rowError.amount&&<small className="field-error" id={prefix+'-amount'}>{rowError.amount}</small>}</label><AmountWords value={r.amount} currency={currency}/></div>
      <label>Date<input aria-label={`Expense ${i+1} date`} type="date" min="1900-01-01" max="2100-12-31" value={r.date} onChange={e=>update(r.id,'date',e.target.value)} onInput={e=>update(r.id,'date',e.currentTarget.value)} aria-invalid={!!rowError.date}/>{rowError.date&&<small className="field-error">{rowError.date}</small>}</label>
      {r.choice===customCategoryChoice&&<label className="batch-custom">Custom spending name<input aria-label={`Expense ${i+1} custom name`} maxLength={60} value={r.customName} onChange={e=>update(r.id,'customName',e.target.value)} aria-invalid={!!rowError.customName}/>{rowError.customName&&<small className="field-error">{rowError.customName}</small>}</label>}
      </div><PaymentTypeField label={`Expense ${i+1} payment type (optional)`} value={r.payment} onChange={value=>update(r.id,'payment',value)}/>{rowError.payment&&<small className="field-error">{rowError.payment}</small>}<details className="batch-note" open={!!r.notes}><summary>Add a note (optional)</summary><label><span className="sr-only">Expense {i+1} note</span><input maxLength={500} value={r.notes} placeholder="What was it for?" onChange={e=>update(r.id,'notes',e.target.value)}/></label></details>
    </fieldset>;})}</div>
    <button type="button" className="button secondary batch-add" disabled={busy||rows.length>=50} onClick={()=>{setRows(rows=>[...rows,expenseDraft(ledger,rows.at(-1)?.choice===customCategoryChoice?'':rows.at(-1)?.choice)]);setError('');}}><Plus size={17}/>Add another expense</button>
    {error&&<p className="form-error" role="alert">{error}</p>}
    <div className="batch-save-bar"><div role="status" aria-live="polite"><span>Total · {rows.length} {rows.length===1?'entry':'entries'}</span><strong>{money(total,currency)}</strong>{invalidAmount&&<small>Only valid amounts included</small>}</div><div className="modal-actions"><button type="button" className="button secondary" disabled={busy} onClick={requestClose}>Cancel</button><button className="button" disabled={busy}>{busy?'Saving…':'Save all expenses'}</button></div></div>
    {discard&&<section className="discard-draft" role="alert"><p>Discard these unsaved expenses?</p><button type="button" className="button secondary" onClick={()=>setDiscard(false)}>Keep editing</button><button type="button" className="button danger" onClick={close}>Discard expenses</button></section>}
  </form></Modal>;
}
