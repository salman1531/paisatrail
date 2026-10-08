import {money,precision} from './finance';
import type {BudgetRow} from './budgetReport';
import type {Currency,Kind} from './types';
export default function PlanComparisonChart({rows,currency,select}:{rows:BudgetRow[];currency:Currency;select:(kind:Kind)=>void}){
 const max=Math.max(1,...rows.flatMap(r=>[r.target??0,r.actual])),min=Math.min(0,...rows.map(r=>r.actual));
 const top=24,bottom=228,height=bottom-top;const y=(value:number)=>bottom-(value-min)/(max-min)*height,zero=y(0);
 const compact=(value:number)=>new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(value/10**precision(currency));
 return <svg viewBox="0 0 360 300" className="plan-comparison-chart" role="group" aria-label={`Planned and actual amounts in ${currency}`}>
 <text x="48" y="14" className="chart-axis-currency">{currency}</text>{Array.from({length:5},(_,i)=>{const amount=min+(max-min)*i/4;return <g key={i}><line x1="48" x2="352" y1={y(amount)} y2={y(amount)} className="chart-grid-line"/><text x="40" y={y(amount)+4} textAnchor="end" className="chart-axis-label">{compact(amount)}</text></g>;})}<line x1="48" x2="352" y1={zero} y2={zero} className="chart-zero-line"/>
 {rows.map((row,i)=>{const center=94+i*106;return <g key={row.id} role="button" tabIndex={0} aria-label={`${row.name}: planned ${row.target===null?'not set':money(row.target,currency)}, actual ${money(row.actual,currency)}. Show category detail`} onClick={()=>select(row.kind)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(row.kind);}}}>{row.target!==null&&<rect x={center-29} y={Math.min(zero,y(row.target))} width="24" height={Math.max(2,Math.abs(zero-y(row.target)))} fill="#d9e4d2" rx="3"/>}<rect x={center+5} y={Math.min(zero,y(row.actual))} width="24" height={Math.max(2,Math.abs(zero-y(row.actual)))} fill="#4b795e" rx="3"/><text x={center} y="254" textAnchor="middle" className="chart-category-label">{row.name}</text>{row.target===null&&<text x={center} y="274" textAnchor="middle" className="chart-axis-label">Plan not set</text>}<title>{row.name}: plan {row.target===null?'not set':money(row.target,currency)}, actual {money(row.actual,currency)}</title></g>;})}</svg>;
}
