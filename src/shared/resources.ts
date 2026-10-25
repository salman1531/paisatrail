import type {Activity,Expense,Report,Settlement,SharedPage,Summary} from './model';
import type {SharedService} from './service';
import {readScope,recordsFilter,reportFilter} from './reporting';
export type SharedData={rows:Summary[]|null;records:Expense[]|null;expenses:Expense[]|null;settlements:Settlement[]|null;activity:Activity[]|null;report:Report|null};
export const emptyData:SharedData={rows:null,records:null,expenses:null,settlements:null,activity:null,report:null};
/** A failed section never erases a successful one or becomes a fabricated zero. */
export async function fetchSections(service:SharedService,page:SharedPage,contextId:string|undefined,query:string,onSection?:(key:keyof SharedData,result:PromiseSettledResult<unknown>)=>void){
 const s=readScope(query),period=reportFilter(s,contextId),history=recordsFilter(s,contextId),details=Boolean(contextId);
 const jobs:[keyof SharedData,Promise<unknown>][]=[['rows',service.summary()]];
 if(page==='dashboard'||page==='reports'||details)jobs.push(['report',service.report(period)]);
 if(page==='dashboard'||details)jobs.push(['expenses',service.expenses({...period,offset:page==='dashboard'?0:s.offset})]);
 if(s.records)jobs.push(['records',service.expenses(history)]);
 if(page==='dashboard'||page==='settlements'||page==='reports'||details)jobs.push(['settlements',service.settlements({...period,offset:page==='settlements'||page==='reports'?s.offset:0})]);
 if(page==='activity')jobs.push(['activity',service.activity({...period,offset:s.offset})]);
 const results=await Promise.allSettled(jobs.map(async([key,job])=>{try{const value=await job;onSection?.(key,{status:'fulfilled',value});return value;}catch(reason){onSection?.(key,{status:'rejected',reason});throw reason;}})),updates:Partial<SharedData>={},errors:Partial<Record<keyof SharedData,string>>={};
 results.forEach((r,i)=>{const key=jobs[i][0];if(r.status==='fulfilled')Object.assign(updates,{[key]:r.value});else errors[key]=r.reason?.message??'Could not load this section.';});
 return {updates,errors};
}
