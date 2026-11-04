import {parseAmount} from '../finance';
import type {FieldProblem} from '../FormFeedback';
export function expenseProblem({title,amount,space,participants,allocationError,method}:{title:string;amount:string;space:boolean;participants:number;allocationError:string;method:string}):FieldProblem|null{
 if(!title.trim())return {field:'description',message:'Enter a description.'};
 if(!space)return {field:'space',message:'Choose a shared space.'};
 try{parseAmount(amount,'PKR');}catch(e){return {field:'amount',message:(e as Error).message};}
 if(!participants)return {field:'participant',message:'Choose at least one person to share this expense.'};
 if(allocationError)return {field:method==='equal'?'amount':'share',message:allocationError};
 return null;
}
export function repaymentProblem({space,balance,amount}:{space:boolean;balance?:number;amount:string}):FieldProblem|null{
 if(!space)return {field:'space',message:'Choose a shared space.'};
 if(balance===undefined)return {field:'balance',message:'Choose an outstanding balance.'};
 try{if(parseAmount(amount,'PKR')>balance)return {field:'amount',message:'Enter an amount no larger than this outstanding balance.'};}catch(e){return {field:'amount',message:(e as Error).message};}
 return null;
}
