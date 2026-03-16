import { type Page, expect } from '@playwright/test';

/**
 * Shared authentication helpers for Playwright E2E tests.
 *
 * Test accounts (from seed):
 *   admin@acme.com     / Password123!  (ADMIN)
 *   manager@acme.com   / Password123!  (MANAGER)
 *   employee@acme.com  / Password123!  (EMPLOYEE)
 */

export const USERS = {
  admin: { email: 'admin@acme.com', password: 'Password123!', role: 'ADMIN' },
  manager: { email: 'manager@acme.com', password: 'Password123!', role: 'MANAGER' },
  employee: { email: 'employee@acme.com', password: 'Password123!', role: 'EMPLOYEE' },
} as const;

export type UserKey = keyof typeof USERS;

/**
 * Login with the given test user and wait for the dashboard to load.
 */
export async function login(page: Page, userKey: UserKey) {
  const { email, password } = USERS[userKey];

  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill form using input ids (generated from label text by Input component)
  const emailInput = page.locator('#email');
  const passwordInput = page.locator('#password');

  await emailInput.waitFor({ state: 'visible', timeout: 10_000 });
  await emailInput.click();
  await emailInput.fill(email);
  await passwordInput.click();
  await passwordInput.fill(password);

  // Click sign-in and wait for API response + navigation
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/auth/login') && resp.request().method() === 'POST',
      { timeout: 15_000 },
    ),
    page.getByRole('button', { name: /sign\s*in/i }).click(),
  ]);

  // If login API succeeded, wait for SPA navigation away from /login
  if (response.ok()) {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
  } else {
    throw new Error(`Login API returned ${response.status()}`);
  }
}

/**
 * Logout the current user.
 */
export async function logout(page: Page) {
  // Click avatar / profile dropdown, then logout
  const avatar = page.locator('[aria-label="User menu"], [data-testid="avatar"], button:has(img[alt])').first();
  if (await avatar.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await avatar.click();
    const logoutBtn = page.locator('button:has-text("Log out"), button:has-text("Logout"), button:has-text("Sign out")').first();
    if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/login/, { timeout: 10_000 });
      return;
    }
  }
  // Fallback: clear auth state and navigate to login
  await page.evaluate(() => localStorage.removeItem('accessToken'));
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
}

/**
 * Helper to get today's date formatted as YYYY-MM-DD.
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Helper to get the Monday of the current week as YYYY-MM-DD.
 */
export function currentWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}
