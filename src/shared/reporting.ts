import {today,validDate} from '../finance';
import type {HistoryFilter,Report} from './model';
export type Period='all'|'month'|'last'|'custom';
export type Scope={period:Period;context:string;start:string;end:string;category:string;participant:string;role:'paid'|'share';recordStart:string;recordEnd:string;offset:number;recordOffset:number;records:boolean};
export function periodDates(period:Period,now=today()){
 const y=Number(now.slice(0,4)),m=Number(now.slice(5,7));
 const iso=(d:Date)=>d.toISOString().slice(0,10);
 if(period==='month'||period==='last'){const shift=period==='last'?-1:0;return {start:iso(new Date(Date.UTC(y,m-1+shift,1))),end:iso(new Date(Date.UTC(y,m+shift,0)))};}
 return {start:'',end:''};
}
export function validRange(start:string,end:string){return validDate(start)&&validDate(end)&&start<=end;}
export function readScope(search:string):Scope{
 const q=new URLSearchParams(search),p=q.get('period'),period:Period=p==='month'||p==='last'||p==='custom'?p:'all';
 const custom=validRange(q.get('from')??'',q.get('to')??'');
 const dates=period==='custom'&&custom?{start:q.get('from')!,end:q.get('to')!}:periodDates(period);
 const recordStart=q.get('recordFrom')??'',recordEnd=q.get('recordTo')??'';
 return {period:period==='custom'&&!custom?'all':period,context:q.get('space')??'',...dates,category:q.get('category')??'',participant:q.get('person')??'',role:q.get('role')==='paid'?'paid':'share',recordStart:validRange(recordStart,recordEnd)?recordStart:'',recordEnd:validRange(recordStart,recordEnd)?recordEnd:'',offset:Math.min(1000000,Math.max(0,Math.floor(Number(q.get('offset'))||0))),recordOffset:Math.min(1000000,Math.max(0,Math.floor(Number(q.get('recordOffset'))||0))),records:q.get('records')==='1'};
}
export function scopeSearch(scope:Scope){const q=new URLSearchParams();if(scope.period!=='all')q.set('period',scope.period);if(scope.period==='custom'){q.set('from',scope.start);q.set('to',scope.end);}if(scope.context)q.set('space',scope.context);if(scope.category)q.set('category',scope.category);if(scope.participant){q.set('person',scope.participant);q.set('role',scope.role);}if(scope.recordStart){q.set('recordFrom',scope.recordStart);q.set('recordTo',scope.recordEnd);}if(scope.offset)q.set('offset',String(scope.offset));if(scope.recordOffset)q.set('recordOffset',String(scope.recordOffset));if(scope.records)q.set('records','1');return q.size?'?'+q.toString():'';}
export function reportFilter(s:Scope,context?:string):HistoryFilter{return {context:context||s.context||undefined,start:s.start||undefined,end:s.end||undefined};}
export function recordsFilter(s:Scope,context?:string):HistoryFilter{return {...reportFilter(s,context),start:s.recordStart||s.start||undefined,end:s.recordEnd||s.end||undefined,category:s.category||undefined,participant:s.participant||undefined,participantRole:s.role,offset:s.recordOffset,includedOnly:s.records};}
export type Bucket={start:string;end:string;amount_minor:number};
/** UTC is only used to iterate civil dates, never to reinterpret a ledger date. */
export function spendingBuckets(timeline:NonNullable<Report['timeline']>,start='',end=''):{interval:'Week'|'Month';buckets:Bucket[]}{
 if(!timeline.length)return {interval:'Month',buckets:[]};
 const sorted=[...timeline].sort((a,b)=>a.date.localeCompare(b.date)),first=start||sorted[0].date,last=end||sorted.at(-1)!.date;
 const days=(Date.parse(last)-Date.parse(first))/86400000,interval=days<=90?'Week':'Month';
 const bucketStart=(date:string)=>{const d=new Date(date+'T12:00:00Z');if(interval==='Week')d.setUTCDate(d.getUTCDate()-((d.getUTCDay()+6)%7));else d.setUTCDate(1);return d.toISOString().slice(0,10);};
 const sums=new Map<string,number>();for(const t of sorted){if(t.date<first||t.date>last)continue;const key=bucketStart(t.date);sums.set(key,(sums.get(key)??0)+t.amount_minor);}
 const buckets:Bucket[]=[];let cursor=bucketStart(first);while(cursor<=last){const next=new Date(cursor+'T12:00:00Z');if(interval==='Week')next.setUTCDate(next.getUTCDate()+7);else next.setUTCMonth(next.getUTCMonth()+1);const nextDate=next.toISOString().slice(0,10),until=new Date(next.getTime()-86400000).toISOString().slice(0,10);buckets.push({start:cursor<first?first:cursor,end:until>last?last:until,amount_minor:sums.get(cursor)??0});cursor=nextDate;}
 return {interval,buckets};
}
export const activityLabel=(action:string)=>({'Friend relationship created':'Friend added','Manual participant added':'Person added (tracked without an account)','Manual repayment recorded':'Repayment recorded (tracked person)','Participant history linked':'Person accepted their existing records',create_context:'Space created',add_participant:'Person added',edit_context:'Space updated',expense_created:'Expense recorded',expense_updated:'Expense corrected',cancel_expense:'Expense cancelled',restore_expense:'Expense restored',settlement_created:'Repayment recorded',confirm_settlement:'Receipt confirmed',cancel_settlement:'Repayment cancelled',invite:'Invitation created',join:'Person joined',remove_member:'Person removed',transfer_owner:'Ownership transferred',leave:'Member left',revoke_invite:'Invitation revoked'}[action]??action.replaceAll('_',' ').replace(/^./,x=>x.toUpperCase()));
