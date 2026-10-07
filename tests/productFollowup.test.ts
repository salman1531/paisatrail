import {writeFile} from 'node:fs/promises';
import {expect,it} from 'vitest';
import ExcelJS from 'exceljs';
import {newDemo} from '../src/demo';
import {filtered,totals} from '../src/finance';
import {reportingLedger} from '../src/reporting';
import {pendingAllocations} from '../src/pendingAllocations';
import {spendingBreakdown} from '../src/spendingBreakdown';
import {createWorkbook} from '../src/export';
import type {Ledger} from '../src/types';
const month='2026-10';
const filter={year:'2026',month:'10',category:'all'};
function fixture():Ledger {
 const ledger=newDemo('PKR');
 ledger.categories=[{id:'expense',user_id:'demo',name:'Expenses',kind:'expense',archived:false,essential:false,emergency:false},{id:'saving',user_id:'demo',name:'Savings',kind:'saving',archived:false,essential:false,emergency:false},{id:'investment',user_id:'demo',name:'Investments',kind:'investment',archived:false,essential:false,emergency:false}];
 ledger.subcategories=[{id:'groceries',user_id:'demo',category_id:'expense',name:'Groceries',archived:false},{id:'bills',user_id:'demo',category_id:'expense',name:'Bills',archived:true}];
 ledger.entries=[{id:'1',user_id:'demo',category_id:'expense',subcategory_id:'groceries',amount_minor:20000,currency:'PKR',date:month+'-01',notes:'Groceries',withdrawal:false},{id:'2',user_id:'demo',category_id:'expense',subcategory_id:'bills',amount_minor:10000,currency:'PKR',date:month+'-02',notes:'Bills',withdrawal:false},{id:'3',user_id:'demo',category_id:'expense',amount_minor:5000,currency:'PKR',date:month+'-03',notes:'Direct entry',withdrawal:false},{id:'4',user_id:'demo',category_id:'expense',subcategory_id:'groceries',amount_minor:1025,currency:'USD',date:month+'-01',notes:'=1+1',withdrawal:false}];
 ledger.goals=[{id:'s',user_id:'demo',period:month,currency:'PKR',kind:'saving',category_id:null,target_minor:50000},{id:'i',user_id:'demo',period:month,currency:'PKR',kind:'investment',category_id:null,target_minor:40000}];
 return ledger;
}
it('shows pending contributions without changing accounting; withdrawals reopen the gap and currencies/months stay separate',()=>{
 const ledger=fixture();ledger.entries.push({id:'s1',user_id:'demo',category_id:'saving',date:month+'-01',currency:'PKR',amount_minor:10000,notes:'',withdrawal:false},{id:'s2',user_id:'demo',category_id:'saving',date:month+'-02',currency:'PKR',amount_minor:2000,notes:'',withdrawal:true},{id:'i1',user_id:'demo',category_id:'investment',date:month+'-01',currency:'PKR',amount_minor:60000,notes:'',withdrawal:false});
 const before=totals(ledger,filtered(ledger.entries,filter),'PKR');
 expect(pendingAllocations(ledger,filter)).toEqual({saving:42000,investment:0,total:42000});
 expect(totals(ledger,filtered(ledger.entries,filter),'PKR')).toEqual(before);
 expect(pendingAllocations(reportingLedger(ledger,'USD'),filter)).toBeNull();
 expect(pendingAllocations(ledger,{...filter,month:'all'})).toBeNull();
 ledger.goals![0].target_minor=0;expect(pendingAllocations(ledger,filter)?.saving).toBe(0);
});
it('breaks generic parents into leaf spending without losing archived/direct history or mixing currency',()=>{
 const ledger=fixture();const before=JSON.stringify(ledger);
 const detailed=spendingBreakdown(ledger,{...filter,category:'not-a-report-filter'},'subcategory');
 expect(detailed.map(r=>[r.name,r.amount,r.archived])).toEqual([['Groceries',20000,false],['Bills',10000,true],['Expenses',5000,false]]);
 expect(detailed[2].parent).toBe('No subcategory');
 expect(detailed.reduce((sum,r)=>sum+r.amount,0)).toBe(totals(ledger,filtered(ledger.entries,filter),'PKR').expense);
 expect(spendingBreakdown(ledger,filter,'category').map(r=>[r.name,r.amount])).toEqual([['Expenses',35000]]);
 expect(JSON.stringify(ledger)).toBe(before);
 expect(spendingBreakdown(ledger,{...filter,month:'11'},'subcategory')).toEqual([]);
});
it('round-trips the actual currency-filtered XLSX with matching rows, summaries and export scope',async()=>{
 const ledger=fixture();const scope={...filter,currency:'USD' as const};const entries=filtered(ledger.entries,scope);
 const book=await createWorkbook(ledger,entries,scope);const bytes=await book.xlsx.writeBuffer();if(process.env.PAISA_EXPORT_PROOF)await writeFile(process.env.PAISA_EXPORT_PROOF,Buffer.from(bytes));const opened=new ExcelJS.Workbook();await opened.xlsx.load(bytes);
 const sheet=opened.getWorksheet('Transactions')!;
 expect(sheet.rowCount).toBe(2);expect(sheet.getCell('F2').value).toBe('USD');expect(sheet.getCell('E2').value).toBe(10.25);expect(sheet.getCell('G2').value).toBe('=1+1');expect(sheet.getCell('H2').value).toBe('Groceries');
 const summary=opened.getWorksheet('Summary')!;expect(summary.rowCount).toBe(2);expect(summary.getCell('D2').value).toBe('USD');expect(summary.getCell('E2').value).toBe(10.25);
 expect(opened.getWorksheet('Export details')!.getCell('B5').value).toBe('USD');
 expect(filtered(ledger.entries,{...filter,currency:'all'})).toHaveLength(4);
 expect(filtered(ledger.entries,{...scope,category:'saving'})).toHaveLength(0);
});
