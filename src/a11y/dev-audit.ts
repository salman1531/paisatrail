import axe from 'axe-core';

// Local test controls only. main.tsx's DEV guard removes this module from production.
if(!location.pathname.startsWith('/app/')&&import.meta.env.DEV&&new URLSearchParams(location.search).get('a11y')==='1'){
 const panel=document.createElement('details');panel.dataset.a11yAudit='';panel.className='dev-audit-panel';
 panel.innerHTML='<summary>Accessibility test controls</summary><button type="button">Run accessibility check</button><button type="button">Toggle 200% text</button><button type="button">Toggle text spacing</button><p role="status">Not run</p><pre aria-label="Accessibility audit JSON">Not run</pre>';
 const style=document.createElement('style');style.textContent=`
 .dev-audit-panel{position:fixed;right:8px;top:8px;z-index:2000;max-width:min(22rem,90vw);max-height:65vh;overflow:auto;padding:8px;background:white;color:#17323b;border:2px solid #70858a;border-radius:10px;font:14px/1.5 system-ui}
 .dev-audit-panel:not([open]){max-width:12rem}.dev-audit-panel summary{cursor:pointer}.dev-audit-panel button{display:block;margin:8px 0;min-height:44px}.dev-audit-panel pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 monospace}
 body[data-test-spacing] *:not([data-a11y-audit],[data-a11y-audit] *){line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}
 body[data-test-spacing] p:not([data-a11y-audit] p){margin-bottom:2em!important}`;
 document.head.append(style);document.body.append(panel);
 const [run,text,spacing]=Array.from(panel.querySelectorAll('button'));
 const status=panel.querySelector('p')!,output=panel.querySelector('pre')!;
 const summarize=(items:axe.Result[])=>items.map(({id,impact,help,helpUrl,tags,nodes})=>({id,impact,help,helpUrl,tags,nodes:nodes.map(({target,failureSummary,any,all,none})=>({target,failureSummary,checks:[...any,...all,...none].map(({id,message,data})=>({id,message,data}))}))}));
 run.onclick=async()=>{
  run.disabled=true;status.textContent='Running accessibility checks…';
  try{
   const result=await axe.run({exclude:[['[data-a11y-audit]']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});
   const report={engine:result.testEngine,environment:result.testEnvironment,url:location.pathname,date:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight},textSize:getComputedStyle(document.documentElement).fontSize,textSpacing:document.body.hasAttribute('data-test-spacing'),violations:summarize(result.violations),incomplete:summarize(result.incomplete),passes:result.passes.map(r=>r.id),inapplicable:result.inapplicable.map(r=>r.id)};
   output.textContent=JSON.stringify(report,null,2);status.textContent=`${result.violations.length} automated violations · ${result.incomplete.length} checks need manual review. This is not a conformance result.`;
  }catch(error){status.textContent='Audit could not complete: '+String(error);}finally{run.disabled=false;}
 };
 text.onclick=()=>{const root=document.documentElement;root.style.fontSize=root.style.fontSize==='200%'?'':'200%';};
 spacing.onclick=()=>document.body.toggleAttribute('data-test-spacing');
 const place=()=>{const destination=document.querySelector('dialog[open] .modal-content')??document.body;if(panel.parentElement!==destination)destination.append(panel);};
 new MutationObserver(place).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open']});
 document.addEventListener('keydown',event=>{if(event.altKey&&event.shiftKey&&event.code==='KeyA'){event.preventDefault();panel.open=!panel.open;}});
}
