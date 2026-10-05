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

export function percentOfIncome(income: number, percent: string): number {
 if(!/^\d+(?:\.\d{1,2})?$/.test(percent.trim()))throw new Error('Enter a percentage with up to two decimal places.');
 const [whole,fraction='']=percent.trim().split('.');
 const hundredths=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if(!Number.isSafeInteger(hundredths)||hundredths>10000)throw new Error('Enter a percentage from 0 to 100.');
 return Math.round(income*hundredths/10000);
}
