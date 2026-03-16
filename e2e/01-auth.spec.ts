import { test, expect } from '@playwright/test';
import { login, logout, USERS } from './helpers/auth';

test.describe('Authentication', () => {
  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign\s*in/i })).toBeVisible();
  });

  test('rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('invalid@acme.com');
    await page.locator('#password').fill('wrongpassword');

    // Click sign-in and wait for the API response
    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/auth/login') && resp.request().method() === 'POST',
        { timeout: 10_000 },
      ),
      page.getByRole('button', { name: /sign\s*in/i }).click(),
    ]);

    // API should return 401 and page should stay on login
    expect(response.status()).toBeGreaterThanOrEqual(400);
    await expect(page).toHaveURL(/login/);

    // Error toast appears with role="alert"
    await expect(page.locator('[role="alert"]').first()).toBeVisible({ timeout: 5_000 });
  });

  test('employee can login and reaches dashboard', async ({ page }) => {
    await login(page, 'employee');
    await expect(page).not.toHaveURL(/login/);
  });

  test('manager can login and reaches dashboard', async ({ page }) => {
    await login(page, 'manager');
    await expect(page).not.toHaveURL(/login/);
  });

  test('admin can login and reaches dashboard', async ({ page }) => {
    await login(page, 'admin');
    await expect(page).not.toHaveURL(/login/);
  });

  test('unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/timesheet');
    await expect(page).toHaveURL(/login/);
  });

  test('logout redirects to login page', async ({ page }) => {
    await login(page, 'employee');
    await logout(page);
    await expect(page).toHaveURL(/login/);
  });
});
