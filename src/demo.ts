import { today } from './finance';
import type { Ledger, Category, Entry, Kind, Subcategory } from './types';
const user = 'demo';
export function newDemo(): Ledger {
  const day = today(); const month = day.slice(0, 7); const year = day.slice(0, 4);
  const cats: { name: string; kind: Kind; essential?: boolean; emergency?: boolean }[] = [
    { name: 'Expenses', kind: 'expense' }, { name: 'Savings', kind: 'saving' }, { name: 'Investments', kind: 'investment' }, { name: 'Income', kind: 'income' },
    { name: 'Groceries', kind: 'expense', essential: true }, { name: 'Home & bills', kind: 'expense', essential: true }, { name: 'Coffee & dining', kind: 'expense' }, { name: 'Transport', kind: 'expense', essential: true }, { name: 'Emergency fund', kind: 'saving', emergency: true }
  ];
  const categories: Category[] = cats.map((c, i) => ({ id: `demo-cat-${i}`, user_id: user, archived: false, essential: false, emergency: false, ...c }));
  const subcategories: Subcategory[] = [[5, 'Rent'], [5, 'Bills'], [7, 'Travel'], [7, 'Petrol']].map(([parent, name], i) => ({ id: `demo-sub-${i}`, user_id: user, category_id: categories[Number(parent)].id, name: String(name), archived: false }));
  const starterChoices: [number,string,boolean][] = [[0, 'Groceries', false], [0, 'Food & dining', false], [0, 'Rent', false], [0, 'Bills', false], [0, 'Travel', false], [0, 'Petrol', false], [0, 'Shopping', false], [0, 'Other expenses', false], [0, 'Healthcare', false], [0, 'Education', false], [0, 'Entertainment', false], [0, 'Subscriptions', false], [0, 'Insurance', false], [0, 'Home maintenance', false], [0, 'Gifts & charity', false], [0, 'Childcare', false], [0, 'Fitness', false], [0, 'Personal care', false], [0, 'Pets', false], [1, 'Emergency fund', true], [1, 'Travel savings', false], [1, 'Home deposit', false], [1, 'Car savings', false], [1, 'Education savings', false], [1, 'Wedding savings', false], [1, 'Retirement savings', false], [1, 'Rainy-day savings', false], [1, 'Other savings', false], [2, 'Stocks', false], [2, 'Mutual funds', false], [2, 'ETFs', false], [2, 'Bonds', false], [2, 'Gold', false], [2, 'Real estate', false], [2, 'Retirement investments', false], [2, 'Other investments', false]];
  for(const [parent,name,emergency] of starterChoices)if(!categories.some(c=>c.name.toLowerCase()===name.toLowerCase())&&!subcategories.some(s=>s.name.toLowerCase()===name.toLowerCase()))subcategories.push({id:crypto.randomUUID(),user_id:user,category_id:categories[parent].id,name,archived:false,emergency});
  const samples: [number, number, string, string][] = [[3, 480000, `${month}-01`, 'Monthly salary'], [5, 125000, `${month}-01`, 'Rent and utilities'], [8, 45000, `${month}-02`, 'Building a safety net'], [2, 40000, `${month}-02`, 'Monthly contribution'], [4, 6850, `${month}-02`, 'Weekly groceries'], [6, 1850, `${month}-02`, 'Lunch with friends'], [7, 3500, `${month}-01`, 'Travel pass'], [1, 25000, `${month}-01`, 'Holiday savings'], [8, 180000, `${year}-01-15`, 'Earlier emergency savings']];
  const entries: Entry[] = samples.filter(([, , d]) => d <= day).map(([c, amount, date, notes]) => ({ id: crypto.randomUUID(), user_id: user, category_id: categories[c].id, subcategory_id: c === 5 ? subcategories[0].id : c === 7 ? subcategories[2].id : null, amount_minor: amount, currency: 'PKR', date, notes, withdrawal: false }));
  return { categories, subcategories, entries, profile: { user_id: user, currency: 'PKR', timezone: Intl.DateTimeFormat().resolvedOptions().timeZone, income_target: 480000, spending_target: 240000, saving_target: 70000, investment_target: 50000, emergency_target: 1200000, emergency_contribution: 45000 } };
}
const storageKey = 'pocket-ledger-demo-v1';
export function readDemo(): Ledger {
  try { const raw = localStorage.getItem(storageKey); if (raw) { const v = JSON.parse(raw); if (Array.isArray(v.categories) && Array.isArray(v.entries) && v.profile?.user_id === user) return { ...v, subcategories: Array.isArray(v.subcategories) ? v.subcategories : [], profile: { ...v.profile, saving_target: v.profile.saving_target ?? v.profile.emergency_contribution } }; } } catch { /* Start a fresh demo if saved data is unavailable. */ }
  return newDemo();
}
export function persistDemo(ledger: Ledger) { localStorage.setItem(storageKey, JSON.stringify(ledger)); }
