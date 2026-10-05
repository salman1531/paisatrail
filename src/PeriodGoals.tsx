import AmountWords from './AmountWords';
import { planningSplits, suggestBudget, percentOfIncome, type PlanningSplit } from './budgetSuggestions';
import { useState, type FormEvent, type ReactNode } from 'react';
import { inputAmount, money, parseAmount, today } from './finance';
import { elapsedPeriod, goalPeriod, periodGoalRows } from './goals';
import { kinds, type Filter, type Ledger, type PeriodGoal } from './types';

export function GoalsOverview({ ledger, filter, edit }: { ledger: Ledger; filter: Filter; edit: () => void }) {
  const period = filter.month === 'all' ? null : goalPeriod(filter);
  const rows = period ? periodGoalRows(ledger, filter) : [];
  const currency = ledger.profile.currency;
  const elapsed = period ? elapsedPeriod(ledger, period) : 0;
  return <section className="panel goals-panel" aria-labelledby="period-goals-heading"><div className="panel-head"><div><h2 id="period-goals-heading">This month vs your goals</h2><p>{period ? `${period} · All categories · ${currency}` : 'Select a month to check your goals.'}</p></div><button className="button secondary" onClick={edit}>Edit goals</button></div>
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

export function GoalsEditor({ ledger, busy, save, initialPeriod, children }: { ledger: Ledger; busy: boolean; initialPeriod?: string; save: (period: string, goals: PeriodGoal[]) => Promise<void>; children?: ReactNode }) {
  const currentMonth = today(ledger.profile.timezone).slice(0,7);
  const [period, setPeriod] = useState(initialPeriod?.length === 7 ? initialPeriod : initialPeriod?.length === 4 ? `${initialPeriod}-${currentMonth.slice(5)}` : currentMonth);
  const [percentageMode,setPercentageMode]=useState(false);
  const [percentages,setPercentages]=useState<Record<string,string>>({});
  const [planningSplit,setPlanningSplit] = useState<PlanningSplit>('cushion');
  const [pendingPeriod, setPendingPeriod] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string,string>>({});
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const months = Array.from({length:12}, (_, i) => new Date(2000,i,1).toLocaleString('en', {month:'long'}));
  const currency = ledger.profile.currency;
  const stored = (ledger.goals ?? []).filter(g => g.period === period && g.currency === currency);
  const defaults = {income:ledger.profile.income_target,expense:ledger.profile.spending_target,saving:ledger.profile.saving_target,investment:ledger.profile.investment_target};
  function savedValue(key: string) {
    const goal = stored.find(g => (g.category_id ?? g.kind) === key);
    if (goal) return inputAmount(goal.target_minor,currency);
    const fallback = defaults[key as keyof typeof defaults];
    return fallback > 0 ? inputAmount(fallback,currency) : '';
  }
  const rawValueFor = (key: string) => dirty ? values[key] ?? '' : savedValue(key);
  const percentKinds=['expense','saving','investment'];
  function valueFor(key: string): string {
    if(!percentageMode || !percentKinds.includes(key))return rawValueFor(key);
    try {return inputAmount(percentOfIncome(parseAmount(rawValueFor('income').trim()||'0',currency,true),percentages[key]||'0'),currency);}catch{return '';}
  }
  function changeGoalMode(usePercent: boolean) {
    if(usePercent===percentageMode)return;
    if(usePercent){
      let earnings=0;try{earnings=parseAmount(valueFor('income').trim()||'0',currency,true);}catch{/* preview waits for valid earnings */}
      setPercentages(Object.fromEntries(percentKinds.map(key=>{let amount=0;try{amount=parseAmount(valueFor(key).trim()||'0',currency,true);}catch{/* keep invalid amount in amount mode */}return [key,earnings>0?(amount/earnings*100).toFixed(2):'0'];})));
    }else{
      const keys=[...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)];
      setValues(Object.fromEntries(keys.map(key=>[key,valueFor(key)])));setDirty(true);
    }
    setPercentageMode(usePercent);setSuccess('');
  }
  function updatePercentage(key:string,value:string){
    if(!dirty){const keys=[...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)];setValues(Object.fromEntries(keys.map(k=>[k,savedValue(k)])));}
    setPercentages({...percentages,[key]:value});setDirty(true);setSuccess('');
  }
  function update(key: string, value: string) {
    const keys = [...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)];
    setValues({...(!dirty ? Object.fromEntries(keys.map(k=>[k,savedValue(k)])) : values),[key]:value}); setDirty(true); setSuccess('');
  }
  function selectPeriod(value: string) { setPeriod(value); setDirty(false); setValues({}); setError(''); setSuccess(''); setPendingPeriod(null); setPercentageMode(false); setPercentages({}); }
  function changePeriod(value: string) { if (value === period) return; if (dirty) { setPendingPeriod(value); return; } selectPeriod(value); }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy) return; setError(''); setSuccess('');
    try {
      if (!/^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Choose a valid month between 1900 and 2100.');
      if(percentageMode){ const earnings=parseAmount(rawValueFor('income').trim()||'0',currency,true); for(const kind of percentKinds){const amount=percentOfIncome(earnings,percentages[kind]||'0');if(earnings===0 && Number(percentages[kind])>0)throw new Error('Enter positive earnings before setting percentage goals.');if(amount>1_000_000_000_000)throw new Error('This goal exceeds the supported amount.');} }
      const fields = [...kinds.map(kind=>({key:kind,kind,category_id:null as string|null})),...ledger.categories.filter(c=>c.kind==='expense').map(c=>({key:c.id,kind:c.kind,category_id:c.id}))];
      // Save explicit overall values so clearing a field cannot silently restore an old default.
      const goals = fields.filter(f=>f.category_id===null || valueFor(f.key).trim()!=='').map(f=>({id:crypto.randomUUID(),user_id:ledger.profile.user_id,period,currency,kind:f.kind,category_id:f.category_id,target_minor:parseAmount(valueFor(f.key).trim() || '0',currency,true)}));
      await save(period,goals); setDirty(false); setPendingPeriod(null); setSuccess('Goals saved for '+period+'.');
    } catch(e) { setError((e as Error).message); }
  }
  const target = (key:string) => { try { return parseAmount(valueFor(key).trim() || '0',currency,true); } catch { return 0; } };
  const income=target('income');
  const suggested=suggestBudget(income,planningSplit);
  function applySuggestion() {
    if(!suggested)return;
    const keys=[...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)];
    setValues({...Object.fromEntries(keys.map(k=>[k,valueFor(k)])),...Object.fromEntries(Object.entries(suggested).map(([k,v])=>[k,inputAmount(v,currency)]))});
    setDirty(true);setSuccess('');setPercentageMode(false);
  }
  const allocated=target('expense')+target('saving')+target('investment');
  const categoryTotal=ledger.categories.filter(c=>c.kind==='expense').reduce((sum,c)=>sum+target(c.id),0);
  const inherited = kinds.some(kind=>!stored.some(g=>g.kind===kind&&g.category_id===null)&&defaults[kind]>0);
  return <section className="panel period-goals-editor"><div className="panel-head"><div><h2>Monthly goals</h2><p>Choose a month and plan your money in {currency}.</p></div></div><form className="stack-form" onSubmit={submit}>
    <label>Goal month<input type="month" min="1900-01" max="2100-12" required disabled={busy} value={period} onChange={e=>changePeriod(e.target.value)}/></label>
    <div className="month-goal-picker" role="group" aria-label="Choose a month for goals">{months.map((name,index)=>{const monthPeriod=`${period.slice(0,4)}-${String(index+1).padStart(2,'0')}`;const saved=(ledger.goals??[]).some(g=>g.period===monthPeriod&&g.currency===currency);return <button key={name} type="button" className={period===monthPeriod?'month-goal selected':'month-goal'} aria-pressed={period===monthPeriod} aria-label={`${name} ${period.slice(0,4)}${saved?', saved goals':''}`} disabled={busy || period.length!==7} onClick={()=>changePeriod(monthPeriod)}><strong>{name.slice(0,3)}</strong><span>{saved?'Saved goals':'Not saved'}</span></button>;})}</div>
    {pendingPeriod && <div className="unsaved-goals" role="alert"><p>You have unsaved changes for {period}. Save them before switching, or discard them to open {pendingPeriod}.</p><div><button type="button" className="button secondary" onClick={()=>setPendingPeriod(null)}>Keep editing</button><button type="button" className="button secondary" onClick={()=>selectPeriod(pendingPeriod)}>Discard and switch</button></div></div>}
    <h3>{months[Number(period.slice(5,7))-1] ?? 'Selected month'} {period.slice(0,4)} goals</h3>
    <p className="small muted">Saving updates this month only. Blank amounts are saved as 0.</p>
    {inherited && <p className="small muted">Starting amounts come from your earlier monthly plan. Save to make this month's goals independent.</p>}
    <fieldset className="goal-entry-mode"><legend>Enter goals as</legend><label><input type="radio" name="goal-entry-mode" checked={!percentageMode} disabled={busy} onChange={()=>changeGoalMode(false)}/>Amounts</label><label><input type="radio" name="goal-entry-mode" checked={percentageMode} disabled={busy} onChange={()=>changeGoalMode(true)}/>Percentages of earnings</label></fieldset>
    {percentageMode && <p className="small muted">Earnings stays an amount. Other goals use a percentage of that month’s take-home earnings target. Saving stores the calculated amounts for this month; it does not create an ongoing percentage rule.</p>}
    <div className="form-grid">{(['income','expense','saving','investment'] as const).map(kind=>{const percent=percentageMode&&kind!=='income';return <div className="amount-field" key={kind}><label>{kind==='income'?'Earnings target':kind==='expense'?'Expense limit':kind==='saving'?'Savings target':'Investment target'}{percent&&<span className="sr-only"> percentage</span>}<input inputMode="decimal" placeholder={percent?'0':'0.00'} disabled={busy} value={percent?percentages[kind]??'0':valueFor(kind)} onChange={e=>percent?updatePercentage(kind,e.target.value):update(kind,e.target.value)}/></label>{percent&&<span className="percentage-preview">% of earnings · {valueFor(kind)?money(target(kind),currency):'Enter a valid percentage (0–100)'}</span>}<AmountWords value={valueFor(kind)} currency={currency}/></div>;})}</div>
    <section className="budget-suggestion" aria-labelledby="suggestion-heading"><h3 id="suggestion-heading">Plan from your earnings</h3><p className="small muted">Use your monthly take-home earnings target. These examples are starting points; adjust for bills, debt, emergencies and your own priorities.</p><label>Planning example<select value={planningSplit} disabled={busy} onChange={e=>setPlanningSplit(e.target.value as PlanningSplit)}>{Object.entries(planningSplits).map(([key,plan])=><option key={key} value={key}>{plan.label} · {plan.expense}/{plan.saving}/{plan.investment}</option>)}</select></label>{suggested ? <><div className="suggestion-grid">{(['expense','saving','investment'] as const).map(kind=><div key={kind}><span>{kind==='expense'?'Spending limit':kind==='saving'?'Cash savings':'Investments'} · {planningSplits[planningSplit][kind]}%</span><strong>{money(suggested[kind],currency)}</strong><small>Your plan: {money(target(kind),currency)} · {(target(kind)/income*100).toFixed(1)}% of earnings</small></div>)}</div><button type="button" className="button secondary" disabled={busy} onClick={applySuggestion}>Use this split in my draft</button><p className="small muted">Save monthly goals to keep these changes. Category limits stay as entered.</p></> : <p className="small muted">Enter a positive earnings target to see suggested amounts.</p>}<p className="small muted">The <a href="https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/analyzing-budgets/" target="_blank" rel="noopener noreferrer">50/30/20 budgeting guideline</a> sets aside 20% for financial goals. Our savings/investment splits are optional examples, not a personalised investment recommendation. Cash savings can come first while building an emergency cushion.</p></section>
    <details className="category-budget-editor"><summary>Category spending limits (optional)</summary><p className="small muted">These limits are included in your overall expense limit.</p>{ledger.categories.filter(c=>c.kind==='expense' && (!c.archived || stored.some(g=>g.category_id===c.id))).map(c=><div className="amount-field" key={c.id}><label>{c.name}{c.archived?' · archived':''}<input inputMode="decimal" placeholder="No category limit" disabled={busy} value={valueFor(c.id)} onChange={e=>update(c.id,e.target.value)}/></label><AmountWords value={valueFor(c.id)} currency={currency}/></div>)}</details>
    <p className={allocated>income?'form-error':'small muted'}>{allocated>income ? `Your goals exceed your earnings target by ${money(allocated-income,currency)}. You can save this plan, but it has a funding gap.` : `${money(income-allocated,currency)} left after planned spending, savings and investments.`}</p>
    {categoryTotal>target('expense') && <p className="form-error">Category limits exceed your overall expense limit by {money(categoryTotal-target('expense'),currency)}.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="goal-status favorable" role="status">{success}</p>}<button className="button" disabled={busy}>{busy?'Saving…':'Save monthly goals'}</button>
  </form>{children}</section>;
}
