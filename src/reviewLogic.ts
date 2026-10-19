import {filtered,kindLabels} from './finance';
import {addDays,within} from './planning';
import type {Entry,Filter,Ledger,NamedGoal,PlanningPeriod} from './types';
/** One predicate keeps the visible list, export and post-save scope notice aligned. */
export function entryMatchesView(ledger:Ledger,entry:Entry,filter:Filter,search='') {
 if(!filtered([entry],filter).length)return false;
 const category=ledger.categories.find(c=>c.id===entry.category_id);
 if(!category||(filter.kind&&filter.kind!=='all'&&category.kind!==filter.kind))return false;
 const child=ledger.subcategories?.find(s=>s.id===entry.subcategory_id);
 return `${entry.notes} ${entry.payment_method??''} ${category.name} ${child?.name??''} ${kindLabels[category.kind]} ${ledger.namedGoals?.find(g=>g.id===entry.named_goal_id)?.name??''} ${ledger.expectedPayments?.find(p=>p.id===entry.expected_payment_id)?.name??''} ${ledger.incomeSources?.find(s=>s.id===entry.income_source_id)?.name??''}`.toLowerCase().includes(search.toLowerCase());
}
export function contributionState(ledger:Ledger,goal:NamedGoal,period:PlanningPeriod) {
 const plan=ledger.contributionPlans?.find(p=>p.goal_id===goal.id&&p.period_start===period.start&&p.period_end===period.end);
 const added=ledger.entries.filter(e=>e.named_goal_id===goal.id&&within(e.date,period)).reduce((sum,e)=>sum+(e.withdrawal?-e.amount_minor:e.amount_minor),0);
 const withdrawn=ledger.entries.filter(e=>e.named_goal_id===goal.id&&e.withdrawal&&within(e.date,period)).reduce((sum,e)=>sum+e.amount_minor,0);
 return {planned:plan?.amount_minor??null,added,withdrawn,above:!!plan&&added>plan.amount_minor,remaining:plan?Math.max(0,plan.amount_minor-added):null,met:!!plan&&added>=plan.amount_minor};
}
export function comparisonRanges(period:PlanningPeriod,previous:PlanningPeriod,asOf:string,fullPrevious=false) {
 const inProgress=period.start<=asOf&&asOf<period.end,notStarted=asOf<period.start;
 const current={start:period.start,end:inProgress?asOf:period.end};
 const elapsed=Math.floor((Date.parse(current.end+'T00:00:00Z')-Date.parse(current.start+'T00:00:00Z'))/86400000)+1;
 const priorEnd=inProgress&&!fullPrevious?addDays(previous.start,elapsed-1):previous.end;
 return {current,previous:{start:previous.start,end:priorEnd>previous.end?previous.end:priorEnd},inProgress,notStarted,asOf};
}

/** Linking reuses owned records with the goal's fixed currency and funding type. */
export function eligibleGoalEntries(ledger:Ledger,goal:NamedGoal,contributionsOnly=false) {
 if(goal.user_id!==ledger.profile.user_id)return [];
 return ledger.entries.filter(e=>e.user_id===ledger.profile.user_id&&!e.named_goal_id&&e.currency===goal.currency&&(!contributionsOnly||(!e.withdrawal&&e.amount_minor>0))&&ledger.categories.some(c=>c.id===e.category_id&&c.user_id===ledger.profile.user_id&&c.kind===goal.funding_kind));
}
