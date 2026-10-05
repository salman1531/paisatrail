export const planningSplits = {
 cushion: { label: 'Build cash savings', expense: 80, saving: 20, investment: 0 },
 balanced: { label: 'Split savings & investing', expense: 80, saving: 10, investment: 10 },
 more: { label: 'Put more aside', expense: 70, saving: 20, investment: 10 }
};
export type PlanningSplit = keyof typeof planningSplits;
export function suggestBudget(income: number, split: PlanningSplit) {
 if(!Number.isSafeInteger(income) || income<=0)return null;
 const plan=planningSplits[split];
 const saving=Math.floor(income*plan.saving/100), investment=Math.floor(income*plan.investment/100);
 return {expense:income-saving-investment,saving,investment};
}

function percentagePoints(percent: string): number {
 if(!/^\d+(?:\.\d{1,2})?$/.test(percent.trim()))throw new Error('Enter a percentage with up to two decimal places.');
 const [whole,fraction='']=percent.trim().split('.');
 const hundredths=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(hundredths)||hundredths>10000)throw new Error('Enter a percentage from 0 to 100.');
 return hundredths;
}

export function percentOfIncome(income: number, percent: string): number {
 if(!Number.isSafeInteger(income)||income<0)throw new Error('Enter a valid earnings target.');
 return Number((BigInt(income)*BigInt(percentagePoints(percent))+5000n)/10000n);
}

export function customBudget(income: number, split: Record<'expense'|'saving'|'investment',string>) {
 const rates={expense:percentagePoints(split.expense),saving:percentagePoints(split.saving),investment:percentagePoints(split.investment)};
 const total=rates.expense+rates.saving+rates.investment;
 if(total>10000)throw new Error('Your split must total 100% or less.');
 if(!Number.isSafeInteger(income)||income<=0)return null;
 const portion=(rate:number)=>Number(BigInt(income)*BigInt(rate)/10000n);
 const saving=portion(rates.saving),investment=portion(rates.investment);
 // Preserve every minor unit for a fully allocated plan; smaller splits leave income unassigned.
 const expense=total===10000 ? income-saving-investment : portion(rates.expense);
 return {expense,saving,investment};
}
