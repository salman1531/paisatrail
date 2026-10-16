import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {expect,it,vi} from 'vitest';
import {newDemo} from '../src/demo';
import {categoryChoices} from '../src/expenseChoices';
import {groupedChoices} from '../src/CategoryPicker';
import {compactPeriodLabel} from '../src/PeriodControls';
import OverviewSummary from '../src/OverviewSummary';
it('keeps compact date ranges unambiguous across month and year boundaries',()=>{
 expect(compactPeriodLabel({start:'2026-10-01',end:'2026-10-31'})).toBe('1–31 Oct 2026');
 expect(compactPeriodLabel({start:'2026-09-25',end:'2026-10-24'})).toBe('25 Sept – 24 Oct 2026');
 expect(compactPeriodLabel({start:'2026-12-25',end:'2027-01-24'})).toBe('25 Dec 2026 – 24 Jan 2027');
});
it('finds a category by leaf, parent or the full displayed path without changing its parent',()=>{
 const ledger=newDemo(),choices=categoryChoices(ledger,'expense');
 const full=groupedChoices(ledger,choices,'Food → Groceries');expect(full).toHaveLength(1);expect(full[0].label).toBe('Groceries');
 expect(groupedChoices(ledger,choices,'groc')[0].value).toBe(full[0].value);
 expect(groupedChoices(ledger,choices,'food').map(c=>c.value)).toContain(full[0].value);
 expect(ledger.categories.find(c=>c.id===full[0].categoryId)?.name).toBe('Food');
});
it('uses identical recorded-money labels and calculations for demo and normal account ledgers',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-17T12:00:00Z'));
 try{const demo=newDemo(),normal=structuredClone(demo);normal.profile.user_id='account-fixture';
 const render=(ledger:typeof demo)=>renderToStaticMarkup(createElement(OverviewSummary,{ledger,filter:{year:'2026',month:'10',category:'all'},editGoals:()=>{},details:()=>{},addExpense:()=>{},busy:false}));
 const html=render(normal);expect(html).toBe(render(demo));expect(html).toContain('48,240.00');expect(html).toContain('66,240.00');expect(html).toContain('Income after recorded outflows');expect(html).not.toContain('available cash');
 }finally{vi.useRealTimers();}
});
