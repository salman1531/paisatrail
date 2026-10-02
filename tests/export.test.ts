import { expect, it } from 'vitest';
import ExcelJS from 'exceljs';
import { createWorkbook } from '../src/export';
import type { Ledger } from '../src/types';
const ledger: Ledger = { profile: { user_id: 'u', currency: 'USD', timezone: 'UTC', income_target: 0, spending_target: 0, saving_target: 0, investment_target: 0, emergency_target: 0, emergency_contribution: 0 }, categories: [{ id: 'c', user_id: 'u', name: '=HYPERLINK("bad")', kind: 'saving', archived: false, essential: false, emergency: false }], entries: [{ id: '1', user_id: 'u', category_id: 'c', amount_minor: 1234, currency: 'USD', date: '2026-01-01', notes: '=1+1', withdrawal: false }, { id: '2', user_id: 'u', category_id: 'c', amount_minor: 100, currency: 'USD', date: '2026-01-02', notes: '@SUM(A1)', withdrawal: true }, { id: '3', user_id: 'u', category_id: 'c', amount_minor: 300, currency: 'JPY', date: '2026-01-02', notes: '', withdrawal: false }] };
it('round-trips a real XLSX with typed cells, literal user text and reconciled summaries', async () => {
  const workbook = await createWorkbook(ledger, ledger.entries, { year: '2026', month: '01', category: 'all' });
  const buffer = await workbook.xlsx.writeBuffer(); const opened = new ExcelJS.Workbook(); await opened.xlsx.load(buffer);
  const sheet = opened.getWorksheet('Transactions')!;
  expect(sheet.getCell('A2').value).toBeInstanceOf(Date); expect(sheet.getCell('E2').value).toBe(12.34); expect(sheet.getCell('G2').value).toBe('=1+1'); expect(sheet.getCell('B2').type).toBe(ExcelJS.ValueType.String); expect(sheet.getCell('G2').type).toBe(ExcelJS.ValueType.String); expect(sheet.getCell('G3').value).toBe('@SUM(A1)'); expect(sheet.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 });
  const summary = opened.getWorksheet('Summary')!; const amounts: Record<string, number> = {}; summary.eachRow((r, i) => { if (i > 1) amounts[String(r.getCell(4).value)] = Number(r.getCell(5).value); }); expect(amounts).toEqual({ USD: 11.34, JPY: 300 });
});
it('exports a valid empty workbook with headers', async () => { const book = await createWorkbook(ledger, [], { year: '2026', month: '02', category: 'all' }); expect(book.getWorksheet('Transactions')!.rowCount).toBe(1); expect(book.getWorksheet('Summary')!.rowCount).toBe(1); expect((await book.xlsx.writeBuffer()).byteLength).toBeGreaterThan(1000); });
