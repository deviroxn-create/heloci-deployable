import { Page } from '@playwright/test';

export async function loginAs(page: Page, role: 'platform'|'admin'|'staff'|'applicant') {
  // This helper expects env vars: E2E_PLATFORM_EMAIL, E2E_ADMIN_EMAIL, E2E_STAFF_EMAIL, E2E_APPLICANT_EMAIL
  // and a shared password E2E_TEST_PASSWORD. The app must accept email/password auth at /login.
  const emailEnvMap: Record<string,string> = {
    platform: process.env.E2E_PLATFORM_EMAIL || '',
    admin: process.env.E2E_ADMIN_EMAIL || '',
    staff: process.env.E2E_STAFF_EMAIL || '',
    applicant: process.env.E2E_APPLICANT_EMAIL || '',
  };
  const email = emailEnvMap[role];
  const password = process.env.E2E_TEST_PASSWORD || '';
  if (!email || !password) throw new Error('E2E credentials not set in environment');

  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for navigation to dashboard or communication
  await page.waitForLoadState('networkidle');
}
