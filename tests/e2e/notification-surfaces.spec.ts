import { test, expect } from '@playwright/test';
import { loginAs } from './auth.helpers';

test.describe('K2 notification browser surfaces', () => {
  test('Applicant login triggers user_login server action and loads dashboard', async ({ page }) => {
    const actionRequests: string[] = [];

    await page.route('**/_action*', async (route) => {
      actionRequests.push(route.request().url());
      await route.continue();
    });

    await page.route('**/_next/action*', async (route) => {
      actionRequests.push(route.request().url());
      await route.continue();
    });

    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.E2E_APPLICANT_EMAIL || '');
    await page.fill('input[name="password"]', process.env.E2E_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');

    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Your applications')).toBeVisible();
    expect(actionRequests.length).toBeGreaterThan(0);
  });

  test('Applicant dashboard exposes application and documents surfaces', async ({ page }) => {
    await loginAs(page, 'applicant');
    await page.goto('/applicant/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Your applications')).toBeVisible();
    await expect(page.locator('text=Start new application')).toBeVisible();
    await expect(page.locator('text=Upload pending documents').first()).toBeVisible();
  });

  test('Admin case communication surface is reachable from case queue', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.goto('/admin/applications');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Case Queue')).toBeVisible();
    const communicationLink = page.locator('a[href*="/admin/cases/"][href*="?tab=communication"]').first();
    await expect(communicationLink).toBeVisible();

    await communicationLink.click();
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=Type your message...')).toBeVisible();
    await expect(page.locator('text=Request Docs')).toBeVisible();
  });
});
