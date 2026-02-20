import { test, expect } from '@playwright/test';
import { mockNasaAPIs } from './helpers';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockNasaAPIs(page);
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.page-title')).toContainText('Mission Control');
  });

  test('should navigate to asteroids', async ({ page }) => {
    await page.goto('/asteroids');
    await expect(page.locator('.page-title')).toContainText('Near-Earth');
  });

  test('should navigate to mars', async ({ page }) => {
    await page.goto('/mars');
    await expect(page.locator('.page-title')).toContainText('Mars');
  });

  test('should navigate to gallery', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.locator('.page-title')).toContainText('APOD');
  });

  test('should have working nav links', async ({ page }) => {
    await page.goto('/');
    const navLinks = page.locator('.header-nav a');
    await expect(navLinks.first()).toBeVisible();
  });

  test('should navigate via header links', async ({ page }) => {
    await page.goto('/');
    await page.locator('.header-nav a', { hasText: 'Asteroids' }).click();
    await expect(page.locator('.page-title')).toContainText('Near-Earth');
    await page.locator('.header-nav a', { hasText: 'Gallery' }).click();
    await expect(page.locator('.page-title')).toContainText('APOD');
    await page.locator('.header-nav a', { hasText: 'Dashboard' }).click();
    await expect(page.locator('.page-title')).toContainText('Mission Control');
  });
});
