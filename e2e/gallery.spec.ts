import { test, expect } from '@playwright/test';
import { mockNasaAPIs } from './helpers';

test.describe('Gallery', () => {
  test.beforeEach(async ({ page }) => {
    await mockNasaAPIs(page);
    await page.goto('/gallery');
  });

  test('should display gallery grid', async ({ page }) => {
    await expect(page.locator('.gallery-grid')).toBeVisible();
  });

  test('should show gallery items', async ({ page }) => {
    await expect(page.locator('.gallery-item').first()).toBeVisible();
  });

  test('should open lightbox on click', async ({ page }) => {
    await page.locator('.gallery-item').first().click();
    await expect(page.locator('.lightbox')).toBeVisible();
  });

  test('should close lightbox', async ({ page }) => {
    await page.locator('.gallery-item').first().click();
    await expect(page.locator('.lightbox')).toBeVisible();
    await page.locator('.lightbox-close').click();
    await expect(page.locator('.lightbox')).not.toBeVisible();
  });
});
