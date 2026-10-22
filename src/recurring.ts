import type {Ledger,RecurringSchedule} from './types';
import {validDate} from './finance';
import {addDays} from './planning';
export function recurringDates(schedule:RecurringSchedule,from:string,to:string){
 if(!validDate(schedule.start_date)||!validDate(from)||!validDate(to)||from>to)return [];
 const dates:string[]=[];const start=new Date(schedule.start_date+'T12:00:00Z');
 for(let n=0;n<12000;n++){
  let date:string;if(schedule.frequency==='weekly')date=addDays(schedule.start_date,n*7);else{const month=start.getUTCMonth()+(schedule.frequency==='monthly'?n:n*12),last=new Date(Date.UTC(start.getUTCFullYear(),month+1,0)).getUTCDate();date=new Date(Date.UTC(start.getUTCFullYear(),month,Math.min(start.getUTCDate(),last),12)).toISOString().slice(0,10);}
  if(date>to||schedule.end_date&&date>schedule.end_date)break;if(date>=from)dates.push(date);
 }
 return dates;
}
export function upcomingRecurring(ledger:Ledger,from:string,to:string){return (ledger.schedules??[]).filter(s=>!s.archived).flatMap(schedule=>recurringDates(schedule,from,to).filter(date=>!(ledger.occurrences??[]).some(o=>o.schedule_id===schedule.id&&o.scheduled_date===date)).map(date=>({schedule,date}))).sort((a,b)=>a.date.localeCompare(b.date));}

/** Apply the same relationship and range rules to the isolated demo and real writes. */
export function validateSchedule(ledger:Ledger,s:RecurringSchedule,editing=false){
 const previous=ledger.schedules?.find(row=>row.id===s.id);
 if(s.user_id!==ledger.profile.user_id||!s.name.trim()||s.name.length>80)throw Error('Enter a schedule name for your account.');
 if(!validDate(s.start_date)||s.end_date&&(!validDate(s.end_date)||s.end_date<s.start_date))throw Error('Choose valid schedule dates, with the last date on or after the first.');
 if(!['weekly','monthly','yearly'].includes(s.frequency)||!Number.isSafeInteger(s.amount_minor)||s.amount_minor<=0||s.amount_minor>1000000000000)throw Error('Choose a frequency and a positive supported amount.');
 if(editing&&(!previous||previous.start_date!==s.start_date||previous.frequency!==s.frequency||previous.kind!==s.kind||previous.currency!==s.currency))throw Error('Keep the schedule type, currency and anchor; stop it and create a new schedule to change them.');
 if(s.archived&&previous)return;
 if(!ledger.categories.some(c=>c.id===s.category_id&&c.user_id===s.user_id&&c.kind===s.kind&&!c.archived))throw Error('Choose an active category matching the schedule type.');
 if(s.account_id&&!ledger.accounts?.some(a=>a.id===s.account_id&&a.user_id===s.user_id&&!a.archived&&a.currency===s.currency&&a.opening_date<=s.start_date))throw Error('Choose an active account with the same currency, opened by the first scheduled date.');
}
