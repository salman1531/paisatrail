import { expect, test } from '@playwright/test';

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
  if (draft) expect(await sitemap.text()).not.toContain('/privacy.html</loc>');
  else expect(await sitemap.text()).toContain('/privacy.html</loc>');
  await page.goto('/about.html'); await expect(page.getByRole('heading', {name: /Track your expenses/})).toBeVisible();
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain(draft ? 'Disallow: /' : 'Allow: /');
});
