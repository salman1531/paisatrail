import {useEffect,useId,useRef,useState} from 'react';
import type {Ledger} from './types';
import {customCategoryChoice} from './expenseChoices';
export type CategoryOption={value:string;label:string;categoryId:string;subcategoryId:string|null};
export function groupedChoices(ledger:Ledger,choices:CategoryOption[],query:string){
 const needle=query.trim().toLowerCase();
 return choices.map(choice=>({...choice,parent:ledger.categories.find(c=>c.id===choice.categoryId)?.name??'',display:choice.subcategoryId?`${ledger.categories.find(c=>c.id===choice.categoryId)?.name} → ${choice.label}`:choice.label})).filter(choice=>`${choice.parent} ${choice.label} ${choice.display}`.toLowerCase().includes(needle));
}
export default function CategoryPicker({ledger,choices,label,value,onChange,disabled,required=false,invalid=false,describedBy}:{ledger:Ledger;choices:CategoryOption[];label:string;value:string;onChange:(value:string)=>void;disabled?:boolean;required?:boolean;invalid?:boolean;describedBy?:string}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),id=useId(),input=useRef<HTMLInputElement>(null);
 const options=groupedChoices(ledger,choices,query);
 const recentIds=[...ledger.entries].reverse().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>e.subcategory_id??e.category_id);
 const recent=[...new Set(recentIds)].flatMap(id=>options.filter(o=>o.value===id)).slice(0,3);
 const rest=options.filter(o=>!recent.some(r=>r.value===o.value));
 const groups=[...new Set(rest.map(o=>o.parent))];
 const ordered=[...recent,...groups.flatMap(parent=>rest.filter(o=>o.parent===parent)),{value:customCategoryChoice,display:'Other — enter a custom name',parent:'Other'}];
 const selected=value===customCategoryChoice?'Other — enter a custom name':groupedChoices(ledger,choices,'').find(o=>o.value===value)?.display??'';
 useEffect(()=>{input.current?.setCustomValidity(required&&!value?'Choose a category from the list.':'');},[required,value]);
 useEffect(()=>{if(open)document.getElementById(`${id}-option-${active}`)?.scrollIntoView({block:'nearest'});},[active,open,id]);
 function choose(next:string){onChange(next);setQuery('');setOpen(false);setActive(0);}
 function option(o:typeof ordered[number]){const index=ordered.findIndex(x=>x.value===o.value);return <div key={o.value} id={`${id}-option-${index}`} role="option" aria-selected={value===o.value} className={'picker-option'+(active===index?' highlighted':'')} onMouseDown={e=>e.preventDefault()} onMouseMove={()=>setActive(index)} onClick={()=>choose(o.value)}>{o.display}</div>;}
 return <div className="category-picker unified-picker" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){setOpen(false);setQuery('');}}}>
 <label htmlFor={id}>{label}</label><div className="picker-input-wrap"><input ref={input} id={id} role="combobox" type="text" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-choices`} aria-activedescendant={open?`${id}-option-${Math.min(active,ordered.length-1)}`:undefined} aria-required={required||undefined} aria-invalid={invalid||undefined} aria-describedby={describedBy} disabled={disabled} required={required} value={open?query:selected} placeholder={open?'Search categories…':'Choose a category'} onFocus={()=>{setOpen(true);setActive(0);}} onChange={e=>{setQuery(e.target.value);setActive(0);setOpen(true);if(value)onChange('');}} onKeyDown={e=>{if(e.key==='Escape'){if(open){e.preventDefault();e.stopPropagation();setOpen(false);setQuery('');}}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(open?(active+(e.key==='ArrowDown'?1:-1)+ordered.length)%ordered.length:0);}else if(e.key==='Enter'&&open){e.preventDefault();choose(ordered[Math.min(active,ordered.length-1)].value);}}}/><span aria-hidden="true">⌄</span></div>
 {open&&<div id={`${id}-choices`} role="listbox" aria-label={`${label} choices`} className="picker-options">{!!recent.length&&<div role="group" aria-label="Recent selections"><div className="picker-group-label" aria-hidden="true">Recent selections</div>{recent.map(option)}</div>}{groups.map(parent=><div role="group" key={parent} aria-label={parent}><div className="picker-group-label" aria-hidden="true">{parent}</div>{rest.filter(o=>o.parent===parent).map(option)}</div>)}{!options.length&&<p className="small muted">No matches. Choose Other to add a name.</p>}{option(ordered[ordered.length-1])}</div>}
 </div>;
}
