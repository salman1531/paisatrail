import {useId,useState,type RefObject} from 'react';
export type FieldProblem={field:string;message:string};
export function useFormFeedback(form:RefObject<HTMLFormElement|null>){
 const id=useId(),[problem,setProblem]=useState<FieldProblem|null>(null);
 return {
  clear:()=>setProblem(null),
  reject:(next:FieldProblem)=>{setProblem(next);form.current?.querySelector<HTMLElement>(`[name="${next.field}"]`)?.focus();},
  attributes:(field:string)=>({'aria-invalid':problem?.field===field?true:undefined,'aria-describedby':problem?.field===field?id:undefined}),
  message:(field:string)=>problem?.field===field?<p id={id} className="form-error" role="alert">{problem.message}</p>:null,
  field:problem?.field
 };
}
