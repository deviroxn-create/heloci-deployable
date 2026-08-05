import { test, expect, type Page } from '@playwright/test';
import { loginAs } from './auth.helpers';

const routes = [
  '/communication',
  '/communication/inbox',
  '/communication/messages',
  '/communication/timeline',
  '/communication/email',
  '/communication/templates',
  '/communication/search',
  '/communication/settings',
  '/communication/analytics',
  '/communication/delivery',
];

async function verifyPages(page: Page, basePath: string) {
  for (const r of routes) {
    const url = `${basePath}${r}`;
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    // Basic smoke checks
    const header = await page.locator('text=Communication').first().count();
    expect(header).toBeGreaterThan(0);
    // Check no React hydration error text
    const hydrateError = await page.locator('text=Hydration failed').first().count();
    expect(hydrateError).toBe(0);
  }
}

test.describe('Communication hub smoke tests', () => {
  test('Platform Super Admin routes', async ({ page }) => {
    await loginAs(page, 'platform');
    await verifyPages(page, '/platform');
  });

  test('Admin routes', async ({ page }) => {
    await loginAs(page, 'admin');
    await verifyPages(page, '/admin');
  });

  test('Staff routes', async ({ page }) => {
    await loginAs(page, 'staff');
    await verifyPages(page, '/staff');
  });

  test('Applicant routes', async ({ page }) => {
    await loginAs(page, 'applicant');
    await verifyPages(page, '/applicant');
  });
});
