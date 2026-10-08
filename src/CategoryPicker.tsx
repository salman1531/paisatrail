import {useId,useState} from 'react';
import type {Ledger} from './types';
import {customCategoryChoice} from './expenseChoices';
export type CategoryOption={value:string;label:string;categoryId:string;subcategoryId:string|null};
export function groupedChoices(ledger:Ledger,choices:CategoryOption[],query:string){
 const needle=query.trim().toLowerCase();
 return choices.map(choice=>({...choice,parent:ledger.categories.find(c=>c.id===choice.categoryId)?.name??'',display:choice.subcategoryId?`${ledger.categories.find(c=>c.id===choice.categoryId)?.name} → ${choice.label}`:choice.label})).filter(choice=>`${choice.parent} ${choice.label}`.toLowerCase().includes(needle));
}
export default function CategoryPicker({ledger,choices,label,value,onChange,disabled,required=false,invalid=false,describedBy}:{ledger:Ledger;choices:CategoryOption[];label:string;value:string;onChange:(value:string)=>void;disabled?:boolean;required?:boolean;invalid?:boolean;describedBy?:string}){
 const [searching,setSearching]=useState(false),[query,setQuery]=useState('');const id=useId();
 const options=groupedChoices(ledger,choices,query);
 const recentIds=[...ledger.entries].reverse().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>e.subcategory_id??e.category_id);
 const recent=[...new Set(recentIds)].flatMap(id=>options.filter(o=>o.value===id)).slice(0,3);
 const groups=[...new Set(options.filter(o=>!recent.some(r=>r.value===o.value)).map(o=>o.parent))];
 const selected=choices.find(o=>o.value===value);
 return <div className="category-picker"><div className="category-picker-heading"><label htmlFor={id}>{label}</label><button type="button" className="text-button" disabled={disabled} aria-expanded={searching} onClick={()=>{setSearching(!searching);setQuery('');}}>{searching?'Close search':'Search'}</button></div>
 {searching&&<label className="picker-search"><span className="sr-only">Search {label.toLowerCase()}</span><input type="search" value={query} disabled={disabled} placeholder="Search spending names or groups" onChange={e=>setQuery(e.target.value)}/></label>}
 <select id={id} aria-label={label} value={value} disabled={disabled} required={required} aria-invalid={invalid||undefined} aria-describedby={describedBy} onChange={e=>{onChange(e.target.value);setQuery('');setSearching(false);}}><option value="">Choose what this is for</option>
 {selected&&!options.some(o=>o.value===value)&&<option value={selected.value}>{selected.subcategoryId?`${ledger.categories.find(c=>c.id===selected.categoryId)?.name} → `:''}{selected.label}</option>}
 {!!recent.length&&<optgroup label="Recent selections">{recent.map(o=><option key={o.value} value={o.value}>{o.display}</option>)}</optgroup>}
 {groups.map(parent=><optgroup key={parent} label={parent}>{options.filter(o=>o.parent===parent&&!recent.some(r=>r.value===o.value)).map(o=><option key={o.value} value={o.value}>{o.display}</option>)}</optgroup>)}
 <option value={customCategoryChoice}>Other — enter a custom name</option></select>{searching&&query&&!options.length&&<small className="muted">No matching choices. Use Other to add a name.</small>}</div>;
}
