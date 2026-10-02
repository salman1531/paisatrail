import { describe, expect, it } from 'vitest';
import { emergency, filtered, parseAmount, totals, validDate } from '../src/finance';
import type { Ledger, Entry } from '../src/types';
const ledger: Ledger = {
  profile: { user_id: 'u', currency: 'USD', timezone: 'UTC', income_target: 0, spending_target: 0, saving_target: 0, investment_target: 0, emergency_target: 10000, emergency_contribution: 3000 },
  categories: [
    { id: 'e', user_id: 'u', name: 'Expenses', kind: 'expense', archived: false, essential: false, emergency: false },
    { id: 's', user_id: 'u', name: 'Emergency', kind: 'saving', archived: false, essential: false, emergency: true },
    { id: 'i', user_id: 'u', name: 'Investments', kind: 'investment', archived: false, essential: false, emergency: false },
    { id: 'income', user_id: 'u', name: 'Income', kind: 'income', archived: false, essential: false, emergency: false }
  ], entries: []
};
function entry(category_id: string, amount_minor: number, date = '2026-01-01', extra = {}): Entry { return { id: crypto.randomUUID(), user_id: 'u', category_id, amount_minor, currency: 'USD', date, notes: '', withdrawal: false, ...extra }; }
describe('money and periods', () => {
  it('parses amounts precisely for currencies with 0, 2 and 3 decimal places', () => { expect(parseAmount('0.29', 'USD')).toBe(29); expect(parseAmount('125.50', 'PKR')).toBe(12550); expect(parseAmount('123.456', 'KWD')).toBe(123456); expect(parseAmount('42', 'JPY')).toBe(42); expect(() => parseAmount('900719925474099999999', 'USD')).toThrow(); });
  it('rejects negative, zero, extra precision and exponent amounts', () => { for (const amount of ['-2', '0', '0.001', '1e3', 'Infinity', 'NaN']) expect(() => parseAmount(amount, 'USD')).toThrow(); expect(() => parseAmount('1.1', 'JPY')).toThrow(); expect(parseAmount('0', 'USD', true)).toBe(0); });
  it('does not shift calendar dates and validates leap days', () => { expect(validDate('2024-02-29')).toBe(true); expect(validDate('2025-02-29')).toBe(false); expect(validDate('2026-13-01')).toBe(false); expect(validDate('1899-12-31')).toBe(false); });
  it('filters across year boundaries without leaking adjacent months', () => { const rows = [entry('e', 100, '2025-12-31'), entry('e', 200, '2026-01-01'), entry('s', 300, '2026-02-01')]; expect(filtered(rows, { year: '2026', month: '01', category: 'all' }).map(e => e.amount_minor)).toEqual([200]); expect(filtered(rows, { year: '2026', month: 'all', category: 'all' })).toHaveLength(2); expect(filtered(rows, { year: 'all', month: 'all', category: 's' })).toHaveLength(1); });
  it('keeps contributions out of spending and currencies separate', () => { const rows = [entry('e', 10), entry('e', 20), entry('s', 500), entry('i', 300), entry('s', 100, undefined, { withdrawal: true }), entry('income', 2000), entry('e', 900, undefined, { currency: 'PKR' })]; expect(totals(ledger, rows, 'USD')).toEqual({ expense: 30, saving: 400, investment: 300, income: 2000 }); });
});
describe('emergency savings', () => {
  it('counts only marked savings, net of withdrawals, even after archiving', () => { const l = { ...ledger, categories: ledger.categories.map(c => ({ ...c, archived: true })), entries: [entry('s', 8000), entry('s', 1000, undefined, { withdrawal: true }), entry('i', 30000), entry('s', 50000, undefined, { currency: 'PKR' })] }; expect(emergency(l)).toMatchObject({ funded: 7000, gap: 3000, months: 1, percent: 70 }); });
  it('handles zero contributions, overfunding and no target', () => { expect(emergency({ ...ledger, profile: { ...ledger.profile, emergency_contribution: 0 } }).months).toBeNull(); expect(emergency({ ...ledger, entries: [entry('s', 15000)] })).toMatchObject({ gap: 0, months: 0, percent: 100 }); expect(emergency({ ...ledger, profile: { ...ledger.profile, emergency_target: 0, emergency_contribution: 0 } })).toMatchObject({ months: null, percent: 0 }); });
});
