import {readFile} from 'node:fs/promises';
export function readHomeBody(workspace){return readFile(new URL('../.generated/'+(workspace?workspace+'-landing':'home')+'.html',import.meta.url),'utf8');}
export const homeDescription = 'Track expenses and budgets, or split costs with friends. Personal Finance and Shared Expenses: separate workspaces. Free for personal use.';
export function replaceRoot(html, body) {
  const pattern=/<div id="root">[\s\S]*?<\/div>\s*(?=<script\b|<\/body>)/;
  if (!pattern.test(html)) throw new Error('Cannot locate the application root for public HTML rendering.');
  return html.replace(pattern,()=>`<div id="root">${body}</div>\n    `);
}
export function homepageHtml(html, body) {
  return replaceRoot(html,body).replace(/<title>[^<]*<\/title>/,'<title>PaisaTrace — Personal Finance &amp; Shared Expenses</title>').replace(/(<meta name="description" content=")[^"]*/, '$1'+homeDescription);
}
export function privateShellHtml(html) {
  return replaceRoot(html,'<div class="boot-loader" role="status"><span class="boot-spinner" aria-hidden="true"></span>Opening PaisaTrace…</div><noscript>Enable JavaScript to sign in or explore the demo.</noscript>');
}

export const landingMetadata={
 personal:{title:'Personal Finance — Expense Tracker & Budget Planner · PaisaTrace',description:'Record income and expenses, plan your spending and follow savings goals. Try Personal Finance with sample data, then create your free PaisaTrace account.',path:'/personal-finance'},
 shared:{title:'Shared Expenses — Split Costs & Track Repayments · PaisaTrace',description:'Split costs with friends, housemates and groups. See who owes whom and track repayments. Explore the Shared Expenses demo, with PKR group bookkeeping.',path:'/shared-expenses'}
};
export function landingHtml(html,body,workspace,origin,indexable){const data=landingMetadata[workspace];let page=replaceRoot(html,body).replace(/<title>[^<]*<\/title>/,'<title>'+data.title+'</title>').replace(/(<meta name="description" content=")[^"]*/,'$1'+data.description).replace(/(<meta name="robots" content=")[^"]*/,'$1'+(indexable?'index, follow':'noindex, follow')).replace(/(<link rel="canonical" href=")[^"]*/,'$1'+origin+data.path).replace(/(<meta property="og:url" content=")[^"]*/,'$1'+origin+data.path).replace(/(<meta (?:property="og:title"|name="twitter:title") content=")[^"]*/g,'$1'+data.title).replace(/(<meta (?:property="og:description"|name="twitter:description") content=")[^"]*/g,'$1'+data.description);return page;}
