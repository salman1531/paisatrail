import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {afterEach,expect,it,vi} from 'vitest';
import {newDemo} from '../src/demo';
import OverviewInsights from '../src/OverviewInsights';
import type {Ledger} from '../src/types';
afterEach(()=>vi.useRealTimers());
function render(ledger:Ledger,account='all') {return renderToStaticMarkup(createElement(OverviewInsights,{ledger,account,period:{start:'2026-10-01',end:'2026-10-31'},calendar:true,records:()=>{}}));}
it('keeps Overview date/currency scope and includes historical assigned and unassigned records together',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
 const ledger=newDemo('PKR',{legacyAccounts:true}),account=ledger.accounts![0],category=ledger.categories.find(c=>c.kind==='income')!;
 const entry={user_id:ledger.profile.user_id,category_id:category.id,account_id:account.id,date:'2026-10-02',currency:'PKR' as const,amount_minor:12345,notes:'',withdrawal:false};
 ledger.entries=[{...entry,id:'selected'},{...entry,id:'previous',date:'2026-09-02',amount_minor:10000},{...entry,id:'other-currency',currency:'USD',amount_minor:999999},{...entry,id:'other-account',account_id:ledger.accounts![1].id,amount_minor:888888},{...entry,id:'future',date:'2026-11-02',amount_minor:777777}];
 const html=render(ledger,account.id);expect(html).not.toContain(account.name);expect(html).toContain('Through 22 Oct');expect(html).toContain('9,012.33');expect(html).toContain('100.00');expect(html).toContain('8,912.33');expect(html).not.toContain('8,888.88');expect(html).not.toContain('9,999.99');expect(html).not.toContain('7,777.77');
 expect(html).toContain('Income by source');expect(html).not.toContain('Account breakdown');expect(html).not.toContain('summary-card');expect(html).not.toContain('<svg');expect(html).toMatch(/<details class="panel overview-insights"><summary>More insights/);
});
it('retains honest empty states and identical insights for normal and demo accounts',()=>{
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-22T12:00:00Z'));
 const demo=newDemo('PKR');demo.entries=[];const normal=structuredClone(demo);normal.profile.user_id='normal-account';
 const html=render(demo,'__unassigned__');expect(html).toBe(render(normal,'__unassigned__'));expect(html).toContain('No received income in this scope.');expect(html).toContain('No earlier records');expect(html).not.toContain('Account breakdown');expect(html).not.toContain('NaN');expect(html).not.toContain('Infinity');
});
