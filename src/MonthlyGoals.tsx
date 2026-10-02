import { PiggyBank, Wallet } from 'lucide-react';
import { money, monthlyGoals } from './finance';
import type { Filter, Ledger } from './types';

export default function MonthlyGoals({ ledger, filter, edit }: { ledger: Ledger; filter: Filter; edit: () => void }) {
  const goals = monthlyGoals(ledger, filter);
  const currency = ledger.profile.currency;
  const period = goals ? new Date(Number(filter.year), Number(filter.month) - 1, 1).toLocaleString('en', { month: 'long', year: 'numeric' }) : '';
  return <section className="panel goals-panel" aria-labelledby="monthly-goals-heading"><div className="panel-head"><div><h2 id="monthly-goals-heading">This month vs your plan</h2><p>{goals ? `${period} · All categories · ${currency}` : 'Select a year and month to check your goals.'}</p></div><button className="button secondary" onClick={edit}>Edit goals</button></div>
    {goals && <><div className="monthly-goals-grid">{(['expense', 'saving'] as const).map(kind => {
      const { actual, target } = goals[kind]; const isExpense = kind === 'expense'; const Icon = isExpense ? Wallet : PiggyBank;
      const percent = target > 0 ? actual / target * 100 : null;
      const difference = actual - target;
      const status = target <= 0 ? 'No target set' : isExpense ? difference > 0 ? `Over limit by ${money(difference, currency)}` : difference === 0 ? 'At your spending limit' : `${money(-difference, currency)} left to spend` : difference >= 0 ? difference === 0 ? 'Savings goal reached' : `${money(difference, currency)} above your goal` : `${money(-difference, currency)} to your savings goal`;
      const tone = target <= 0 ? 'neutral' : isExpense && difference > 0 ? 'unfavorable' : !isExpense && difference < 0 ? 'neutral' : 'favorable';
      return <div className="monthly-goal" key={kind} role="group" aria-label={isExpense ? 'Expense goal comparison' : 'Savings goal comparison'}><div className="goal-label"><span><Icon size={18}/>{isExpense ? 'Expense limit' : 'Savings goal'}</span><span className={tone}>{percent === null ? '—' : `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(percent)}%`}</span></div><div className="goal-amount"><strong>{money(actual, currency)}</strong><span>{target > 0 ? `of ${money(target, currency)} planned` : 'Set a monthly target'}</span></div><div className={`goal-progress ${tone}`} role="progressbar" aria-label={isExpense ? 'Expense limit used' : 'Savings goal progress'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.max(0, Math.min(100, percent ?? 0))} aria-valuetext={`${money(actual, currency)} actual, ${money(target, currency)} target. ${status}`}><span style={{ width: `${Math.max(0, Math.min(100, percent ?? 0))}%` }}/></div><p className={`goal-status ${tone}`}>{status}</p></div>;
    })}</div><p className="comparison-note">Uses your current monthly targets. Savings include emergency contributions and are net of withdrawals.</p></>}
  </section>;
}
