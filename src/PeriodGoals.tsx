import { useState, type FormEvent } from 'react';
import { inputAmount, money, parseAmount, today } from './finance';
import { elapsedPeriod, goalPeriod, monthlyGoalSum, periodGoalRows } from './goals';
import { kinds, type Filter, type Ledger, type PeriodGoal } from './types';

export function GoalsOverview({ ledger, filter, edit }: { ledger: Ledger; filter: Filter; edit: () => void }) {
  const period = goalPeriod(filter);
  const rows = periodGoalRows(ledger, filter);
  const currency = ledger.profile.currency;
  const elapsed = period ? elapsedPeriod(ledger, period) : 0;
  return <section className="panel goals-panel" aria-labelledby="period-goals-heading"><div className="panel-head"><div><h2 id="period-goals-heading">{period?.length === 4 ? 'This year vs your goals' : 'This month vs your plan'}</h2><p>{period ? `${period} · All categories · ${currency}` : 'Select a year or month to check your goals.'}</p></div><button className="button secondary" onClick={edit}>Edit goals</button></div>
    {period && <><div className="monthly-goals-grid">{rows.map(row => {
      const expense = row.kind === 'expense';
      const percent = row.target !== null && row.target > 0 ? row.actual / row.target * 100 : null;
      const difference = row.actual - (row.target ?? 0);
      const status = row.target === null ? 'No target set' : expense ? difference > 0 ? `Over limit by ${money(difference,currency)}` : difference === 0 ? 'At your spending limit' : `${money(-difference,currency)} left to spend` : difference > 0 ? `${money(difference,currency)} above your goal` : difference === 0 ? `${row.kind === 'saving' ? 'Savings' : row.kind === 'income' ? 'Earnings' : 'Investment'} goal reached` : `${money(-difference,currency)} to your ${row.kind === 'saving' ? 'savings' : row.kind === 'income' ? 'earnings' : 'investment'} goal`;
      const tone = expense && row.target !== null && difference > 0 ? 'unfavorable' : row.target === null ? 'neutral' : 'favorable';
      return <div className="monthly-goal" key={row.key} role="group" aria-label={`${row.category_id ? row.label : row.kind === 'expense' ? 'Expense' : row.kind === 'saving' ? 'Savings' : row.kind === 'income' ? 'Earnings' : 'Investment'} goal comparison`}><div className="goal-label"><span>{row.label}</span><span className={tone}>{percent === null ? '—' : `${percent.toFixed(1)}%`}</span></div><div className="goal-amount"><strong>{money(row.actual,currency)}</strong><span>{row.target === null ? 'Set a target' : `of ${money(row.target,currency)} planned`}</span></div><div className={`goal-progress ${tone}`} role="progressbar" aria-label={`${row.label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0,Math.min(100,percent ?? 0))} aria-valuetext={status}><span style={{width:`${Math.max(0,Math.min(100,percent ?? 0))}%`}}/></div><p className={`goal-status ${tone}`}>{status}</p><p className="comparison-note">{row.source}{percent !== null && elapsed > 0 && elapsed < 1 ? ` · ${(elapsed*100).toFixed(0)}% of period elapsed` : ''}</p></div>;
    })}</div><p className="comparison-note">Savings and investments are net contributions, including withdrawals. Emergency savings are included once. Category limits are part of your overall expense limit, not additional spending allowances. Progress uses recorded activity; it is not a forecast.</p></>}
  </section>;
}

export function GoalsEditor({ ledger, busy, save, initialPeriod }: { ledger: Ledger; busy: boolean; initialPeriod?: string; save: (period: string, goals: PeriodGoal[]) => Promise<void> }) {
  const [period, setPeriod] = useState(initialPeriod ?? today(ledger.profile.timezone).slice(0,7));
  const [annual, setAnnual] = useState(initialPeriod?.length === 4);
  const [values, setValues] = useState<Record<string,string>>({});
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currency = ledger.profile.currency;
  const stored = (ledger.goals ?? []).filter(g => g.period === period && g.currency === currency);
  const valueFor = (key: string) => dirty ? values[key] ?? '' : stored.find(g => (g.category_id ?? g.kind) === key) ? inputAmount(stored.find(g => (g.category_id ?? g.kind) === key)!.target_minor,currency) : '';
  function update(key: string, value: string) { const initial = Object.fromEntries(stored.map(g=>[g.category_id ?? g.kind,inputAmount(g.target_minor,currency)])); setValues({...(!dirty ? initial : values),[key]:value}); setDirty(true); setSuccess(''); }
  function changePeriod(value: string) { setPeriod(value); setDirty(false); setError(''); setSuccess(''); }
  async function submit(e: FormEvent) {
    e.preventDefault(); setError(''); setSuccess('');
    try {
      if (!/^(19\d{2}|20\d{2}|2100)(-(0[1-9]|1[0-2]))?$/.test(period)) throw new Error('Choose a valid year or month between 1900 and 2100.');
      const fields = [...kinds.map(kind=>({key:kind,kind,category_id:null as string|null})),...ledger.categories.filter(c=>c.kind==='expense').map(c=>({key:c.id,kind:c.kind,category_id:c.id}))];
      const goals = fields.filter(f=>valueFor(f.key).trim()!=='').map(f=>({id:crypto.randomUUID(),user_id:ledger.profile.user_id,period,currency,kind:f.kind,category_id:f.category_id,target_minor:parseAmount(valueFor(f.key),currency,true)}));
      await save(period,goals); setDirty(false); setSuccess('Goals saved for '+period+'.');
    } catch(e) { setError((e as Error).message); }
  }
  const target = (kind:string) => { try { const v=valueFor(kind); return v.trim() ? parseAmount(v,currency,true) : null; } catch { return null; } };
  const effective = (kind: 'income'|'expense'|'saving'|'investment') => target(kind) ?? (!annual ? ledger.profile[({income:'income_target',expense:'spending_target',saving:'saving_target',investment:'investment_target'} as const)[kind]] : null);
  const income=effective('income');
  const allocated=(effective('expense')??0)+(effective('saving')??0)+(effective('investment')??0);
  const categoryTotal=ledger.categories.filter(c=>c.kind==='expense').reduce((sum,c)=>sum+(target(c.id)??0),0);
  const expense=effective('expense');
  return <section className="panel period-goals-editor"><div className="panel-head"><div><h2>Monthly & yearly goals</h2><p>Save a separate plan for each period in {currency}.</p></div></div><form className="stack-form" onSubmit={submit}>
    <div className="form-grid"><label>Goal period<select value={annual?'year':'month'} disabled={busy} onChange={e=>{const next=e.target.value==='year';setAnnual(next);changePeriod(next?period.slice(0,4):period+'-01');}}><option value="month">Monthly</option><option value="year">Yearly</option></select></label><label>{annual?'Goal year':'Goal month'}<input type={annual?'number':'month'} min={annual?'1900':'1900-01'} max={annual?'2100':'2100-12'} required disabled={busy} value={period} onChange={e=>changePeriod(e.target.value)}/></label></div>
    <p className="small muted">Blank fields remove a period override. Monthly goals then use your default plan; yearly goals stay unset. Enter 0 for an explicit zero goal. Saved goals keep their original currency.</p>
    {kinds.map(kind=><label key={kind}>{kind==='income'?'Earnings target':kind==='expense'?'Expense limit':kind==='saving'?'Savings target':'Investment target'}<input inputMode="decimal" placeholder="No period override" disabled={busy} value={valueFor(kind)} onChange={e=>update(kind,e.target.value)}/></label>)}
    {annual && <button type="button" className="button secondary" disabled={busy} onClick={()=>{try{const initial=Object.fromEntries(stored.map(g=>[g.category_id??g.kind,inputAmount(g.target_minor,currency)]));setValues({...(!dirty?initial:values),...Object.fromEntries(kinds.map(kind=>[kind,inputAmount(monthlyGoalSum(ledger,period,kind),currency)]))});setDirty(true);setSuccess('');}catch(e){setError((e as Error).message);}}}>Use sum of monthly targets</button>}
    {annual && <p className="small muted">The monthly sum includes saved monthly overrides and defaults for other months. It fills this form; future monthly changes do not alter a saved yearly goal.</p>}
    <details className="category-budget-editor"><summary>Category expense budgets</summary><p className="small muted">Optional limits within your overall expense limit.</p>{ledger.categories.filter(c=>c.kind==='expense' && (!c.archived || stored.some(g=>g.category_id===c.id))).map(c=><label key={c.id}>{c.name}{c.archived?' · archived':''}<input inputMode="decimal" placeholder="No category limit" disabled={busy} value={valueFor(c.id)} onChange={e=>update(c.id,e.target.value)}/></label>)}</details>
    {income!==null && allocated>income && <p className="form-error">Your goals exceed your earnings target by {money(allocated-income,currency)}. You can save this plan, but it has a funding gap.</p>}
    {expense!==null && categoryTotal>expense && <p className="form-error">Category limits exceed your overall expense limit by {money(categoryTotal-expense,currency)}.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="goal-status favorable" role="status">{success}</p>}<button className="button" disabled={busy}>{busy?'Saving…':'Save period goals'}</button>
  </form></section>;
}
