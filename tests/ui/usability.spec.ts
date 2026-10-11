import {logFilters,logActions} from './helpers';
import { test, expect } from '@playwright/test';

test('entry form selects the intended type and planning help is optional', async ({page}) => {
  await page.goto('/'); await page.getByRole('button',{name:'Explore the demo',exact:true}).click();
  const cards=page.locator('.overview-summary');const before=await cards.innerText();await page.getByRole('button',{name:'Money Log',exact:true}).click();
  for (const type of ['Income','Savings','Investments']) {
    await page.getByRole('button',{name:'Add entry',exact:true}).click();
    await page.getByRole('dialog').getByRole('radio',{name:type,exact:true}).check();
    await expect(page.getByRole('dialog').getByRole('radio',{name:type,exact:true})).toBeChecked();
    await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  }
  await logFilters(page);await page.getByRole('combobox',{name:'Filter category',exact:true}).selectOption({label:'Food'});
  await page.getByRole('button',{name:'Overview',exact:true}).click();await expect(cards).toHaveText(before);await page.getByRole('button',{name:'Money Log',exact:true}).click();
  await page.getByRole('button',{name:'Clear entry filters',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Filter category',exact:true})).toHaveValue('all');
  await expect(page.locator('header').getByRole('link',{name:'User guide ↗',exact:true})).toHaveAttribute('target','_blank');
  await page.getByRole('button',{name:'Money Plan',exact:true}).click();await page.getByRole('button',{name:'Edit spending plan',exact:true}).click();await expect(page.getByLabel('Percentage')).toBeHidden();await page.getByText('Percentage planning helper',{exact:true}).click();await expect(page.getByLabel('Percentage')).toBeVisible();
});
