import { expect, test } from 'vitest';
import { amountInWords } from '../src/AmountWords';
import { suggestBudget, percentOfIncome } from '../src/budgetSuggestions';
test('amount words preserve currency precision and Pakistani large units',()=>{
 expect(amountInWords('150000.50','PKR')).toBe('One lakh fifty thousand and fifty paisa pkr');
 expect(amountInWords('10000000','PKR')).toBe('One crore pkr');
 expect(amountInWords('1.01','USD')).toBe('One and one cent usd');
 expect(amountInWords('1.001','KWD')).toBe('One and one fil kwd');
 expect(amountInWords('0','JPY')).toBe('Zero jpy');
 for(const invalid of ['', '-1','abc','1.001','10000000000000'])expect(amountInWords(invalid,'PKR')).toBeNull();
});
test('suggested budget balances minor units and handles absent earnings',()=>{
 expect(suggestBudget(15000000,'cushion')).toEqual({expense:12000000,saving:3000000,investment:0});
 expect(suggestBudget(15000000,'balanced')).toEqual({expense:12000000,saving:1500000,investment:1500000});
 const odd=suggestBudget(101,'more')!;expect(odd.expense+odd.saving+odd.investment).toBe(101);
 expect(suggestBudget(0,'cushion')).toBeNull();
});

test('percentage goals preserve minor units and reject invalid rates',()=>{
 expect(percentOfIncome(15000000,'10')).toBe(1500000);
 expect(percentOfIncome(12345,'12.50')).toBe(1543);
 expect(percentOfIncome(101,'0')).toBe(0);
 for(const value of ['-1','101','1.123','abc'])expect(()=>percentOfIncome(100,value)).toThrow();
});
