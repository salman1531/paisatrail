import {readFile} from 'node:fs/promises';
export function readHomeBody(){return readFile(new URL('../.generated/home.html',import.meta.url),'utf8');}
export const homeDescription = 'Track expenses and budgets, or split costs with friends. Personal Finance and Shared Expenses: separate workspaces. Free for personal use.';
export function replaceRoot(html, body) {
  const pattern=/<div id="root">[\s\S]*?<\/div>\s*(?=<script\b|<\/body>)/;
  if (!pattern.test(html)) throw new Error('Cannot locate the application root for public HTML rendering.');
  return html.replace(pattern,()=>`<div id="root">${body}</div>\n    `);
}
export function homepageHtml(html, body) {
  return replaceRoot(html,body).replace(/(<meta name="description" content=")[^"]*/, '$1'+homeDescription);
}
export function privateShellHtml(html) {
  return replaceRoot(html,'<div class="boot-loader" role="status"><span class="boot-spinner" aria-hidden="true"></span>Opening PaisaTrace…</div><noscript>Enable JavaScript to sign in or explore the demo.</noscript>');
}
