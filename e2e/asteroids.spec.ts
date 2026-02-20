import { test, expect } from '@playwright/test';
import { mockNasaAPIs } from './helpers';

test.describe('Asteroids', () => {
  test.beforeEach(async ({ page }) => {
    await mockNasaAPIs(page);
    await page.goto('/asteroids');
  });

  test('should show page title', async ({ page }) => {
    await expect(page.locator('.page-title')).toContainText('Near-Earth Objects');
  });

  test('should show filter buttons', async ({ page }) => {
    await expect(page.locator('.filter-btn').first()).toBeVisible();
    const filterButtons = page.locator('.filter-btn');
    await expect(filterButtons).toHaveCount(4);
  });

  test('should show table rows for NEOs', async ({ page }) => {
    await expect(page.locator('.table-row').first()).toBeVisible();
  });

  test('should filter hazardous asteroids', async ({ page }) => {
    await page.locator('.filter-btn', { hasText: 'Hazardous' }).click();
    await expect(page.locator('.filter-btn', { hasText: 'Hazardous' })).toHaveClass(/active/);
    // One hazardous asteroid in mock data
    await expect(page.locator('.table-row')).toHaveCount(1);
  });

  test('should show PHA badge for hazardous asteroids', async ({ page }) => {
    await expect(page.locator('.pha-badge').first()).toBeVisible();
  });
});
