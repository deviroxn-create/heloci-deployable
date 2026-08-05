import { test, expect } from '@playwright/test';

test.describe('Registration notification browser flow', () => {
  test('Applicant registration triggers server action and shows success state', async ({ page }) => {
    const email = `e2e-register-${Date.now()}@resend.dev`;
    const password = 'Test1234!';
    const actionUrls: string[] = [];

    page.on('console', (msg) => {
      console.log('PAGE CONSOLE>', msg.text());
    });
    page.on('pageerror', (error) => {
      console.log('PAGE ERROR>', error.message);
    });
    page.on('requestfailed', (request) => {
      console.log('REQUEST FAILED>', request.url(), request.failure()?.errorText);
    });
    page.on('request', (request) => {
      if (request.method() === 'POST') {
        actionUrls.push(request.url());
        console.log('POST', request.url());
      }
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (route.request().method() === 'POST' && url.includes('/auth/v1/signup')) {
        console.log('STUBBED supabase signUp request', url);
        await route.fulfill({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: { session: null, user: null }, error: null })
        });
        return;
      }

      await route.continue();
    });

    await page.route('**/_action*', async (route) => {
      actionUrls.push(route.request().url());
      await route.continue();
    });
    await page.route('**/_next/action*', async (route) => {
      actionUrls.push(route.request().url());
      await route.continue();
    });

    await page.goto('/register');
    await page.fill('input[name="fullName"]', 'E2E Register User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);
    await page.click('button[type="submit"]');

    const emailConfirmation = page.locator('text=Check your email');
    const dashboardReady = page.locator('text=Your applications');

    const success = await Promise.any([
      emailConfirmation.waitFor({ state: 'visible', timeout: 30000 }),
      dashboardReady.waitFor({ state: 'visible', timeout: 30000 }),
      page.waitForURL('**/login', { timeout: 30000 }),
    ]).catch(() => null);

    expect(success).not.toBeNull();
    expect(actionUrls.some((url) => url.includes('_action') || url.includes('/_next/action') || url.includes('/register'))).toBe(true);
  });
});
