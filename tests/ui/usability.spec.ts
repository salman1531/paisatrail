import { test, expect } from '@playwright/test';

test('entry shortcuts select the intended type and planning help is optional', async ({page}) => {
  await page.goto('/'); await page.getByRole('button',{name:'Explore the demo',exact:true}).click();
  for (const [shortcut, type] of [['Add income','Income'],['Add savings','Savings'],['Add investment','Investments']]) {
    await page.getByRole('button',{name:shortcut,exact:true}).click();
    await expect(page.getByRole('dialog').getByRole('radio',{name:type,exact:true})).toBeChecked();
    await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
  }
  const cards=page.locator('.overview-summary'); const before=await cards.innerText();
  await page.getByRole('combobox',{name:'Filter category',exact:true}).selectOption({label:'Food'});
  await expect(cards).toHaveText(before);
  await page.getByRole('button',{name:'Clear entry filters',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Filter category',exact:true})).toHaveValue('all');
  await expect(page.locator('header').getByRole('link',{name:'User guide ↗',exact:true})).toHaveAttribute('target','_blank');
  await page.getByRole('button',{name:'Goals',exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Planning example',exact:true})).toBeHidden();
  await page.getByText('Need help splitting your earnings?',{exact:true}).click();
  await expect(page.getByRole('combobox',{name:'Planning example',exact:true})).toBeVisible();
});
