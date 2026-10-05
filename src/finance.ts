import { kindLabels, kinds, type Currency, type Entry, type Filter, type Ledger } from './types';

// Accounting precision must stay stable across browsers and locale-data updates.
const minorDigits: Record<Currency, number> = { USD: 2, PKR: 2, EUR: 2, GBP: 2, AED: 2, JPY: 0, KWD: 3 };
export function precision(currency: Currency) { return minorDigits[currency]; }
export function parseAmount(value: string, currency: Currency, allowZero = false): number {
  const digits = precision(currency);
  const pattern = digits ? new RegExp(`^\\d+(?:\\.\\d{1,${digits}})?$`) : /^\d+$/;
  if (!pattern.test(value.trim())) throw new Error(`Enter an amount with up to ${digits} decimal places.`);
  const [whole, fraction = ''] = value.trim().split('.');
  const minor = Number(BigInt(whole) * BigInt(10 ** digits) + BigInt(fraction.padEnd(digits, '0') || '0'));
  if (!Number.isSafeInteger(minor) || minor > 1_000_000_000_000 || minor < (allowZero ? 0 : 1)) throw new Error('Enter a valid amount within the supported limit.');
  return minor;
}
export function inputAmount(minor: number, currency: Currency) { return (minor / 10 ** precision(currency)).toFixed(precision(currency)); }
export function money(minor: number, currency: Currency) { const digits = precision(currency); return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(minor / 10 ** digits); }
export function today(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)?.value).join('-');
}
export function dateLabel(date: string) { return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date + 'T12:00:00')); }
export function validDate(date: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < '1900-01-01' || date > '2100-12-31') return false; const d = new Date(date + 'T12:00:00Z'); return !Number.isNaN(+d) && d.toISOString().slice(0, 10) === date; }
export function filtered(entries: Entry[], f: Filter): Entry[] {
  return entries.filter(e => (f.year === 'all' || e.date.slice(0, 4) === f.year) && (f.month === 'all' || e.date.slice(5, 7) === f.month) && (f.category === 'all' || e.category_id === f.category)).sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
export function totals(ledger: Ledger, entries: Entry[], currency: Currency) {
  const result = { expense: 0, saving: 0, investment: 0, income: 0 };
  const cats = new Map(ledger.categories.map(c => [c.id, c]));
  for (const e of entries) {
    if (e.currency !== currency) continue;
    const c = cats.get(e.category_id);
    if (!c) throw new Error('An entry is missing its category. Refresh and try again.');
    result[c.kind] += e.amount_minor * (e.withdrawal ? -1 : 1);
    if (!Number.isSafeInteger(result[c.kind])) throw new Error('Totals exceed the supported numeric range.');
  }
  return result;
}
export function emergency(ledger: Ledger) {
  const ids = new Set(ledger.categories.filter(c => c.kind === 'saving' && c.emergency).map(c => c.id));
  const funded = ledger.entries.filter(e => ids.has(e.category_id) && e.currency === ledger.profile.currency).reduce((v, e) => v + e.amount_minor * (e.withdrawal ? -1 : 1), 0);
  const target = ledger.profile.emergency_target;
  const gap = Math.max(0, target - funded);
  return { funded, target, gap, percent: target > 0 ? Math.max(0, Math.min(100, funded / target * 100)) : 0, months: target > 0 && gap === 0 ? 0 : ledger.profile.emergency_contribution > 0 ? Math.ceil(gap / ledger.profile.emergency_contribution) : null };
}
export function summaryRows(ledger: Ledger, entries: Entry[]) {
  const groups = new Map<string, { month: string; category: string; kind: string; currency: Currency; minor: number; subcategory: string }>();
  for (const e of entries) {
    const c = ledger.categories.find(c => c.id === e.category_id)!;
    const subcategory = (ledger.subcategories ?? []).find(s => s.id === e.subcategory_id)?.name ?? '';
    const key = `${e.date.slice(0, 7)}|${c.id}|${e.subcategory_id ?? ''}|${e.currency}`;
    const row = groups.get(key) ?? { month: e.date.slice(0, 7), category: c.name, subcategory, kind: kindLabels[c.kind], currency: e.currency, minor: 0 };
    row.minor += e.amount_minor * (e.withdrawal ? -1 : 1); groups.set(key, row);
  }
  return [...groups.values()].sort((a, b) => a.month.localeCompare(b.month) || a.category.localeCompare(b.category));
}
export function yearRows(ledger: Ledger, entries: Entry[], currency: Currency, year: string) {
  return Array.from({ length: 12 }, (_, i) => {
    const prefix = `${year}-${String(i + 1).padStart(2, '0')}`;
    const values = totals(ledger, entries.filter(e => e.date.startsWith(prefix)), currency);
    return { month: new Date(2000, i, 1).toLocaleString('en', { month: 'short' }), ...values };
  });
}
export function previousMonth(year: string, month: string) {
  const number = Number(month);
  return { year: String(number === 1 ? Number(year) - 1 : Number(year)), month: String(number === 1 ? 12 : number - 1).padStart(2, '0') };
}
export function categoryComparison(ledger: Ledger, filter: Filter, currency: Currency) {
  if (filter.year === 'all' || filter.month === 'all') return [];
  const prior = previousMonth(filter.year, filter.month);
  const currentEntries = filtered(ledger.entries, filter).filter(e => e.currency === currency);
  const previousEntries = filtered(ledger.entries, { ...filter, ...prior }).filter(e => e.currency === currency);
  return ledger.categories.filter(c => filter.category === 'all' || c.id === filter.category).map(category => {
    const current = currentEntries.filter(e => e.category_id === category.id);
    const previous = previousEntries.filter(e => e.category_id === category.id);
    const net = (entries: Entry[]) => entries.reduce((total, e) => total + e.amount_minor * (e.withdrawal ? -1 : 1), 0);
    const currentMinor = net(current), previousMinor = net(previous);
    if (![currentMinor, previousMinor, currentMinor - previousMinor].every(Number.isSafeInteger)) throw new Error('Comparison totals exceed the supported numeric range.');
    return { category, currentMinor, previousMinor, changeMinor: currentMinor - previousMinor, percent: previousMinor === 0 ? null : (currentMinor - previousMinor) / Math.abs(previousMinor) * 100, currentCount: current.length, previousCount: previous.length };
  }).filter(row => row.currentCount > 0 || row.previousCount > 0).sort((a, b) => Math.max(Math.abs(b.currentMinor), Math.abs(b.previousMinor)) - Math.max(Math.abs(a.currentMinor), Math.abs(a.previousMinor)) || a.category.name.localeCompare(b.category.name));
}
export function monthlyGoals(ledger: Ledger, filter: Filter) {
  if (filter.year === 'all' || filter.month === 'all') return null;
  const actual = totals(ledger, filtered(ledger.entries, { ...filter, category: 'all' }), ledger.profile.currency);
  return { expense: { actual: actual.expense, target: ledger.profile.spending_target }, saving: { actual: actual.saving, target: ledger.profile.saving_target } };
}
export { kindLabels, kinds };
