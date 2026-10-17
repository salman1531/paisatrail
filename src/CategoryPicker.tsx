import {useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import type {Ledger} from './types';
import {customCategoryChoice} from './expenseChoices';
export type CategoryOption={value:string;label:string;categoryId:string;subcategoryId:string|null};
export function groupedChoices(ledger:Ledger,choices:CategoryOption[],query:string){
 const needle=query.trim().toLowerCase();
 return choices.map(choice=>({...choice,parent:ledger.categories.find(c=>c.id===choice.categoryId)?.name??'',display:choice.subcategoryId?`${ledger.categories.find(c=>c.id===choice.categoryId)?.name} → ${choice.label}`:choice.label})).filter(choice=>`${choice.parent} ${choice.label} ${choice.display}`.toLowerCase().includes(needle));
}
export default function CategoryPicker({ledger,choices,label,value,onChange,disabled,required=false,invalid=false,describedBy}:{ledger:Ledger;choices:CategoryOption[];label:string;value:string;onChange:(value:string)=>void;disabled?:boolean;required?:boolean;invalid?:boolean;describedBy?:string}){
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[active,setActive]=useState(0),id=useId(),input=useRef<HTMLInputElement>(null),root=useRef<HTMLDivElement>(null),popup=useRef<HTMLDivElement>(null);
 const [placement,setPlacement]=useState<{left:number;top?:number;bottom?:number;width:number;maxHeight:number}>({left:0,top:0,width:0,maxHeight:240});
 const options=groupedChoices(ledger,choices,query);
 const recentIds=[...ledger.entries].reverse().sort((a,b)=>b.date.localeCompare(a.date)).map(e=>e.subcategory_id??e.category_id);
 const recent=[...new Set(recentIds)].flatMap(id=>options.filter(o=>o.value===id)).slice(0,3);
 const rest=options.filter(o=>!recent.some(r=>r.value===o.value));
 const groups=[...new Set(rest.map(o=>o.parent))];
 const ordered=[...recent,...groups.flatMap(parent=>rest.filter(o=>o.parent===parent)),{value:customCategoryChoice,display:'Other — enter a custom name',parent:'Other'}];
 const selected=value===customCategoryChoice?'Other — enter a custom name':groupedChoices(ledger,choices,'').find(o=>o.value===value)?.display??'';
 useEffect(()=>{input.current?.setCustomValidity(required&&!value?'Choose a category from the list.':'');},[required,value]);
 useEffect(()=>{const option=document.getElementById(`${id}-option-${active}`),list=popup.current;if(!open||!option||!list)return;const item=option.getBoundingClientRect(),box=list.getBoundingClientRect();if(item.top<box.top+5)list.scrollTop-=box.top+5-item.top;else if(item.bottom>box.bottom-5)list.scrollTop+=item.bottom-box.bottom+5;},[active,open,id,query]);
 useLayoutEffect(()=>{
  const field=input.current,list=popup.current;if(!open||!field||!list)return;
  const native=typeof list.showPopover==='function';
  function position(){
   const box=field!.getBoundingClientRect(),viewport=window.visualViewport;
   const floor=(viewport?.offsetTop??0)+(viewport?.height??window.innerHeight),ceiling=viewport?.offsetTop??0;
   const dialog=field!.closest('dialog'),dialogBox=dialog?.getBoundingClientRect();
   const footer=dialog?.querySelector('.entry-save-footer,.batch-save-bar')?.getBoundingClientRect(),header=dialog?.querySelector('.modal-head')?.getBoundingClientRect();
   const bottom=Math.min(floor,footer?.top??dialogBox?.bottom??floor),top=Math.max(ceiling,header?.bottom??dialogBox?.top??ceiling);
   const below=Math.max(0,bottom-box.bottom-12),above=Math.max(0,box.top-top-12),up=below<180&&above>below;
   const maxHeight=Math.min(240,up?above:below);
   setPlacement({left:Math.max(8,box.left),top:up?undefined:box.bottom+4,bottom:up?window.innerHeight-box.top+4:undefined,width:box.width,maxHeight});
  }
  position();if(native)list.showPopover();
  const outside=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};
  const scroll=(event:Event)=>{if(!list.contains(event.target as Node))position();};
  document.addEventListener('pointerdown',outside,true);document.addEventListener('scroll',scroll,true);window.addEventListener('resize',position);window.visualViewport?.addEventListener('resize',position);window.visualViewport?.addEventListener('scroll',position);
  const resize=new ResizeObserver(position);resize.observe(field);
  return()=>{document.removeEventListener('pointerdown',outside,true);document.removeEventListener('scroll',scroll,true);window.removeEventListener('resize',position);window.visualViewport?.removeEventListener('resize',position);window.visualViewport?.removeEventListener('scroll',position);resize.disconnect();if(native&&list.matches(':popover-open'))list.hidePopover();};
 },[open]);
 function choose(next:string){onChange(next);setQuery('');setOpen(false);setActive(0);}
 function option(o:typeof ordered[number]){const index=ordered.findIndex(x=>x.value===o.value);return <div key={o.value} id={`${id}-option-${index}`} role="option" aria-selected={value===o.value} className={'picker-option'+(active===index?' highlighted':'')} onMouseDown={e=>e.preventDefault()} onMouseMove={()=>setActive(index)} onClick={()=>choose(o.value)}>{o.display}</div>;}
 return <div ref={root} className="category-picker unified-picker" onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget as Node)){setOpen(false);setQuery('');}}}>
 <label htmlFor={id}>{label}</label><div className="picker-input-wrap"><input ref={input} id={id} role="combobox" type="text" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-choices`} aria-activedescendant={open?`${id}-option-${Math.min(active,ordered.length-1)}`:undefined} aria-required={required||undefined} aria-invalid={invalid||undefined} aria-describedby={describedBy} disabled={disabled} required={required} value={open?query:selected} placeholder={open?'Search categories…':'Choose a category'} onFocus={()=>{setOpen(true);setActive(Math.max(0,ordered.findIndex(o=>o.value===value)));}} onChange={e=>{setQuery(e.target.value);setActive(0);setOpen(true);if(value)onChange('');}} onKeyDown={e=>{if(e.key==='Escape'){if(open){e.preventDefault();e.stopPropagation();setOpen(false);setQuery('');}}else if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();setOpen(true);setActive(open?(active+(e.key==='ArrowDown'?1:-1)+ordered.length)%ordered.length:0);}else if(open&&(e.key==='Home'||e.key==='End')){e.preventDefault();setActive(e.key==='Home'?0:ordered.length-1);}else if(e.key==='Enter'&&open){e.preventDefault();choose(ordered[Math.min(active,ordered.length-1)].value);}}}/><button type="button" className="picker-toggle" aria-label={`Toggle ${label.toLowerCase()} choices`} tabIndex={-1} disabled={disabled} onMouseDown={e=>e.preventDefault()} onClick={()=>{input.current?.focus();setOpen(!open);}}><span aria-hidden="true">⌄</span></button></div>
 {open&&<div ref={popup} popover="manual" style={placement} id={`${id}-choices`} role="listbox" aria-label={`${label} choices`} className="picker-options">{!!recent.length&&<div role="group" aria-label="Recent selections"><div className="picker-group-label" aria-hidden="true">Recent selections</div>{recent.map(option)}</div>}{groups.map(parent=><div role="group" key={parent} aria-label={parent}><div className="picker-group-label" aria-hidden="true">{parent}</div>{rest.filter(o=>o.parent===parent).map(option)}</div>)}{!options.length&&<p className="small muted">No matches. Choose Other to add a name.</p>}{option(ordered[ordered.length-1])}</div>}
 </div>;
}
