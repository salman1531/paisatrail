import { expect, it } from 'vitest';
import { categoryComparison, monthlyGoals, previousMonth } from '../src/finance';
import type { Ledger, Entry } from '../src/types';
const ledger: Ledger = { profile: { user_id: 'u', currency: 'PKR', timezone: 'UTC', income_target: 100000, spending_target: 20000, saving_target: 15000, investment_target: 0, emergency_contribution: 5000, emergency_target: 100000 }, categories: [
  { id: 'e', user_id: 'u', name: 'Groceries', kind: 'expense', archived: false, essential: true, emergency: false },
  { id: 's', user_id: 'u', name: 'Emergency', kind: 'saving', archived: true, essential: false, emergency: true },
  { id: 'other', user_id: 'u', name: 'Travel', kind: 'expense', archived: false, essential: false, emergency: false }
], entries: [] };
function entry(category_id: string, date: string, amount_minor: number, extra = {}): Entry { return { id: crypto.randomUUID(), user_id: 'u', category_id, date, amount_minor, currency: 'PKR', withdrawal: false, notes: '', ...extra }; }
it('compares January to December across years with correct changes and currency isolation', () => {
  expect(previousMonth('2026', '01')).toEqual({ year: '2025', month: '12' });
  const l = { ...ledger, entries: [entry('e', '2025-12-31', 10000), entry('e', '2026-01-01', 15000), entry('e', '2026-01-02', 5000), entry('e', '2026-01-03', 999999, { currency: 'USD' }), entry('e', '2026-02-01', 900000), entry('s', '2025-12-01', 20000), entry('s', '2026-01-02', 12000), entry('s', '2026-01-03', 2000, { withdrawal: true })] };
  const rows = categoryComparison(l, { year: '2026', month: '01', category: 'all' }, 'PKR');
  expect(rows.find(r => r.category.id === 'e')).toMatchObject({ currentMinor: 20000, previousMinor: 10000, changeMinor: 10000, percent: 100, currentCount: 2 });
  expect(rows.find(r => r.category.id === 's')).toMatchObject({ currentMinor: 10000, previousMinor: 20000, changeMinor: -10000, percent: -50 });
});
it('handles new activity, unchanged amounts, negative net savings and category filters', () => {
  const l = { ...ledger, entries: [entry('other', '2026-02-01', 200), entry('e', '2026-01-01', 100), entry('e', '2026-02-01', 100), entry('s', '2026-01-01', 100, { withdrawal: true }), entry('s', '2026-02-01', 200, { withdrawal: true })] };
  const rows = categoryComparison(l, { year: '2026', month: '02', category: 'all' }, 'PKR');
  expect(rows.find(r => r.category.id === 'other')).toMatchObject({ previousMinor: 0, percent: null }); expect(rows.find(r => r.category.id === 'e')).toMatchObject({ changeMinor: 0, percent: 0 }); expect(rows.find(r => r.category.id === 's')).toMatchObject({ previousMinor: -100, currentMinor: -200, changeMinor: -100, percent: -100 });
  expect(categoryComparison(l, { year: '2026', month: '02', category: 'e' }, 'PKR')).toHaveLength(1);
});
it('compares all-category actuals with monthly targets and keeps emergency savings included once', () => {
  const l = { ...ledger, entries: [entry('e', '2026-02-01', 12000), entry('other', '2026-02-02', 9000), entry('s', '2026-02-01', 15000), entry('s', '2026-02-02', 3000, { withdrawal: true }), entry('e', '2026-01-01', 99999), entry('e', '2026-02-02', 99999, { currency: 'USD' })] };
  expect(monthlyGoals(l, { year: '2026', month: '02', category: 'e' })).toEqual({ expense: { actual: 21000, target: 20000 }, saving: { actual: 12000, target: 15000 } });
});
it('requires a specific month and handles empty history without dividing by zero', () => {
  expect(categoryComparison(ledger, { year: '2026', month: 'all', category: 'all' }, 'PKR')).toEqual([]); expect(monthlyGoals(ledger, { year: 'all', month: 'all', category: 'all' })).toBeNull(); expect(monthlyGoals(ledger, { year: '2026', month: '02', category: 'all' })).toMatchObject({ expense: { actual: 0 }, saving: { actual: 0 } });
});
