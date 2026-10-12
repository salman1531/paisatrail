import {precision} from './finance';
import type {Currency} from './types';

/** Keep every digit together; containers stack when a full amount needs more room. */
export default function MoneyValue({amount,currency}:{amount:number;currency:Currency}) {
 const digits=precision(currency);
 const number=new Intl.NumberFormat('en',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(amount/10**digits);
 return <span className="money-value" data-wide={number.length>13?'true':undefined}><span className="money-currency">{currency}</span>{' '}<span className="money-number">{number}</span></span>;
}
