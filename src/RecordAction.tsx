import {useRef,useEffect} from 'react';
import {Plus} from 'lucide-react';
import type {Kind} from './types';
export const recordLabels:Record<Kind,string>={expense:'Expense',income:'Income',saving:'Savings',investment:'Investment'};
/** Shared across all workspace destinations; familiar navigation stays unchanged. */
export default function RecordAction({open,busy}:{open:(kind:Kind)=>void;busy:boolean}){
 const ref=useRef<HTMLDetailsElement>(null);useEffect(()=>{const close=(e:PointerEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))ref.current.open=false;};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 return <details className="record-action" ref={ref} onKeyDown={e=>{if(e.key==='Escape'){ref.current!.open=false;ref.current?.querySelector('summary')?.focus();}}}><summary aria-label="Record" aria-disabled={busy}><Plus size={18}/><span>Record</span></summary><div className="record-action-menu">{(['expense','income','saving','investment'] as Kind[]).map(kind=><button key={kind} className="text-button" disabled={busy} onClick={()=>{ref.current!.open=false;open(kind);}}>Record {recordLabels[kind].toLowerCase()}</button>)}</div></details>;
}
