import { test, expect } from '@playwright/test';
import { mockNasaAPIs } from './helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockNasaAPIs(page);
    await page.goto('/');
  });

  test('should show stats row', async ({ page }) => {
    await expect(page.locator('.stats-row').first()).toBeVisible();
    await expect(page.locator('.stat-card').first()).toBeVisible();
  });

  test('should display stat values', async ({ page }) => {
    await expect(page.locator('.stat-value').first()).toBeVisible();
  });

  test('should show APOD card', async ({ page }) => {
    await expect(page.locator('.apod-card')).toBeVisible();
  });

  test('should show ISS tracker', async ({ page }) => {
    await expect(page.locator('.iss-card')).toBeVisible();
  });

  test('should show NEO card', async ({ page }) => {
    await expect(page.locator('.neo-card')).toBeVisible();
  });

  test('should show glass cards', async ({ page }) => {
    await expect(page.locator('.glass-card').first()).toBeVisible();
  });
});
