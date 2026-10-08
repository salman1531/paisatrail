export const paymentTypes=['Cash','Credit Card','Debit Card','Bank Account','Others'];
export function validatePaymentType(value:string){if(!value)return null;if(!paymentTypes.includes(value))throw new Error('Choose a payment type from the list.');return value;}
export default function PaymentTypeField({value,onChange,label='Payment type (optional)',disabled=false}:{value:string;onChange:(value:string)=>void;label?:string;disabled?:boolean}){
 return <div className="payment-type-field"><label>{label}<select disabled={disabled} value={value} onChange={e=>onChange(e.target.value)}><option value="">Not specified</option>{paymentTypes.map(type=><option key={type}>{type}</option>)}</select></label></div>;
}
