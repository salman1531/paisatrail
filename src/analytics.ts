import {filtered,totals,today} from './finance';
import {addDays} from './planning';
import {periodFilter} from './planning';
import type {Currency,PlanningPeriod,Filter,Ledger} from './types';
export type ActivityBucket={start:string;end:string;label:string;income:number;expense:number;net:number};
export function activitySeries(ledger:Ledger,filter:Filter):ActivityBucket[]{
 const rows=filtered(ledger.entries,{...filter,currency:ledger.profile.currency,category:'all',subcategory:undefined,payment:undefined});
 const dates=rows.map(e=>e.date).sort(),now=today(ledger.profile.timezone);
 const start=filter.startDate??(filter.year==='all'?dates[0]??now:filter.year+'-'+(filter.month==='all'?'01':filter.month)+'-01');
 const end=filter.endDate??(filter.year==='all'?dates.at(-1)??now:filter.month==='all'?filter.year+'-12-31':new Date(Date.UTC(Number(filter.year),Number(filter.month),0)).toISOString().slice(0,10));
 const days=Math.round((Date.parse(end)-Date.parse(start))/86400000)+1;
 const buckets:ActivityBucket[]=[];
 for(let from=start;from<=end;){
  const next=days<=14?addDays(from,1):days<=84?addDays(from,7):days>730?(String(Number(from.slice(0,4))+1)+'-01-01'):(from.slice(0,4)==='2100'&&from.slice(5,7)==='12'?'2101-01-01':new Date(Date.UTC(Number(from.slice(0,4)),Number(from.slice(5,7)),1)).toISOString().slice(0,10));
  const to=addDays(next,-1)<end?addDays(next,-1):end;
  const t=totals(ledger,rows.filter(e=>e.date>=from&&e.date<=to),ledger.profile.currency);
  const label=new Intl.DateTimeFormat('en-GB',{...(days>730?{year:'numeric'}:days>84?{month:'short',year:'2-digit'}:{day:'numeric',month:'short'}),timeZone:'UTC'}).format(new Date(from+'T12:00:00Z'));
  buckets.push({start:from,end:to,label,income:t.income,expense:t.expense,net:t.income-t.expense});from=next;
 }
 return buckets;
}
export function cumulativeMovement(buckets:ActivityBucket[]){let total=0;return buckets.map(row=>{total+=row.net;if(!Number.isSafeInteger(total))throw Error('Movement total exceeds the supported range.');return {...row,cumulative:total};});}

export function analysisFilter(period:PlanningPeriod,custom:Filter|null,account:string,currency:Currency):Filter{return {...(custom??periodFilter(period)),account,currency};}
