import {go,record} from './helpers';
import {logFilters,logActions} from './helpers';
import { test, expect } from '@playwright/test';

test('entry form selects the intended type and planning help is optional', async ({page}) => {
  await page.goto('/demo/overview');
  const cards=page.locator('.overview-summary');const before=await cards.textContent();await go(page,'Money Log');
  for (const type of ['Income','Savings','Investments']) {
    await record(page,'expense');
    await page.getByRole('dialog').getByRole('radio',{name:type,exact:true}).check();
    await expect(page.getByRole('dialog').getByRole('radio',{name:type,exact:true})).toBeChecked();
    await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  }
  await logFilters(page);await page.getByRole('combobox',{name:'Filter category',exact:true}).selectOption({label:'Food'});
  await go(page,'Overview');await expect(cards).toHaveText(before);await go(page,'Money Log');
  await page.getByRole('button',{name:'Clear entry filters',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Filter category',exact:true})).toHaveValue('all');
  await page.locator('.workspace-account-menu summary').click();await expect(page.locator('.workspace-account-menu').getByRole('link',{name:'Help & guide',exact:true})).toHaveAttribute('href','/guide');await page.locator('.workspace-account-menu summary').press('Escape');
  await go(page,'Money Plan');await page.getByRole('button',{name:'Edit',exact:true}).click();await expect(page.getByLabel('Percentage')).toBeHidden();await page.getByText('More options',{exact:true}).click();await expect(page.getByLabel('Percentage')).toBeVisible();
});
