export const sharedCategories=['Food & Drinks','Groceries','Transport','Fuel','Accommodation','Shopping','Utilities','Entertainment','Travel','Other'] as const;
export const settlementMethods=['Cash','Bank transfer','Mobile wallet','Other'] as const;
export type SharedPage='dashboard'|'groups'|'friends'|'activity'|'settlements'|'reports'|'settings';
export type ProductPreferences={user_id:string;personal_enabled:boolean;shared_enabled:boolean;last_product:'personal'|'shared';display_name:string};
export type Context={id:string;kind:'group'|'direct';name:string;description:string;icon:string;group_type:string;currency:'PKR';owner_id:string|null;archived:boolean;version:number;created_at:string};
export type Participant={id:string;context_id:string;user_id:string|null;name:string;active:boolean;created_at:string};
export type Pair={debtor_id:string;creditor_id:string;amount_minor:number};
export type Summary={context:Context;my_participant_id:string;participants:Participant[];pairs:Pair[];expense_count:number;total_minor:number;paid_minor:number;share_minor:number};
export type Share={participant_id:string;amount_minor:number;weight?:number};
export type Expense={id:string;context_id:string;title:string;amount_minor:number;currency:'PKR';date:string;category:string;notes:string;split_method:'equal'|'exact'|'percentage';created_by:string|null;created_at:string;updated_at:string;cancelled:boolean;version:number;shares:Share[];payers:{participant_id:string;amount_minor:number}[]};
export type Settlement={id:string;context_id:string;payer_id:string;receiver_id:string;amount_minor:number;currency:'PKR';date:string;method:string;notes:string;status:'pending'|'confirmed'|'cancelled';created_by:string|null;confirmed_by:string|null;manual_record:boolean;version:number;created_at:string;confirmed_at:string|null};
export type Activity={id:string;context_id:string;actor_id:string|null;actor_name:string;action:string;entity_id:string|null;detail:Record<string,unknown>;created_at:string};
export type Invitation={id:string;context_id:string;claim_participant_id:string|null;expires_at:string;revoked_at:string|null};
export type InvitePreview={id:string;context_id:string;name:string;kind:'group'|'direct';expires_at:string;claim_name:string|null;claim_participant_id:string|null;error?:string};
export type Report={totals?:{spending_minor:number;paid_minor:number;share_minor:number;expense_count:number};timeline?:{date:string;amount_minor:number}[];repayments?:{status:Settlement['status'];amount_minor:number;count:number}[];categories:{category:string;amount_minor:number}[];people:{id:string;context_id:string;name:string;paid_minor:number;share_minor:number}[]};
export type Command={id:string;action:string;context:string|null;data:Record<string,unknown>};
export type HistoryFilter={context?:string;start?:string;end?:string;offset?:number;category?:string;participant?:string;participantRole?:'paid'|'share';includedOnly?:boolean};
export const pageSize=20;
export function exactInteger(n:number){if(!Number.isSafeInteger(n)||n<0||n>1000000000000)throw Error('Enter a valid amount within the supported limit.');return n;}
export function percentageWeight(text:string){if(!/^\d{1,3}(\.\d{1,2})?$/.test(text.trim()))throw Error('Use percentages with up to two decimal places.');const [a,b='']=text.trim().split('.');const n=Number(a)*100+Number(b.padEnd(2,'0'));if(n>10000)throw Error('A percentage cannot exceed 100%.');return n;}
/** Same largest-remainder contract as PostgreSQL; UUID ascending resolves exact ties. */
export function allocate(amount:number,method:Expense['split_method'],inputs:{participant_id:string;value?:number}[]):Share[]{
 exactInteger(amount);if(amount===0)throw Error('Amount must be greater than zero.');
 if(inputs.length<1||inputs.length>100||new Set(inputs.map(x=>x.participant_id)).size!==inputs.length)throw Error('Choose distinct participants (up to 100).');
 const sorted=[...inputs].sort((a,b)=>a.participant_id.localeCompare(b.participant_id));
 if(method==='exact'){const result=sorted.map(x=>({participant_id:x.participant_id,amount_minor:exactInteger(x.value??-1)}));if(result.reduce((n,x)=>n+x.amount_minor,0)!==amount)throw Error('Exact shares must equal the expense amount.');return result;}
 const denominator=method==='equal'?BigInt(sorted.length):10000n;
 if(method==='percentage'&&(sorted.some(x=>!Number.isInteger(x.value)||x.value!<0||x.value!>10000)||sorted.reduce((n,x)=>n+x.value!,0)!==10000))throw Error('Percentages must total 100%.');
 const rows=sorted.map(x=>{const weight=method==='equal'?1:x.value!;const n=BigInt(amount)*BigInt(weight);return {participant_id:x.participant_id,weight,amount_minor:Number(n/denominator),remainder:n%denominator};});
 let left=amount-rows.reduce((n,x)=>n+x.amount_minor,0);
 for(const r of [...rows].sort((a,b)=>a.remainder===b.remainder?a.participant_id.localeCompare(b.participant_id):a.remainder>b.remainder?-1:1)){if(left-->0)r.amount_minor++;}
 return rows.map(({remainder:_,...r})=>r);
}
export function pairsFor(expenses:Expense[],settlements:Settlement[]):Pair[]{
 const net=new Map<string,{a:string;b:string;amount:bigint}>();
 const add=(debtor:string,creditor:string,n:number)=>{if(debtor===creditor)return;const [a,b]=[debtor,creditor].sort(),key=a+':'+b;const row=net.get(key)??{a,b,amount:0n};row.amount+=(debtor===a?1n:-1n)*BigInt(n);net.set(key,row);};
 for(const e of expenses.filter(e=>!e.cancelled)){if(e.payers.length!==1)throw Error('MVP supports one payer per expense.');for(const s of e.shares)add(s.participant_id,e.payers[0].participant_id,s.amount_minor);}
 for(const s of settlements.filter(s=>s.status==='confirmed'))add(s.payer_id,s.receiver_id,-s.amount_minor);
 return [...net.values()].filter(r=>r.amount!==0n).map(r=>{const n=r.amount<0n?-r.amount:r.amount;if(n>BigInt(Number.MAX_SAFE_INTEGER))throw Error('Balance exceeds the supported display range.');return {debtor_id:r.amount>0?r.a:r.b,creditor_id:r.amount>0?r.b:r.a,amount_minor:Number(n)};});
}
export function position(pairs:Pair[],id:string){const owed=pairs.filter(p=>p.creditor_id===id).reduce((n,p)=>n+p.amount_minor,0),owe=pairs.filter(p=>p.debtor_id===id).reduce((n,p)=>n+p.amount_minor,0);return {owed,owe,net:owed-owe};}
export function totalPosition(rows:Summary[]){return rows.reduce((n,r)=>{const p=position(r.pairs,r.my_participant_id);return {owed:n.owed+p.owed,owe:n.owe+p.owe,net:n.net+p.net};},{owed:0,owe:0,net:0});}
export function sharedPath(page:SharedPage='dashboard',demo=false,context?:string){return `/${demo?'shared-demo':'shared'}/${page}${context?'/'+context:''}`;}
export function secureInviteToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');}
export async function invitationHash(token:string){if(!/^[a-f0-9]{64}$/.test(token))throw Error('This invitation is invalid.');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
