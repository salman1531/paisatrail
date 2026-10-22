import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it} from 'vitest';
import {newDemo} from '../src/demo';
import {compatibleRecordingAccount} from '../src/recording';
import {validateExpenseDraft,expenseDraft} from '../src/ExpenseBatchForm';
import EntryForm from '../src/EntryForm';
import OverviewSummary from '../src/OverviewSummary';
import {TransferForm} from '../src/AccountsPanel';
import {totals,filtered} from '../src/finance';
it('starts the demo without financial accounts, assignments or transfers while retaining recurring items',()=>{
 const ledger=newDemo('PKR');expect(ledger.accounts).toEqual([]);expect(ledger.transfers).toEqual([]);expect(ledger.entries.every(e=>!e.account_id)).toBe(true);expect(ledger.schedules?.length).toBeGreaterThan(0);expect(ledger.schedules?.every(s=>!s.account_id)).toBe(true);
});
it('preserves compatible historical assignments and deliberately detaches incompatible corrections',()=>{
 const ledger=newDemo('PKR',{legacyAccounts:true}),entry=ledger.entries[0],a=ledger.accounts!.find(a=>a.id===entry.account_id)!;
 expect(compatibleRecordingAccount(ledger,entry,entry.currency,entry.date)).toBe(a.id);expect(compatibleRecordingAccount(ledger,null,entry.currency,entry.date)).toBeNull();expect(compatibleRecordingAccount(ledger,entry,'USD',entry.date)).toBeNull();expect(compatibleRecordingAccount(ledger,entry,entry.currency,'1900-01-01')).toBeNull();expect(entry.account_id).toBe(a.id);
 expect(compatibleRecordingAccount({...ledger,accounts:ledger.accounts!.map(a=>({...a,user_id:'another-user'}))},entry,entry.currency,entry.date)).toBeNull();
});
it('keeps every recording type free of account selectors, even with historical wallets present',()=>{
 const ledger=newDemo('PKR',{legacyAccounts:true}),before=JSON.stringify(ledger);
 for(const kind of ['expense','income','saving','investment'] as const){const html=renderToStaticMarkup(createElement(EntryForm,{ledger,entry:'new',initialKind:kind,busy:false,close:()=>{},save:async e=>e,saveSource:async s=>s}));expect(html).not.toMatch(/<label>Account/);expect(html).not.toContain('Unassigned records');expect(html).toContain('Amount');expect(html).toContain('Date');}
 const choices=ledger.subcategories!.find(s=>s.name==='Groceries')!,draft={...expenseDraft(ledger),choice:choices.id,amount:'12.50',account:ledger.accounts![0].id};const checked=validateExpenseDraft(ledger,draft,'PKR');expect(checked.errors).toEqual({});expect(checked.submission.entry.account_id).toBeNull();expect(checked.submission.entry.amount_minor).toBe(1250);expect(JSON.stringify(ledger)).toBe(before);
});
it('shows recorded income left instead of an opening-balance-based figure without changing old history',()=>{
 const ledger=newDemo('PKR',{legacyAccounts:true}),filter={year:ledger.entries[0].date.slice(0,4),month:ledger.entries[0].date.slice(5,7),category:'all'},before=JSON.stringify(ledger),values=totals(ledger,filtered(ledger.entries,filter),'PKR');
 const html=renderToStaticMarkup(createElement(OverviewSummary,{ledger,filter,editGoals:()=>{},details:()=>{},addExpense:()=>{},busy:false}));expect(html).toContain('Income left (recorded)');expect(html).not.toContain('Tracked account balance');expect(html).not.toContain('All accounts');expect(html).not.toContain('Unassigned');expect(html).toContain(new Intl.NumberFormat('en',{minimumFractionDigits:2}).format((values.income-values.expense-values.saving-values.investment)/100));expect(JSON.stringify(ledger)).toBe(before);
});
it('retains original transfer endpoints for legacy corrections without editable account fields',()=>{
 const ledger=newDemo('PKR',{legacyAccounts:true}),initial=ledger.transfers![0],before=JSON.stringify(initial),html=renderToStaticMarkup(createElement(TransferForm,{ledger,initial,busy:false,close:()=>{},save:async()=>{}}));expect(html).toContain('Save correction');expect(html).not.toContain('From account');expect(html).not.toContain('To account');expect(JSON.stringify(initial)).toBe(before);
});
