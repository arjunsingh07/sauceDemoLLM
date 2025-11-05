import { test, expect } from '@playwright/test';

test('SauceDemo login and add to cart', async ({ page }) => {
  await page.goto('https://www.saucedemo.com/');
  await page.fill('#user-name', 'standard_user');
  await page.fill('#password', 'secret_sauce');
  await page.click('.btn_action');
  
  await expect(page).toHaveURL(/\/inventory\.html/);
  
  await page.click('text=Sauce Labs Backpack');
  await page.click('.btn_primary');
  
  const cartBadge = await page.locator('.shopping_cart_badge');
  await expect(cartBadge).toHaveText('1');
  
  await page.close();
});