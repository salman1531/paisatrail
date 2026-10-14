import {describe,it,expect} from 'vitest';
import {homepageHtml,privateShellHtml} from '../scripts/seo-html.mjs';
const input='<html><head><meta name="description" content="Old description"><script src="/assets/main.js" type="module"></script></head><body><div id="root"><main><div>Nested fallback</div></main></div></body></html>';
describe('crawler-delivered public content',()=>{
 it('replaces nested loading content while preserving the module and surrounding document',()=>{
  const result=homepageHtml(input,'<main><h1>Public product</h1><a href="/guide">Guide</a></main>');
  expect(result).toContain('<h1>Public product</h1>');expect(result).not.toContain('Nested fallback');expect(result).toContain('src="/assets/main.js"');expect(result).toContain('Free for personal use.');expect(result.endsWith('</body></html>')).toBe(true);
 });
 it('removes the public landing content from private shells without dropping JavaScript',()=>{
  const result=privateShellHtml(homepageHtml(input,'<main class="home-hero"><h1>Public product</h1></main>'));
  expect(result).not.toContain('Public product');expect(result).not.toContain('home-hero');expect(result).toContain('Opening PaisaTrace');expect(result).toContain('src="/assets/main.js"');
 });
 it('supports development HTML with a module after the root and fails closed on unexpected templates',()=>{
  expect(homepageHtml('<div id="root"><div>Nested</div></div><script type="module" src="/src/main.tsx"></script>','<main>Ready</main>')).toContain('<div id="root"><main>Ready</main></div>');
  expect(()=>homepageHtml('<main>No root</main>','Ready')).toThrow();
 });
});
