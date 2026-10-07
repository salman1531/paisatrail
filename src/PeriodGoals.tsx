import AmountWords from './AmountWords';
import Modal from './Modal';
import { planningSplits, suggestBudget, customBudget, percentOfIncome, type PlanningSplit } from './budgetSuggestions';
import { useState, useRef, useEffect, type FormEvent, type ReactNode } from 'react';
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

export function GoalsEditor({ ledger, busy, save, initialPeriod, children, onDirtyChange, onPeriodChange }: { ledger: Ledger; busy: boolean; initialPeriod?: string; save: (period: string, goals: PeriodGoal[]) => Promise<void>; children?: ReactNode; onDirtyChange?: (dirty:boolean)=>void; onPeriodChange?:(period:string)=>void }) {
  const currentMonth = today(ledger.profile.timezone).slice(0,7);
  const [period, setPeriod] = useState(initialPeriod?.length === 7 ? initialPeriod : initialPeriod?.length === 4 ? `${initialPeriod}-${currentMonth.slice(5)}` : currentMonth);
  const [percentageMode,setPercentageMode]=useState(false);
  const [percentages,setPercentages]=useState<Record<string,string>>({});
  const [planningSplit,setPlanningSplit] = useState<PlanningSplit | 'custom'>('cushion');
  const [customSplit,setCustomSplit] = useState({expense:'70',saving:'20',investment:'10'});
  const [planningDirty,setPlanningDirty] = useState(false);
  const [pendingPlan,setPendingPlan] = useState<{period:string;goals:PeriodGoal[];label:string}|null>(null);
  const [planError,setPlanError] = useState('');
  const [savingPlan,setSavingPlan] = useState(false);
  const savingRef=useRef(false);
  const [pendingPeriod, setPendingPeriod] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string,string>>({});
  const [dirty, setDirty] = useState(false);
  useEffect(()=>{onDirtyChange?.(dirty || planningDirty);},[dirty,planningDirty,onDirtyChange]);
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
    setPercentageMode(usePercent);setPlanningDirty(true);setSuccess('');
  }
  function updatePercentage(key:string,value:string){
    if(!dirty){const keys=[...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)];setValues(Object.fromEntries(keys.map(k=>[k,savedValue(k)])));}
    setPercentages({...percentages,[key]:value});setDirty(true);setSuccess('');
  }
  function update(key: string, value: string) {
    const keys = [...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)];
    setValues({...(!dirty ? Object.fromEntries(keys.map(k=>[k,savedValue(k)])) : values),[key]:value}); setDirty(true); setSuccess('');
  }
  function selectPeriod(value: string) { setPeriod(value); onPeriodChange?.(value); setDirty(false); setValues({}); setError(''); setSuccess(''); setPendingPeriod(null); setPercentageMode(false); setPercentages({}); setPlanningDirty(false); setPendingPlan(null); setPlanError(''); }
  function changePeriod(value: string) { if (value === period) return; if (dirty || planningDirty) { setPendingPeriod(value); return; } selectPeriod(value); }
  function prepareGoals(replacements?: Record<'expense'|'saving'|'investment',number>) {
    if (!/^(19\d{2}|20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Choose a valid month between 1900 and 2100.');
    if(percentageMode && !replacements){ const earnings=parseAmount(rawValueFor('income').trim()||'0',currency,true); for(const kind of percentKinds){const amount=percentOfIncome(earnings,percentages[kind]||'0');if(earnings===0 && Number(percentages[kind])>0)throw new Error('Enter positive earnings before setting percentage goals.');if(amount>1_000_000_000_000)throw new Error('This goal exceeds the supported amount.');} }
    const fields = [...kinds.map(kind=>({key:kind,kind,category_id:null as string|null})),...ledger.categories.filter(c=>c.kind==='expense').map(c=>({key:c.id,kind:c.kind,category_id:c.id}))];
    // Keep category limits and income edits while replacing only the three planned outgoings.
    return fields.filter(f=>f.category_id===null || valueFor(f.key).trim()!=='').map(f=>({id:crypto.randomUUID(),user_id:ledger.profile.user_id,period,currency,kind:f.kind,category_id:f.category_id,target_minor:replacements && f.category_id===null && f.kind!=='income' ? replacements[f.kind] : parseAmount(valueFor(f.key).trim() || '0',currency,true)}));
  }
  async function persistGoals(selectedPeriod:string,goals:PeriodGoal[]) {
    if(busy || savingRef.current)return false;
    savingRef.current=true;
    try {
      await save(selectedPeriod,goals); setDirty(false); setPlanningDirty(false); setPendingPeriod(null); setSuccess('Goals saved for '+selectedPeriod+'.');return true;
    } finally {savingRef.current=false;}
  }
  async function submit(e: FormEvent) {
    e.preventDefault(); if (busy || savingRef.current) return; setError(''); setSuccess('');
    try {await persistGoals(period,prepareGoals());} catch(e) { setError((e as Error).message); }
  }
  const target = (key:string) => { try { return parseAmount(valueFor(key).trim() || '0',currency,true); } catch { return 0; } };
  const income=target('income');
  let suggestionError='';
  let suggested: ReturnType<typeof suggestBudget>=null;
  try {suggested=planningSplit==='custom' ? customBudget(income,customSplit) : suggestBudget(income,planningSplit);}catch(e){suggestionError=(e as Error).message;}
  const monthLabel=`${months[Number(period.slice(5,7))-1] ?? 'Selected month'} ${period.slice(0,4)}`;
  const planLabel=planningSplit==='custom' ? 'Your custom split' : planningSplits[planningSplit].label;
  const rates=planningSplit==='custom' ? customSplit : planningSplits[planningSplit];
  function reviewPlan() {
    if(!suggested || busy)return;
    setError('');setPlanError('');setSuccess('');
    try {setPendingPlan({period,goals:prepareGoals(suggested),label:planLabel});}catch(e){setError((e as Error).message);}
  }
  async function confirmPlan() {
    if(!pendingPlan || busy || savingRef.current)return;
    setPlanError('');setSavingPlan(true);
    try {if(await persistGoals(pendingPlan.period,pendingPlan.goals)){setPercentageMode(false);setPercentages({});setPendingPlan(null);}}
    catch(e){setPlanError((e as Error).message);}
    finally{setSavingPlan(false);}
  }
  const allocated=target('expense')+target('saving')+target('investment');
  const categoryTotal=ledger.categories.filter(c=>c.kind==='expense').reduce((sum,c)=>sum+target(c.id),0);
  const inherited = kinds.some(kind=>!stored.some(g=>g.kind===kind&&g.category_id===null)&&defaults[kind]>0);
  return <section className="panel period-goals-editor"><div className="panel-head"><div><h2>Monthly goals</h2><p>Choose a month and plan your money in {currency}.</p></div></div><form className="stack-form" onSubmit={submit}>
    <label>Goal month<input type="month" min="1900-01" max="2100-12" required disabled={busy} value={period} onChange={e=>changePeriod(e.target.value)}/></label>
    <div className="month-goal-picker" role="group" aria-label="Choose a month for goals">{months.map((name,index)=>{const monthPeriod=`${period.slice(0,4)}-${String(index+1).padStart(2,'0')}`;const saved=(ledger.goals??[]).some(g=>g.period===monthPeriod&&g.currency===currency);return <button key={name} type="button" className={period===monthPeriod?'month-goal selected':'month-goal'} aria-pressed={period===monthPeriod} aria-label={`${name} ${period.slice(0,4)}${saved?', saved goals':''}`} disabled={busy || period.length!==7} onClick={()=>changePeriod(monthPeriod)}><strong>{name.slice(0,3)}</strong><span>{saved?'Saved goals':Object.values(defaults).some(v=>v>0)?'Using defaults':'No plan'}</span></button>;})}</div>
    {pendingPeriod && <div className="unsaved-goals" role="alert"><p>You have unsaved changes for {period}. Save them before switching, or discard them to open {pendingPeriod}.</p><div><button type="button" className="button secondary" onClick={()=>setPendingPeriod(null)}>Keep editing</button><button type="button" className="button secondary" onClick={()=>selectPeriod(pendingPeriod)}>Discard and switch</button></div></div>}
    <h3>{months[Number(period.slice(5,7))-1] ?? 'Selected month'} {period.slice(0,4)} goals</h3>
    <p className="small muted">Saving updates this month only. Blank amounts are saved as 0.</p>
    {inherited && <div className="default-plan-notice"><p>Using default plan for {monthLabel} · {currency}. These amounts already apply in your overview.</p><button type="button" className="button secondary" disabled={busy} onClick={()=>{setPercentageMode(false);setPercentages({});setValues(Object.fromEntries([...kinds,...ledger.categories.filter(c=>c.kind==='expense').map(c=>c.id)].map(key=>[key,savedValue(key)])));setDirty(true);}}>Customize {months[Number(period.slice(5,7))-1]}</button><button type="button" className="text-button" disabled={busy} onClick={async()=>{setError('');try{await persistGoals(period,prepareGoals());}catch(e){setError((e as Error).message);}}}>{dirty?'Save this draft for '+monthLabel:'Use defaults for '+monthLabel}</button></div>}
    <fieldset className="goal-entry-mode"><legend>Enter goals as</legend><label><input type="radio" name="goal-entry-mode" checked={!percentageMode} disabled={busy} onChange={()=>changeGoalMode(false)}/>Amounts</label><label><input type="radio" name="goal-entry-mode" checked={percentageMode} disabled={busy} onChange={()=>changeGoalMode(true)}/>Percentages of earnings</label></fieldset>
    {percentageMode && <p className="small muted">Earnings stays an amount. Other goals use a percentage of that month’s take-home earnings target. Saving stores the calculated amounts for this month; it does not create an ongoing percentage rule.</p>}
    <div className="form-grid">{(['income','expense','saving','investment'] as const).map(kind=>{const percent=percentageMode&&kind!=='income';return <div className="amount-field" key={kind}><label>{kind==='income'?'Earnings target':kind==='expense'?'Expense limit':kind==='saving'?'Savings target':'Investment target'}{percent&&<span className="sr-only"> percentage</span>}<input inputMode="decimal" placeholder={percent?'0':'0.00'} disabled={busy} value={percent?percentages[kind]??'0':valueFor(kind)} onChange={e=>percent?updatePercentage(kind,e.target.value):update(kind,e.target.value)}/></label>{percent&&<span className="percentage-preview">% of earnings · {valueFor(kind)?money(target(kind),currency):'Enter a valid percentage (0–100)'}</span>}<AmountWords value={valueFor(kind)} currency={currency}/></div>;})}</div>
    <details className="budget-suggestion"><summary>Need help splitting your earnings?</summary><section aria-labelledby="suggestion-heading"><h3 id="suggestion-heading">Plan from your earnings</h3><p className="small muted">Choose an example or create your own split. Preview the amounts, then save the plan for {monthLabel}.</p><label>Planning example<select value={planningSplit} disabled={busy} onChange={e=>{setPlanningSplit(e.target.value as PlanningSplit|'custom');setPlanningDirty(true);setSuccess('');}}>{Object.entries(planningSplits).map(([key,plan])=><option key={key} value={key}>{plan.label} · {plan.expense}/{plan.saving}/{plan.investment}</option>)}<option value="custom">Create my own split…</option></select></label>
    {planningSplit==='custom' && <fieldset className="custom-split"><legend>Your custom split</legend><div className="suggestion-grid">{(['expense','saving','investment'] as const).map(kind=><label key={kind}>{kind==='expense'?'Spending':kind==='saving'?'Cash savings':'Investments'} %<input inputMode="decimal" disabled={busy} value={customSplit[kind]} onChange={e=>{setCustomSplit({...customSplit,[kind]:e.target.value});setPlanningDirty(true);setSuccess('');}}/></label>)}</div><p className="small muted">Use up to 100% in total. A smaller split leaves some income available.</p></fieldset>}
    {suggestionError && <p className="form-error" role="alert">{suggestionError}</p>}
    {suggested ? <><div className="suggestion-grid">{(['expense','saving','investment'] as const).map(kind=><div key={kind}><span>{kind==='expense'?'Spending limit':kind==='saving'?'Cash savings':'Investments'} · {rates[kind]}%</span><strong>{money(suggested[kind],currency)}</strong><AmountWords value={inputAmount(suggested[kind],currency)} currency={currency}/><small>Current goal: {money(target(kind),currency)}</small></div>)}</div><button type="button" className="button" disabled={busy} onClick={reviewPlan}>Save plan for {monthLabel}</button><p className="small muted">You’ll confirm before this replaces the month’s expense, savings and investment goals. Your category limits stay as entered.</p></> : !suggestionError && <p className="small muted">Enter a positive earnings target to preview and save a plan.</p>}
    <p className="small muted">These examples are starting points; adjust for bills, debt, emergencies and your priorities. The <a href="https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/analyzing-budgets/" target="_blank" rel="noopener noreferrer">50/30/20 budgeting guideline</a> sets aside 20% for financial goals. These savings/investment splits are optional examples. Cash savings can come first while building an emergency cushion.</p></section></details>
    <details className="category-budget-editor"><summary>Category spending limits (optional)</summary><p className="small muted">These limits are included in your overall expense limit.</p>{ledger.categories.filter(c=>c.kind==='expense' && (!c.archived || stored.some(g=>g.category_id===c.id))).map(c=><div className="amount-field" key={c.id}><label>{c.name}{c.archived?' · archived':''}<input inputMode="decimal" placeholder="No category limit" disabled={busy} value={valueFor(c.id)} onChange={e=>update(c.id,e.target.value)}/></label><AmountWords value={valueFor(c.id)} currency={currency}/></div>)}</details>
    <p className={allocated>income?'form-error':'small muted'}>{allocated>income ? `Your goals exceed your earnings target by ${money(allocated-income,currency)}. You can save this plan, but it has a funding gap.` : `${money(income-allocated,currency)} left after planned spending, savings and investments.`}</p>
    {categoryTotal>target('expense') && <p className="form-error">Category limits exceed your overall expense limit by {money(categoryTotal-target('expense'),currency)}.</p>}
    {error && <p className="form-error" role="alert">{error}</p>}{success && <p className="goal-status favorable" role="status">{success}</p>}<button className="button" disabled={busy}>{busy?'Saving…':'Save monthly goals'}</button>
  </form>{children}{pendingPlan && <Modal title={`Set goals for ${monthLabel}?`} close={()=>{if(!busy && !savingPlan)setPendingPlan(null);}}><p>{pendingPlan.label} will set the following goals for <strong>{monthLabel}</strong> in {currency}.</p><dl className="plan-confirmation">{(['income','expense','saving','investment'] as const).map(kind=>{const amount=pendingPlan.goals.find(g=>g.category_id===null&&g.kind===kind)!.target_minor;return <div key={kind}><dt>{kind==='income'?'Earnings target':kind==='expense'?'Expense limit':kind==='saving'?'Savings target':'Investment target'}</dt><dd><strong>{money(amount,currency)}</strong><AmountWords value={inputAmount(amount,currency)} currency={currency}/></dd></div>;})}</dl><p className="small muted">Only {monthLabel} changes. Category limits will save as entered; other months and your recorded entries stay unchanged.</p>{pendingPlan.goals.filter(g=>g.category_id!==null).reduce((sum,g)=>sum+g.target_minor,0) > pendingPlan.goals.find(g=>g.kind==='expense'&&g.category_id===null)!.target_minor && <p className="form-error">Your category limits exceed this plan’s expense limit. Cancel to adjust them, or keep them and save.</p>}{planError && <p className="form-error" role="alert">{planError}</p>}<div className="modal-actions"><button type="button" className="button secondary" disabled={busy||savingPlan} onClick={()=>setPendingPlan(null)}>Cancel</button><button type="button" className="button" disabled={busy||savingPlan} onClick={confirmPlan}>{busy||savingPlan?'Saving…':'Confirm and save goals'}</button></div></Modal>}</section>;
}
