import { expect, test } from '@playwright/test';

test('public policy drafts and discovery files work before sign-in', async ({ page, request }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('PaisaTrail');
  await page.getByRole('link', { name: 'Privacy policy', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Privacy policy', exact: true })).toBeVisible();
  await expect(page.locator('.draft')).toContainText('Prelaunch draft');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('navigation').first().getByRole('link', { name: 'Terms and conditions', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Terms and conditions', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const llms = await request.get('/llms.txt');
  expect(llms.ok()).toBe(true); expect(await llms.text()).toContain('# PaisaTrail');
  const sitemap = await request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true); expect(await sitemap.text()).toContain('<urlset');
  expect(await sitemap.text()).not.toContain('<loc>');
  const robots = await request.get('/robots.txt');
  expect(await robots.text()).toContain('Disallow: /');
});
