import { test, expect } from '@playwright/test';

test.describe('App', () => {
  test('should load with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Space/i);
  });

  test('should show header navigation', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-header')).toBeVisible();
  });

  test('should show footer', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.app-footer')).toBeVisible();
  });
});
