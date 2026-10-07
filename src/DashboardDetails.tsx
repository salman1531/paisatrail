import {spendingBreakdown} from './spendingBreakdown';
import { useState } from 'react';
import { filtered, money, totals, yearRows } from './finance';
import type { Filter, Ledger } from './types';

const colors = ['#285943', '#87a958', '#cf975a', '#718eae', '#a17f9c', '#74877a'];
export default function DashboardDetails({ ledger, filter, selectMonth }: { ledger: Ledger; filter: Filter; selectMonth: (month: string) => void }) {
  const [active, setActive] = useState<number | null>(null);
  const currency = ledger.profile.currency;
  const entries = filtered(ledger.entries, filter).filter(e => e.currency === currency);
  const sum = totals(ledger, entries, currency);
  const periodTotals = totals(ledger, filtered(ledger.entries, {...filter, category:'all'}), currency);
  const cashflow = periodTotals.income - periodTotals.expense;
  const rate = periodTotals.income > 0 ? (periodTotals.saving + periodTotals.investment) / periodTotals.income * 100 : null;
  const [spendingView,setSpendingView]=useState<'category'|'subcategory'|null>(null);
  const view=spendingView??(ledger.categories.filter(c=>c.kind==='expense').length<=1?'subcategory':'category');
  const spending=spendingBreakdown(ledger,filter,view);
  const rows = filter.year === 'all' ? [] : yearRows(ledger, filtered(ledger.entries, { ...filter, month: 'all' }), currency, filter.year);
  const peak = Math.max(1, ...rows.flatMap(r => [r.income, r.expense]));
  const selected = active === null ? null : rows[active];
  let angle = 0;
  const gradient = spending.map((r, i) => { const start = angle; angle += r.amount / sum.expense * 360; return `${colors[i % colors.length]} ${start}deg ${angle}deg`; }).join(',');
  return <>
    <section className="financial-pulse" aria-label="Financial details">
      <div><span>{periodTotals.income > 0 && cashflow < 0 ? 'Expenses above income' : 'Income after expenses'}</span><strong className={periodTotals.income > 0 && cashflow < 0 ? 'negative' : ''}>{periodTotals.income <= 0 ? '—' : money(Math.abs(cashflow), currency)}</strong><small>{periodTotals.income <= 0 ? 'Record income to compare with expenses' : 'Recorded income and expenses · all categories'}</small></div>
      <div><span>Savings & investment rate</span><strong>{rate === null ? '—' : `${rate.toFixed(1)}%`}</strong><small>{rate === null ? 'Record positive income to calculate' : 'Net contributions ÷ recorded income · all categories'}</small></div>
      <div><span>Recorded activity</span><strong>{entries.length} <small>entries</small></strong><small>{new Set(entries.map(e => e.date)).size} days with activity · {currency} only</small></div>
    </section>
    <div className="dashboard-charts">
      <section className="panel trend-panel" aria-labelledby="trend-heading">
        <div className="panel-head"><div><h2 id="trend-heading">Income & spending</h2><p>{filter.year === 'all' ? 'Select a year to see the monthly trend.' : `${filter.year} · select a month to explore · ${currency}`}</p></div></div>
        {rows.length > 0 && <>
          <div className="trend-legend"><span><i style={{ background: '#285943' }}/>Income</span><span><i style={{ background: '#cf975a' }}/>Expenses</span></div>
          <div className="trend-readout" aria-live="polite">{selected ? <><strong>{selected.month}</strong><span>Income {money(selected.income, currency)}</span><span>Expenses {money(selected.expense, currency)}</span></> : <span>Focus or hover over a month for exact amounts.</span>}</div>
          <div className="trend-scale"><span>{money(peak === 1 ? 0 : peak, currency)}</span><span>0</span></div>
          <div className="trend-chart">{rows.map((row, i) => <button key={row.month} className={`trend-month ${filter.month === String(i + 1).padStart(2, '0') ? 'selected' : ''}`} aria-label={`${row.month}: income ${money(row.income, currency)}, expenses ${money(row.expense, currency)}. Show this month.`} onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)} onFocus={() => setActive(i)} onBlur={() => setActive(null)} onClick={() => selectMonth(String(i + 1).padStart(2, '0'))}><span className="trend-bars" aria-hidden="true"><i style={{ height: `${row.income / peak * 100}%`, background: '#285943' }}/><i style={{ height: `${row.expense / peak * 100}%`, background: '#cf975a' }}/></span><span>{row.month}</span></button>)}</div>
          <p className="comparison-note">Full selected year, including months without entries. The current month may be incomplete. All categories · {currency} only. Entry-list filters do not change this chart.</p>
          <details className="chart-data"><summary>View chart data</summary><div className="table-wrap"><table><thead><tr><th>Month</th><th>Income</th><th>Expenses</th><th>Cash flow</th></tr></thead><tbody>{rows.map(row => <tr key={row.month}><td>{row.month}</td><td>{money(row.income, currency)}</td><td>{money(row.expense, currency)}</td><td>{money(row.income - row.expense, currency)}</td></tr>)}</tbody></table></div></details>
        </>}
      </section>
      <section className="panel spending-panel" aria-labelledby="spending-heading"><div className="panel-head"><div><h2 id="spending-heading">Where your spending goes</h2><p>All categories · {currency} only · selected period</p></div></div><label className="spending-view-control">Break down by<select aria-label="Spending breakdown" value={view} onChange={e=>setSpendingView(e.target.value as 'category'|'subcategory')}><option value="category">Categories</option><option value="subcategory">Subcategories</option></select></label>
        {spending.length ? <><div className="spending-ring" role="img" aria-label={`Total expenses ${money(sum.expense, currency)}`} style={{ background: `conic-gradient(${gradient})` }}><div><span>Total expenses</span><strong>{money(sum.expense, currency)}</strong></div></div><ul className="spending-list">{spending.map((r,i)=><li key={r.key}><i style={{background:colors[i%colors.length]}}/><div><strong>{r.name}</strong><span>{r.parent?r.parent+' · ':''}{(r.amount/sum.expense*100).toFixed(1)}% of expenses{r.archived?' · archived':''}</span></div><b>{money(r.amount,currency)}</b></li>)}</ul></> : <div className="comparison-empty"><p>No expenses in this view. Add an expense or change the period to see your spending breakdown.</p></div>}
        <p className="comparison-note">Switch to Subcategories to see detailed spending without reorganizing past records. Entries without a subcategory stay labelled. Savings and investment contributions are shown separately from spending. Entry-list filters do not change these totals.</p>
      </section>
    </div>
  </>;
}
