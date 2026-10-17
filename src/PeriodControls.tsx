import {useId,useState,type ReactNode} from 'react';
import {currencies,type Currency} from './types';
export function compactPeriodLabel(period:{start:string;end:string}){
 const start=new Date(period.start+'T12:00:00Z'),end=new Date(period.end+'T12:00:00Z'),format=(date:Date,options:Intl.DateTimeFormatOptions)=>new Intl.DateTimeFormat('en-GB',{...options,timeZone:'UTC'}).format(date);
 if(period.start.slice(0,7)===period.end.slice(0,7))return `${start.getUTCDate()}–${format(end,{day:'numeric',month:'short',year:'numeric'})}`;
 return `${format(start,{day:'numeric',month:'short',...(start.getUTCFullYear()!==end.getUTCFullYear()?{year:'numeric'}:{})})} – ${format(end,{day:'numeric',month:'short',year:'numeric'})}`;
}
type CurrencyControl={value:Currency|'all';label:string;change:(value:Currency|'all')=>void;allowAll?:boolean};
/** Shared presentation; each screen retains ownership of its own date/filter state. */
export default function PeriodControls({label,title,caption,previous,next,currency,children,open,onOpenChange}:{label:string;title:string;caption:string;previous?:()=>void;next?:()=>void;currency?:CurrencyControl;children:ReactNode;open?:boolean;onOpenChange?:(open:boolean)=>void}){
 const [expanded,setExpanded]=useState(false),id=useId(),isOpen=open??expanded;
 function toggle(){setExpanded(!isOpen);onOpenChange?.(!isOpen);}
 return <section className="period-control" aria-label={label}>
  <div className="period-control-bar"><div className="period-control-dates">{previous&&<button type="button" className="icon-button" aria-label="Previous period" onClick={previous}>‹</button>}<div><strong>{title}</strong><span>{caption}</span></div>{next&&<button type="button" className="icon-button" aria-label="Next period" onClick={next}>›</button>}</div>
   {currency&&<label className="period-control-currency"><span className="period-currency-label">{currency.label==='Reporting currency'?'Reporting':'Entries'}</span><select aria-label={currency.label} title={currency.label==='Reporting currency'?'Filters totals by currency; does not convert amounts':'Filters this entry list and its export'} value={currency.value} onChange={e=>currency.change(e.target.value as Currency|'all')}>{currency.allowAll&&<option value="all">All currencies</option>}{currencies.map(c=><option key={c}>{c}</option>)}</select></label>}
   <button type="button" className="text-button period-edit" aria-expanded={isOpen} aria-controls={id} onClick={toggle}>{isOpen?'Close dates':'Edit dates'}</button>
  </div>
  {isOpen&&<div id={id} className="period-control-fields">{children}</div>}
 </section>;
}
