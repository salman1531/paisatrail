import ExcelJS from 'exceljs';
import { kindLabels, precision, summaryRows } from './finance';
import type { Entry, Filter, Ledger } from './types';

export async function createWorkbook(ledger: Ledger, entries: Entry[], filter: Filter) {
  const workbook = new ExcelJS.Workbook(); workbook.creator = 'PaisaTrail'; workbook.created = new Date();
  const sheet = workbook.addWorksheet('Transactions', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = [{ header: 'Date', key: 'date', width: 15 }, { header: 'Category', key: 'category', width: 26 }, { header: 'Type', key: 'kind', width: 18 }, { header: 'Movement', key: 'movement', width: 18 }, { header: 'Amount', key: 'amount', width: 20 }, { header: 'Currency', key: 'currency', width: 12 }, { header: 'Notes', key: 'notes', width: 48 }, { header: 'Subcategory', key: 'subcategory', width: 24 }];
  for (const e of entries) {
    const c = ledger.categories.find(c => c.id === e.category_id)!;
    // User strings are assigned as strings, never Excel formula objects.
    const row = sheet.addRow({ date: new Date(e.date + 'T00:00:00Z'), category: String(c.name), kind: kindLabels[c.kind], movement: e.withdrawal ? 'Withdrawal' : 'Recorded', amount: e.amount_minor / 10 ** precision(e.currency), currency: e.currency, notes: String(e.notes), subcategory: String((ledger.subcategories ?? []).find(s => s.id === e.subcategory_id)?.name ?? '') });
    row.getCell('date').numFmt = 'yyyy-mm-dd'; row.getCell('amount').numFmt = precision(e.currency) ? '#,##0.' + '0'.repeat(precision(e.currency)) : '#,##0';
  }
  sheet.autoFilter = { from: 'A1', to: 'H1' };
  const summary = workbook.addWorksheet('Summary', { views: [{ state: 'frozen', ySplit: 1 }] });
  summary.columns = [{ header: 'Month', key: 'month', width: 15 }, { header: 'Category', key: 'category', width: 26 }, { header: 'Type', key: 'kind', width: 18 }, { header: 'Currency', key: 'currency', width: 12 }, { header: 'Net amount', key: 'amount', width: 22 }, { header: 'Subcategory', key: 'subcategory', width: 24 }];
  for (const s of summaryRows(ledger, entries)) { const row = summary.addRow({ ...s, amount: s.minor / 10 ** precision(s.currency) }); row.getCell('amount').numFmt = precision(s.currency) ? '#,##0.' + '0'.repeat(precision(s.currency)) : '#,##0'; }
  const info = workbook.addWorksheet('Export details');
  info.addRows([['PaisaTrail export'], ['Year', filter.year], ['Month', filter.month], ['Category', filter.category === 'all' ? 'All categories' : ledger.categories.find(c => c.id === filter.category)?.name ?? ''], ['Entries', entries.length], ['Generated', new Date()], ['Summary', 'Savings and investments are net of withdrawals. Currencies are kept separate.']]);
  info.getColumn(1).width = 22; info.getColumn(2).width = 90;
  for (const tab of [sheet, summary]) { tab.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; tab.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF162B24' } }; tab.getRow(1).height = 26; tab.eachRow((row, index) => { if (index > 1) { row.height = 22; if (index % 2 === 0) row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F6F4' } }; } }); }
  return workbook;
}
export async function downloadWorkbook(ledger: Ledger, entries: Entry[], filter: Filter) {
  const workbook = await createWorkbook(ledger, entries, filter); const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `paisatrail-${filter.year}-${filter.month}.xlsx`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}
