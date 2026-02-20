import { test, expect } from '@playwright/test';
import { mockNasaAPIs } from './helpers';

test.describe('Mars', () => {
  test.beforeEach(async ({ page }) => {
    await mockNasaAPIs(page);
    await page.goto('/mars');
  });

  test('should show page title', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('Mars Rover Gallery');
  });

  test('should show rover tabs', async ({ page }) => {
    await expect(page.locator('.rover-tab').first()).toBeVisible();
    const tabs = page.locator('.rover-tab');
    await expect(tabs).toHaveCount(3);
  });

  test('should show Curiosity tab active by default', async ({ page }) => {
    await expect(page.locator('.rover-tab', { hasText: 'Curiosity' })).toHaveClass(/active/);
  });

  test('should show photo cards', async ({ page }) => {
    await expect(page.locator('.photo-card').first()).toBeVisible();
  });

  test('should switch rover tabs', async ({ page }) => {
    await page.locator('.rover-tab', { hasText: 'Perseverance' }).click();
    await expect(page.locator('.rover-tab', { hasText: 'Perseverance' })).toHaveClass(/active/);
  });
});
