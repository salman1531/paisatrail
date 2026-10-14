import {describe,it,expect} from 'vitest';
import {articleBody,blogDocuments,posts} from '../scripts/blog.mjs';
describe('supplied public articles',()=>{
 it('escapes raw HTML and permits only the supplied first-party link format',()=>{
  const body=articleBody('# Title\n\n<script>alert(1)</script> **Important** [Guide](https://paisatrace.hirubix.com/guide#income) [Unsafe](javascript:alert)');
  expect(body).not.toContain('<script>');expect(body).toContain('&lt;script&gt;');expect(body).toContain('<strong>Important</strong>');expect(body).toContain('href="/guide#income"');expect(body).not.toContain('href="javascript:');
 });
 it('renders fictional tables with accessible column headings and without changing the figures',()=>{
  const body=articleBody('| Item | Amount |\n| --- | ---: |\n| Received | 2,400 |\n| Unassigned | 300 |');
  expect(body).toContain('<th scope="col">Amount</th>');expect(body).toContain('Fictional example');expect(body).toContain('<td>2,400</td>');expect(body).toContain('<td>300</td>');
 });
 it('publishes all three supplied articles with matching visible dates, breadcrumbs and honest metadata',async()=>{
  const files=await blogDocuments({origin:'https://fixture.example',draft:false,stylesheet:'/site.css',nav:'',footer:''});
  expect(Object.keys(files)).toHaveLength(4);
  for(const post of posts){const html=files['blog/'+post.slug+'/index.html'];expect(html).toContain(`datetime="${post.published}"`);expect(html).not.toContain('AI-assisted');expect(html).not.toContain('human editorial review required');const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)![1])['@graph'];expect(graph[0].headline).toBe(post.title);expect(graph[0].datePublished).toBe(post.published);expect(graph[0].author).toBeUndefined();expect(graph[0].dateModified).toBeUndefined();expect(graph[1].itemListElement.at(-1).item).toBe('https://fixture.example/blog/'+post.slug);expect(files['blog/index.html']).toContain(`href="/blog/${post.slug}"`);}
 });
});
