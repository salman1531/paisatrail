import {parseAmount,validDate} from './finance';
import type {Currency,Entry,Kind,Ledger,NamedGoal} from './types';
export function generalSavingsCategory(ledger:Ledger){return ledger.categories.find(c=>c.kind==='saving'&&!c.archived&&/^(general )?savings$/i.test(c.name));}
export function compatibleGoal(goal:NamedGoal|undefined,kind:Kind,currency:Currency){return !!goal&&goal.funding_kind===kind&&goal.currency===currency;}
export function validateRecordedAmount(amount:string,currency:Currency){
 if(!amount.trim())throw Error('Enter an amount.');
 if(/^[-]/.test(amount.trim()))throw Error('Enter a positive amount. Choose Withdraw for money taken out.');
 if(/^0+(\.0+)?$/.test(amount.trim()))throw Error('Enter an amount greater than zero.');
 return parseAmount(amount,currency);
}
export function validateRecording(ledger:Ledger,entry:Entry){
 if(!validDate(entry.date))throw Error('Choose a valid date between 1900 and 2100.');
 if(!Number.isSafeInteger(entry.amount_minor)||entry.amount_minor<=0)throw Error('Enter a positive amount.');
 if(entry.notes.length>500)throw Error('Use no more than 500 characters in the note.');
 const category=ledger.categories.find(c=>c.id===entry.category_id);
 if(!category||category.user_id!==entry.user_id)throw Error('Choose a category in your account.');
 if(entry.withdrawal&&category.kind!=='saving'&&category.kind!=='investment')throw Error('Only savings and investments can be withdrawn.');
}
export function recordingSuccess(ledger:Ledger,entry:Entry,editing:boolean){const kind=ledger.categories.find(c=>c.id===entry.category_id)?.kind;const goal=ledger.namedGoals?.find(g=>g.id===entry.named_goal_id);return `${editing?'Updated':entry.withdrawal?'Recorded withdrawal':kind==='income'?'Recorded income':kind==='expense'?'Recorded expense':kind==='investment'?'Recorded investment contribution':'Recorded savings'}${goal?' · '+goal.name+' progress updated':''}.`;}
