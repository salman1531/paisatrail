import {filtered} from './finance';
import type {Filter,Ledger} from './types';
export type FlowSlice={id:string;name:string;categoryId:string;subcategoryId?:string;amount:number;children:FlowSlice[]};
export function cashFlowSlices(ledger:Ledger,filter:Filter,kind:'income'|'expense'){
 const entries=filtered(ledger.entries,{...filter,category:'all',subcategory:undefined,payment:undefined,currency:ledger.profile.currency});
 const rows:FlowSlice[]=ledger.categories.filter(c=>c.kind===kind).map(c=>{
  const selected=entries.filter(e=>e.category_id===c.id);
  const children:FlowSlice[]=[];
  for(const e of selected){const id=e.subcategory_id??'direct-'+c.id;let child=children.find(s=>s.id===id);if(!child){child={id,name:e.subcategory_id?(ledger.subcategories??[]).find(s=>s.id===id)?.name??'Unknown subcategory':'No subcategory',categoryId:c.id,subcategoryId:e.subcategory_id??undefined,amount:0,children:[]};children.push(child);}child.amount+=e.amount_minor;if(!Number.isSafeInteger(child.amount))throw new Error('Chart totals exceed the supported numeric range.');}
  const amount=children.reduce((sum,child)=>sum+child.amount,0);if(!Number.isSafeInteger(amount))throw new Error('Chart totals exceed the supported numeric range.');
  return {id:c.id,name:c.name+(c.archived?' · archived':''),categoryId:c.id,amount,children:children.sort((a,b)=>b.amount-a.amount)};
 }).filter(c=>c.amount>0).sort((a,b)=>b.amount-a.amount);
 const total=rows.reduce((sum,row)=>sum+row.amount,0);if(!Number.isSafeInteger(total))throw new Error('Chart totals exceed the supported numeric range.');return {rows,total};
}
export function ringPath(start:number,end:number,inner:number,outer:number){
 const finish=Math.min(end,start+Math.PI*2-0.000001);const point=(a:number,r:number)=>`${160+Math.cos(a)*r},${160+Math.sin(a)*r}`;const large=finish-start>Math.PI?1:0;
 return `M ${point(start,outer)} A ${outer},${outer} 0 ${large} 1 ${point(finish,outer)} L ${point(finish,inner)} A ${inner},${inner} 0 ${large} 0 ${point(start,inner)} Z`;
}
