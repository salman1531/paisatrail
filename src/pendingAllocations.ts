import {periodGoalRows} from './goals';
import type {Filter,Ledger} from './types';

export function pendingAllocations(ledger:Ledger,filter:Filter) {
  if(filter.year==='all'||filter.month==='all')return null;
  const rows=periodGoalRows(ledger,{...filter,category:'all'});
  const gap=(kind:'saving'|'investment')=>{
    const row=rows.find(r=>r.category_id===null&&r.kind===kind);
    return row?.target==null?null:Math.max(0,row.target-row.actual);
  };
  const saving=gap('saving'),investment=gap('investment');
  return saving===null&&investment===null?null:{saving,investment,total:(saving??0)+(investment??0)};
}
