export type SaveRequest={action:string;context:string|null;data:Record<string,unknown>};
export function ambiguousFailure(error:unknown){return error instanceof TypeError||/network|fetch|timeout|timed out|no response|connection|abort/i.test((error as Error)?.message??'');}
/** Unknown outcomes always reuse the exact command and payload, including after
 * a committed response was lost. Business rejections may be corrected normally. */
export class SaveAttempt {
 private unresolved:SaveRequest|null=null;
 private signature='';
 private key=crypto.randomUUID();
 prepare(request:SaveRequest){
  const values=this.unresolved??structuredClone(request),signature=JSON.stringify(values);
  if(this.signature!==signature){this.signature=signature;this.key=crypto.randomUUID();}
  return {values,key:this.key};
 }
 failed(error:unknown,request:SaveRequest){const unknown=ambiguousFailure(error);this.unresolved=unknown?request:null;return unknown;}
 resolved(){this.unresolved=null;}
}
