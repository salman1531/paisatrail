import {readFile} from 'node:fs/promises';
export const posts=JSON.parse(await readFile(new URL('../content/blog/posts.json',import.meta.url),'utf8'));
export const blogPaths=['/blog',...posts.map(post=>'/blog/'+post.slug)];
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function inline(text) {
 const token=/\[([^\]]+)\]\((https:\/\/paisatrace\.hirubix\.com\/[^\s)]+)\)|\*\*([^*]+)\*\*/g;
 let html='',end=0;
 for(const match of text.matchAll(token)) {html+=escape(text.slice(end,match.index));html+=match[3]?`<strong>${escape(match[3])}</strong>`:`<a href="${escape(new URL(match[2]).pathname+new URL(match[2]).hash)}">${escape(match[1])}</a>`;end=match.index+match[0].length;}
 return html+escape(text.slice(end));
}
// The supplied articles use headings, paragraphs, emphasis, links and simple tables.
// Raw HTML is escaped; editorial metadata is kept outside the article bodies.
export function articleBody(markdown) {
 return markdown.trim().split(/\n\s*\n/).map(block=>{
  if(block.startsWith('# '))return '';
  if(block.startsWith('## '))return `<h2>${inline(block.slice(3))}</h2>`;
  if(block.startsWith('|')) {
   const rows=block.split('\n').map(row=>row.trim().slice(1,-1).split('|').map(cell=>cell.trim()));
   if(rows.length<3||!rows[1].every(cell=>/^:?-+:?$/.test(cell)))throw new Error('Unsupported article table');
   return `<div class="article-table"><table><caption>Fictional example: all amounts in one currency</caption><thead><tr>${rows[0].map(cell=>`<th scope="col">${inline(cell)}</th>`).join('')}</tr></thead><tbody>${rows.slice(2).map(row=>`<tr>${row.map(cell=>`<td>${inline(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  return `<p>${inline(block.replace(/\n/g,' '))}</p>`;
 }).join('');
}
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c');
export async function blogDocuments({origin,draft,stylesheet,nav,footer}) {
 const files={};
 function document(path,title,description,body,schema) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="${draft?'noindex, nofollow':'index, follow'}"><link rel="canonical" href="${origin+path}"><link rel="stylesheet" href="${stylesheet}"><link rel="icon" href="/favicon.svg"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${origin+path}"><meta property="og:type" content="${path==='/blog'?'website':'article'}"><meta property="og:site_name" content="PaisaTrace"><meta property="og:image" content="${origin}/social-card.png"><meta property="og:image:alt" content="PaisaTrace — Track spending. Plan your month."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${origin}/social-card.png"><script type="application/ld+json">${json(schema)}</script></head><body class="blog-page"><main><nav class="blog-nav" aria-label="Public pages"><a class="blog-brand" href="/">PaisaTrace</a><div><a href="/blog">Blog</a><a href="/guide">User guide</a><a href="/login">Sign in</a></div></nav>${body}${footer}</main></body></html>`;
 }
 const breadcrumbs=items=>({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:items.map(([name,path],i)=>({'@type':'ListItem',position:i+1,name,item:origin+path}))});
 const dateLabel=date=>new Date(date+'T00:00:00Z').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});
 const cards=posts.map(post=>`<article class="blog-card"><p class="blog-date"><time datetime="${post.published}">${dateLabel(post.published)}</time></p><h2><a href="/blog/${post.slug}">${escape(post.title)}</a></h2><p>${escape(post.description)}</p><a class="blog-read" href="/blog/${post.slug}">Read the guide <span aria-hidden="true">↗</span></a></article>`).join('');
 files['blog/index.html']=document('/blog','Expense Tracking & Budgeting Guides | PaisaTrace','Practical guides to daily expense tracking, payday budgets and irregular income. Learn how recorded money, spending plans and savings goals fit together.',`<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-current="page">Blog</span></nav><header class="blog-hero"><p class="blog-eyebrow">PAISATRACE BLOG</p><h1>A little clarity for everyday money.</h1><p>Practical guides for recording expenses, planning around payday and keeping expected income separate from receipts.</p></header><section class="blog-grid" aria-label="Money guides">${cards}</section>`,breadcrumbs([['Home','/'],['Blog','/blog']]));
 for(const post of posts) {
  const path='/blog/'+post.slug;
  const markdown=await readFile(new URL('../content/blog/'+post.slug+'.md',import.meta.url),'utf8');
  const schema={'@context':'https://schema.org','@graph':[{'@type':'BlogPosting',headline:post.title,description:post.description,url:origin+path,mainEntityOfPage:origin+path,datePublished:post.published,inLanguage:'en',image:origin+'/social-card.png',publisher:{'@type':'Organization',name:'PaisaTrace',url:origin+'/'}} ,breadcrumbs([['Home','/'],['Blog','/blog'],[post.title,path]])]};
  const related=posts.filter(other=>other.slug!==post.slug).map(other=>`<li><a href="/blog/${other.slug}">${escape(other.title)}</a></li>`).join('');
  files['blog/'+post.slug+'/index.html']=document(path,post.seoTitle,post.description,`<nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><a href="/blog">Blog</a><span aria-current="page">${escape(post.title)}</span></nav><article class="blog-article"><header><p class="blog-eyebrow">PAISATRACE GUIDE</p><h1>${escape(post.title)}</h1><p class="blog-date">Published <time datetime="${post.published}">${dateLabel(post.published)}</time></p></header>${articleBody(markdown)}</article><aside class="blog-related" aria-labelledby="related-heading"><h2 id="related-heading">Keep exploring</h2><ul>${related}<li><a href="/guide">PaisaTrace user guide</a></li></ul><a class="start" href="/demo/overview">Explore the demo</a></aside>`,schema);
 }
 return files;
}
