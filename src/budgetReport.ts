import { filtered, totals, validDate } from './finance';
import type { Filter, Kind, Ledger } from './types';

const keys = { income: 'income_target', expense: 'spending_target', saving: 'saving_target', investment: 'investment_target' } as const;
export type BudgetRow = { id: string; name: string; kind: Kind; target: number | null; actual: number; contribution: number; withdrawal: number; remaining: number | null; percent: number | null; source: string; count: number; archived?: boolean };
type MonthSlice = { month: string; days: number; fullDays: number };
export function reportMonths(filter: Filter): MonthSlice[] {
  let start: string, end: string;
  if (filter.startDate && filter.endDate) { start = filter.startDate; end = filter.endDate; }
  else if (filter.year !== 'all') { start = `${filter.year}-${filter.month === 'all' ? '01' : filter.month}-01`; end = filter.month === 'all' ? `${filter.year}-12-31` : `${filter.year}-${filter.month}-${new Date(Date.UTC(Number(filter.year), Number(filter.month), 0)).getUTCDate()}`; }
  else return [];
  if (!validDate(start) || !validDate(end) || start > end) throw new Error('Choose a valid date range between 1900 and 2100.');
  const result: MonthSlice[] = [];
  let year = Number(start.slice(0,4)), month = Number(start.slice(5,7));
  while (`${year}-${String(month).padStart(2,'0')}` <= end.slice(0,7)) {
    const label = `${year}-${String(month).padStart(2,'0')}`;
    const fullDays = new Date(Date.UTC(year,month,0)).getUTCDate();
    const first = label === start.slice(0,7) ? Number(start.slice(8)) : 1;
    const last = label === end.slice(0,7) ? Number(end.slice(8)) : fullDays;
    result.push({month:label,days:last-first+1,fullDays});
    if (++month > 12) { month = 1; year++; }
  }
  return result;
}
export function reportTarget(ledger: Ledger, filter: Filter, kind: Kind, categoryId: string | null = null) {
  const months = reportMonths(filter);
  if (!months.length) return {target:null,source:'Select a period to compare monthly plans'};
  let target = 0, missing = 0, defaults = 0;
  for (const m of months) {
    const goal = (ledger.goals ?? []).find(g => g.currency === ledger.profile.currency && g.period === m.month && g.kind === kind && g.category_id === categoryId);
    const fallback = categoryId === null && ledger.profile.currency === (ledger.profile.planning_currency ?? ledger.profile.currency) ? ledger.profile[keys[kind]] : 0;
    const amount = goal ? goal.target_minor : fallback > 0 ? fallback : null;
    if (amount === null) { missing++; continue; }
    if (!goal) defaults++;
    // Round each month's calendar-day allocation to the currency's minor unit.
    const weighted = (BigInt(amount) * BigInt(m.days) * 2n + BigInt(m.fullDays)) / (BigInt(m.fullDays) * 2n);
    target += Number(weighted);
    if (!Number.isSafeInteger(target)) throw new Error('Combined targets exceed the supported numeric range.');
  }
  const partial = months.some(m => m.days !== m.fullDays);
  return {target:missing ? null : target,source:missing ? `${missing} ${missing===1?'month has':'months have'} no ${categoryId?'limit':'plan'}` : `${defaults ? 'Using default plan' : 'Saved monthly plans'}${months.length>1?` · ${months.length} months`:''}${partial?' · prorated by calendar days':''}`};
}
export function budgetReport(ledger: Ledger, filter: Filter) {
  const entries = filtered(ledger.entries,{...filter, category:'all', subcategory:undefined, currency:ledger.profile.currency});
  const values = totals(ledger,entries,ledger.profile.currency);
  function row(id:string,name:string,kind:Kind,categoryId:string|null,subcategoryId?:string): BudgetRow {
    const selected = entries.filter(e => (categoryId===null || e.category_id===categoryId) && (!subcategoryId || e.subcategory_id===subcategoryId) && ledger.categories.find(c=>c.id===e.category_id)?.kind===kind);
    const contribution = selected.filter(e=>!e.withdrawal).reduce((v,e)=>v+e.amount_minor,0);
    const withdrawal = selected.filter(e=>e.withdrawal).reduce((v,e)=>v+e.amount_minor,0);
    const actual = contribution-withdrawal;
    if(![contribution,withdrawal,actual].every(Number.isSafeInteger))throw new Error('Category totals exceed the supported numeric range.');
    const plan = subcategoryId ? {target:null,source:'Limits are set on parent categories'} : reportTarget(ledger,filter,kind,categoryId);
    return {id,name,kind,...plan,actual,contribution,withdrawal,remaining:plan.target===null?null:plan.target-actual,percent:plan.target!==null&&plan.target>0?actual/plan.target*100:null,count:selected.length};
  }
  const main = (['expense','saving','investment'] as const).map(kind=>row(kind,kind==='expense'?'Expenses':kind==='saving'?'Savings':'Investments',kind,null));
  const categories = ledger.categories.map(c=>({...row(c.id,c.name,c.kind,c.id),archived:c.archived})).filter(r=>!r.archived||r.count>0||r.target!==null).sort((a,b)=>b.actual-a.actual||a.name.localeCompare(b.name));
  const subcategories = (ledger.subcategories??[]).map(s=>{const c=ledger.categories.find(c=>c.id===s.category_id)!;return {...row(s.id,s.name,c.kind,c.id,s.id),parentId:c.id,archived:s.archived||c.archived};}).filter(r=>!r.archived||r.count>0);
  return {main,categories,subcategories,values};
}
export function varianceLabel(row: BudgetRow) {
  if (row.remaining===null) return 'Not set';
  if (row.kind==='expense') return row.remaining<0?'Over budget':'Budget remaining';
  return row.remaining<0?'Above target':row.remaining===0?'Target reached':'To target';
}
