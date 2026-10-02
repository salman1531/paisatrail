import { filtered, today, totals } from './finance';
import { kinds, type Filter, type Kind, type Ledger } from './types';
const profileKeys = { income: 'income_target', expense: 'spending_target', saving: 'saving_target', investment: 'investment_target' } as const;
export function goalPeriod(filter: Filter) { return filter.year === 'all' ? null : filter.month === 'all' ? filter.year : `${filter.year}-${filter.month}`; }
export function periodGoalRows(ledger: Ledger, filter: Filter) {
  const period = goalPeriod(filter); if (!period) return [];
  const goals = (ledger.goals ?? []).filter(g => g.period === period && g.currency === ledger.profile.currency);
  const actual = totals(ledger, filtered(ledger.entries, { ...filter, category: 'all' }), ledger.profile.currency);
  const overall = kinds.map(kind => {
    const explicit = goals.find(g => g.kind === kind && g.category_id === null);
    const fallback = period.length === 7 ? ledger.profile[profileKeys[kind]] : 0;
    return { key: kind, kind, category_id: null, label: kind === 'expense' ? 'Expense limit' : `${kind === 'income' ? 'Earnings' : kind === 'saving' ? 'Savings' : 'Investment'} goal`, target: explicit?.target_minor ?? (fallback > 0 ? fallback : null), actual: actual[kind], source: explicit ? 'Saved for this period' : fallback > 0 ? 'Default monthly plan' : 'No goal set' };
  });
  const categoryRows = goals.filter(g => g.category_id !== null).map(g => {
    const category = ledger.categories.find(c => c.id === g.category_id)!;
    return { key: g.id, kind: g.kind, category_id: g.category_id, label: `${category.name}${category.archived ? ' · archived' : ''}`, target: g.target_minor, actual: ledger.entries.filter(e => e.category_id === g.category_id && e.currency === g.currency && e.date.startsWith(period)).reduce((v,e)=>v+e.amount_minor,0), source: 'Category expense limit' };
  });
  return [...overall, ...categoryRows];
}
export function monthlyGoalSum(ledger: Ledger, year: string, kind: Kind) {
  const sum = Array.from({length:12},(_,i)=>periodGoalRows(ledger,{year,month:String(i+1).padStart(2,'0'),category:'all'}).find(r=>r.kind===kind && r.category_id===null)?.target ?? 0).reduce((a,b)=>a+b,0);
  if (!Number.isSafeInteger(sum) || sum > 1_000_000_000_000) throw new Error('Combined monthly goals exceed the supported limit.');
  return sum;
}
export function elapsedPeriod(ledger: Ledger, period: string) {
  const date = today(ledger.profile.timezone);
  const start = `${period}${period.length === 4 ? '-01-01' : '-01'}`;
  const end = period.length === 4 ? `${Number(period)+1}-01-01` : new Date(Date.UTC(Number(period.slice(0,4)),Number(period.slice(5,7)),1)).toISOString().slice(0,10);
  const utc = (value: string) => Date.parse(value+'T00:00:00Z');
  return Math.max(0,Math.min(1,(utc(date)-utc(start))/(utc(end)-utc(start))));
}
