import { expect, test } from '@playwright/test';
import {posts} from '../../scripts/blog.mjs';

test('homepage HTTP response contains the product and crawlable public links before JavaScript',async({request})=>{
 const response=await request.get('/');expect(response.status()).toBe(200);const html=await response.text();
 expect(html).toContain('Track expenses.<br/>Know what remains.');expect(html).toContain('A free expense tracker and budget planner for everyday life.');expect(html).not.toContain('Loading PaisaTrace');
 for(const path of ['/about','/guide','/privacy','/terms','/signup','/demo/overview'])expect(html).toContain(`href="${path}"`);
 expect((html.match(/<h1\b/g)||[]).length).toBe(1);expect(html).toContain('Track expenses, record income and plan your budget with PaisaTrace.');
 const about=await request.get('/about');expect(await about.text()).toContain('<title>About PaisaTrace — Simple Personal Finance Tracking</title>');
});

test('private route HTTP shells stay noindex and omit duplicate public landing content',async({request})=>{
 for(const path of ['/login','/auth/callback','/app/settings','/demo/money-log']){const response=await request.get(path);expect(response.status()).toBe(200);const html=await response.text();expect(html).toContain('noindex, follow');expect(html).not.toContain('home-hero');expect(html).toContain('Opening PaisaTrace');}
});

test('blog HTTP responses contain all supplied articles and matching visible structured metadata',async({request})=>{
 const hub=await request.get('/blog');expect(hub.status()).toBe(200);const html=await hub.text();
 for(const post of posts){const slug=post.slug;expect(html).toContain(`href="/blog/${slug}"`);const response=await request.get('/blog/'+slug);expect(response.status()).toBe(200);const article=await response.text();expect(article).not.toContain('AI-assisted');expect(article).toContain(`datetime="${post.published}"`);expect(article).toContain('"@type":"BlogPosting"');expect(article).toContain('rel="author" href="/about#editorial">PaisaTrace');expect(article).toContain('id="try-it"');expect(article).toContain(`datetime="${post.modified}"`);expect(article).toContain('"@type":"BreadcrumbList"');expect(article).not.toContain('human editorial review required');}
 const sitemap=await request.get('/sitemap.xml');expect(await sitemap.text()).toContain('/blog/how-to-save-for-a-big-purchase</loc>');
});

test('public policy drafts and discovery files work before sign-in', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('PaisaTrace — Expense Tracker & Monthly Budget');
  await page.getByRole('link', { name: 'Privacy policy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Privacy policy', exact: true })).toBeVisible();
  const draft = await page.locator('.draft').count() > 0;
  if (draft) await expect(page.locator('.draft')).toContainText('Prelaunch draft');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('navigation').first().getByRole('link', { name: 'Terms and conditions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Terms and conditions', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const llms = await request.get('/llms.txt');
  expect(llms.ok()).toBe(true); expect(await llms.text()).toContain('# PaisaTrace');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true); expect(await sitemap.text()).toContain('<urlset');
  if (draft) expect(await sitemap.text()).not.toContain('/privacy</loc>');
  else expect(await sitemap.text()).toContain('/privacy</loc>');
  await page.goto('/about'); await expect(page.getByRole('heading', {name: /Track your expenses/})).toBeVisible();
  await page.getByRole('navigation', {name:'Public pages'}).first().getByRole('link', {name:'User guide',exact:true}).click();
  await expect(page).toHaveTitle(/PaisaTrace user guide/);
  await expect(page.getByRole('navigation',{name:'Guide contents'})).toBeVisible();
  await page.getByRole('navigation',{name:'Guide contents'}).getByRole('link',{name:/Save toward a named outcome$/}).click();
  await expect(page.getByRole('heading',{name:'Save toward a named outcome',exact:true})).toBeVisible();
  await expect(page.locator('#goals')).toContainText('Goal progress never resets at the month boundary');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  if (!draft) expect(await sitemap.text()).toContain('/guide</loc>');
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(draft ? 'Disallow: /' : 'Allow: /');
});
