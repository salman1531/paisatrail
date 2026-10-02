import { useState } from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { categoryComparison, kindLabels, money, previousMonth, today } from './finance';
import { kinds, type Currency, type Filter, type Kind, type Ledger } from './types';

function periodLabel(year: string, month: string) { return new Date(Number(year), Number(month) - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' }); }

export default function CategoryComparison({ ledger, currency, filter }: { ledger: Ledger; currency: Currency; filter: Filter }) {
  const [kind, setKind] = useState<Kind | 'all'>('expense');
  const validPeriod = filter.year !== 'all' && filter.month !== 'all';
  const prior = validPeriod ? previousMonth(filter.year, filter.month) : null;
  const currentLabel = validPeriod ? periodLabel(filter.year, filter.month) : '';
  const previousLabel = prior ? periodLabel(prior.year, prior.month) : '';
  const rows = categoryComparison(ledger, filter, currency).filter(row => kind === 'all' || row.category.kind === kind);
  const min = Math.min(0, ...rows.flatMap(r => [r.currentMinor, r.previousMinor]));
  const max = Math.max(0, ...rows.flatMap(r => [r.currentMinor, r.previousMinor]));
  const span = max - min || 1;
  const zero = -min / span * 100;
  const inProgress = validPeriod && `${filter.year}-${filter.month}` === today(ledger.profile.timezone).slice(0, 7);
  function bar(value: number) { return { left: `${(Math.min(value, 0) - min) / span * 100}%`, width: `${Math.abs(value) / span * 100}%` }; }
  return <section className="panel comparison-panel" aria-labelledby="comparison-heading">
    <div className="panel-head"><div><h2 id="comparison-heading">Categories, month to month</h2><p>{validPeriod ? `${currentLabel} vs ${previousLabel} · ${currency}` : 'Select a year and month to compare.'}</p></div><select aria-label="Comparison type" value={kind} onChange={e => setKind(e.target.value as Kind | 'all')}><option value="all">All types</option>{kinds.map(k => <option key={k} value={k}>{kindLabels[k]}</option>)}</select></div>
    {validPeriod && <>
      <div className="comparison-legend"><span><i className="current-swatch"/>{currentLabel}</span><span><i className="previous-swatch"/>{previousLabel}</span></div>
      {rows.length > 0 ? <div className="comparison-list">{rows.map(row => {
        const direction = row.changeMinor > 0 ? 'up' : row.changeMinor < 0 ? 'down' : 'same';
        const Icon = direction === 'up' ? ArrowUp : direction === 'down' ? ArrowDown : Minus;
        const label = row.previousCount === 0 ? 'New activity' : direction === 'same' ? 'No change' : direction === 'up' ? 'Up' : 'Down';
        const favorable = row.category.kind === 'expense' ? direction === 'down' : direction === 'up';
        const tone = direction === 'same' || row.previousCount === 0 ? 'neutral' : favorable ? 'favorable' : 'unfavorable';
        const percent = row.percent === null ? null : new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(Math.abs(row.percent));
        return <div className="comparison-row" key={row.category.id} data-testid="category-comparison-row" role="group" aria-label={`${row.category.name}: ${currentLabel} ${money(row.currentMinor, currency)}, ${previousLabel} ${money(row.previousMinor, currency)}, ${label}${percent !== null ? ` ${percent} percent` : ''}`}>
          <div className="comparison-category"><strong>{row.category.name}</strong><span>{kindLabels[row.category.kind]}{row.category.archived ? ' · archived' : ''}</span></div>
          <div className="comparison-bars" aria-hidden="true"><div className="comparison-bar-line"><div className="comparison-track"><i className="zero-line" style={{ left: `${zero}%` }}/><div className="comparison-bar current-bar" style={bar(row.currentMinor)}/></div><span>{money(row.currentMinor, currency)}</span></div><div className="comparison-bar-line"><div className="comparison-track"><i className="zero-line" style={{ left: `${zero}%` }}/><div className="comparison-bar previous-bar" style={bar(row.previousMinor)}/></div><span>{money(row.previousMinor, currency)}</span></div></div>
          <div className={`comparison-change ${tone}`}><strong><Icon size={15}/>{label}{percent !== null && direction !== 'same' ? ` ${percent}%` : ''}</strong><span>{direction === 'same' ? money(0, currency) : `${row.changeMinor > 0 ? '+' : '−'}${money(Math.abs(row.changeMinor), currency)}`}{row.currentCount === 0 ? ' · no entries' : ''}</span></div>
        </div>;
      })}</div> : <div className="comparison-empty"><p>No {kind === 'all' ? '' : kindLabels[kind].toLowerCase() + ' '}entries recorded for either month.</p></div>}
      <p className="comparison-note">Based on recorded entries. Savings and investments are net of withdrawals.{inProgress ? ' The selected month is still in progress.' : ''}</p>
    </>}
  </section>;
}
