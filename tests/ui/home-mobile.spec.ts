import {test,expect} from '@playwright/test';
test('mobile workspace previews stay sharp, readable and within the page',async({page})=>{
 for(const width of [320,390,600]){
  await page.setViewportSize({width,height:844});await page.goto('/');
  const preview=page.locator('.hero-mobile-preview');await expect(preview).toBeVisible();
  for(const name of ['Personal Finance','Shared Expenses']){
   await page.getByRole('group',{name:'Choose workspace preview',exact:true}).getByRole('button',{name,exact:true}).click();
   await expect(preview.locator('.hero-preview-card')).toHaveCount(2);
   await expect(preview).toContainText(name==='Personal Finance'?'66,240.00':'20,300.00');
   const bounds=await preview.locator('.hero-preview-card').evaluateAll(cards=>cards.map(card=>({left:card.getBoundingClientRect().left,right:card.getBoundingClientRect().right,font:parseFloat(getComputedStyle(card.querySelector('strong')!).fontSize)})));
   for(const box of bounds){expect(box.left).toBeGreaterThanOrEqual(0);expect(box.right).toBeLessThanOrEqual(width);expect(box.font).toBeGreaterThanOrEqual(16);}
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
  const heading=await page.locator('#products h2').boundingBox();expect(heading!.x).toBeGreaterThanOrEqual(18);expect(heading!.x+heading!.width).toBeLessThanOrEqual(width);
 }
 await page.setViewportSize({width:1366,height:768});await page.goto('/');await expect(page.locator('.hero-capture picture')).toBeVisible();await expect(page.locator('.hero-mobile-preview')).toBeHidden();
});
