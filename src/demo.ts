import { today } from './finance';
import type { Ledger, Category, Entry, Kind } from './types';
const user = 'demo';
export function newDemo(): Ledger {
  const day = today(); const month = day.slice(0, 7); const year = day.slice(0, 4);
  const cats: { name: string; kind: Kind; essential?: boolean; emergency?: boolean }[] = [
    { name: 'Expenses', kind: 'expense' }, { name: 'Savings', kind: 'saving' }, { name: 'Investments', kind: 'investment' }, { name: 'Income', kind: 'income' },
    { name: 'Groceries', kind: 'expense', essential: true }, { name: 'Home & bills', kind: 'expense', essential: true }, { name: 'Coffee & dining', kind: 'expense' }, { name: 'Transport', kind: 'expense', essential: true }, { name: 'Emergency fund', kind: 'saving', emergency: true }
  ];
  const categories: Category[] = cats.map((c, i) => ({ id: `demo-cat-${i}`, user_id: user, archived: false, essential: false, emergency: false, ...c }));
  const samples: [number, number, string, string][] = [[3, 480000, `${month}-01`, 'Monthly salary'], [5, 125000, `${month}-01`, 'Rent and utilities'], [8, 45000, `${month}-02`, 'Building a safety net'], [2, 40000, `${month}-02`, 'Monthly contribution'], [4, 6850, `${month}-02`, 'Weekly groceries'], [6, 1850, `${month}-02`, 'Lunch with friends'], [7, 3500, `${month}-01`, 'Travel pass'], [1, 25000, `${month}-01`, 'Holiday savings'], [8, 180000, `${year}-01-15`, 'Earlier emergency savings']];
  const entries: Entry[] = samples.filter(([, , d]) => d <= day).map(([c, amount, date, notes]) => ({ id: crypto.randomUUID(), user_id: user, category_id: categories[c].id, amount_minor: amount, currency: 'PKR', date, notes, withdrawal: false }));
  return { categories, entries, profile: { user_id: user, currency: 'PKR', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, income_target: 480000, spending_target: 240000, saving_target: 70000, investment_target: 50000, emergency_target: 1200000, emergency_contribution: 45000 } };
}
const storageKey = 'pocket-ledger-demo-v1';
export function readDemo(): Ledger {
  try { const raw = localStorage.getItem(storageKey); if (raw) { const v = JSON.parse(raw); if (Array.isArray(v.categories) && Array.isArray(v.entries) && v.profile?.user_id === user) return { ...v, profile: { ...v.profile, saving_target: v.profile.saving_target ?? v.profile.emergency_contribution } }; } } catch { /* Start a fresh demo if saved data is unavailable. */ }
  return newDemo();
}
export function persistDemo(ledger: Ledger) { localStorage.setItem(storageKey, JSON.stringify(ledger)); }
