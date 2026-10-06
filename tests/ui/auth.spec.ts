import { test, expect } from '@playwright/test';
test('password login does not send an email; signup and recovery are separate', async ({ page }) => {
  const requests: { path: string; body: Record<string, unknown> }[] = [];
  await page.route('**/auth/v1/**', async route => {
    const url = new URL(route.request().url()); requests.push({path: url.pathname + url.search, body: route.request().postDataJSON() ?? {}});
    await route.fulfill({status: url.pathname.endsWith('/token') ? 400 : 200, contentType: 'application/json', body: url.pathname.endsWith('/token') ? JSON.stringify({code: 'invalid_credentials', message: 'Invalid login credentials'}) : '{}'});
  });
  await page.goto('/');
  await page.getByLabel('Email address').fill('auth-fixture@example.com');
  await page.getByLabel('Password', {exact: true}).fill('fixture password only');
  await page.getByRole('button', {name: 'Sign in', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('Email or password is incorrect');
  expect(requests).toHaveLength(1); expect(requests[0].path).toContain('/token?grant_type=password');
  await page.getByRole('button', {name: 'Create account', exact: true}).click();
  await page.getByLabel('Password', {exact: true}).fill('fixture password only');
  await page.getByLabel('Confirm password').fill('different password');
  await page.getByRole('button', {name: 'Create account', exact: true}).click();
  await expect(page.getByRole('alert')).toContainText('do not match'); expect(requests).toHaveLength(1);
  await page.getByLabel('Confirm password').fill('fixture password only');
  await page.getByRole('button', {name: 'Create account', exact: true}).click();
  await expect(page.getByRole('status')).toContainText('verify your email'); expect(requests[1].path).toContain('/signup');
  expect(new URLSearchParams(requests[1].path.split('?')[1]).get('redirect_to')).toBe('https://paisatrace.vercel.app/');
  await page.getByRole('button', {name: 'Set or reset password'}).click();
  await expect(page.getByLabel('Password', {exact: true})).toHaveCount(0);
  // A shared cooldown also prevents immediate repeated emails across forms.
  await expect(page.getByRole('button', {name: /Send again in/})).toBeDisabled();
  await expect(page.locator('body')).toHaveJSProperty('scrollWidth', await page.locator('body').evaluate(el => el.clientWidth));
});
