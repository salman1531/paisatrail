import {useRef,useEffect} from 'react';
import {Plus} from 'lucide-react';
import type {Kind} from './types';
export const recordLabels:Record<Kind,string>={expense:'Expense',income:'Income',saving:'Savings',investment:'Investment'};
/** Shared across all workspace destinations; familiar navigation stays unchanged. */
export default function RecordAction({open,busy,secondary=false,transfer}:{transfer?:()=>void;secondary?:boolean;open:(kind:Kind)=>void;busy:boolean}){
 const ref=useRef<HTMLDetailsElement>(null);useEffect(()=>{const close=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))ref.current.open=false;};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 return <details className={secondary?'record-action secondary':'record-action'} ref={ref} onKeyDown={e=>{if(e.key==='Escape'){ref.current!.open=false;ref.current?.querySelector('summary')?.focus();}}}><summary aria-label="Add transaction" aria-disabled={busy}><Plus size={18}/><span className="record-label-desktop">Add transaction</span><span className="record-label-mobile" aria-hidden="true">Add</span></summary><div className="record-action-menu">{(['expense','income','saving','investment'] as Kind[]).map(kind=><button key={kind} className="text-button" disabled={busy} onClick={()=>{ref.current!.open=false;open(kind);}}>Record {recordLabels[kind].toLowerCase()}</button>)}{transfer&&<button className="text-button" disabled={busy} onClick={()=>{ref.current!.open=false;transfer();}}>Transfer between accounts</button>}</div></details>;
}
