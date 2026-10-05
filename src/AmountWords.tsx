import { parseAmount, precision } from './finance';
import type { Currency } from './types';
const small = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const tens = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
function words(n: number, pakistani: boolean): string {
  if(n<20)return small[n];
  if(n<100)return tens[Math.floor(n/10)]+(n%10?`-${small[n%10]}`:'');
  const scales: [number,string][] = pakistani ? [[10000000,'crore'],[100000,'lakh'],[1000,'thousand'],[100,'hundred']] : [[1000000000,'billion'],[1000000,'million'],[1000,'thousand'],[100,'hundred']];
  const [size,name]=scales.find(([size])=>n>=size)!;
  return `${words(Math.floor(n/size),pakistani)} ${name}${n%size?` ${words(n%size,pakistani)}`:''}`;
}
const units: Record<Currency,[string,string,string,string]> = {
 PKR:['Pakistani rupee','Pakistani rupees','paisa','paisa'], USD:['US dollar','US dollars','cent','cents'], GBP:['pound','pounds','penny','pence'], EUR:['euro','euros','cent','cents'], AED:['dirham','dirhams','fil','fils'], JPY:['yen','yen','',''], KWD:['Kuwaiti dinar','Kuwaiti dinars','fil','fils']
};
export function amountInWords(value: string,currency: Currency): string | null {
 if(!value.trim())return null;
 try {
  const minor=parseAmount(value,currency,true), divisor=10**precision(currency), whole=Math.floor(minor/divisor), fraction=minor%divisor;
  const unit=units[currency], pakistani=currency==='PKR';
  const text=`${words(whole,pakistani)}${fraction?` and ${words(fraction,pakistani)} ${unit[fraction===1?2:3]}`:''} ${currency.toLowerCase()}`;
  return text[0].toUpperCase()+text.slice(1);
 } catch {return null;}
}
export default function AmountWords({value,currency}:{value:string;currency:Currency}) {
 const text=amountInWords(value,currency);
 return text ? <span className="amount-words" aria-live="polite">{text}</span> : null;
}
