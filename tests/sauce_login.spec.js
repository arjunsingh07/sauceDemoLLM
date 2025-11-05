import { test, expect } from '@playwright/test';

test('Sauce Demo Test', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.saucedemo.com/');
  
  await page.fill('input#user-name', 'standard_user');
  await page.fill('input#password', 'secret_sauce');
  await page.click('input[type="submit"]');
  
  await expect(page).toHaveURL(/.*inventory/);
  
  await page.click('text=Sauce Labs Backpack');
  await page.click('text=Add to cart');
  
  const cartBadge = await page.locator('.shopping_cart_badge');
  await expect(cartBadge).toHaveText('1');
  
  await page.waitForTimeout(60000);
  
  await context.close();
});