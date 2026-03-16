import { test, expect } from '@playwright/test';
import { login, type UserKey } from './helpers/auth';

test.describe('Navigation & Sidebar', () => {
  // ─── Employee Navigation ───────────────────────────────────────────

  test.describe('Employee sidebar', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'employee');
    });

    test('sidebar shows Dashboard link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /dashboard/i }).first()).toBeVisible();
    });

    test('sidebar shows My Timesheet link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /timesheet/i }).first()).toBeVisible();
    });

    test('sidebar shows My Leave link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /leave/i }).first()).toBeVisible();
    });

    test('sidebar shows Help link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /help/i }).first()).toBeVisible();
    });

    test('sidebar does NOT show Approvals link', async ({ page }) => {
      const approvals = page.locator('nav a, nav button').filter({ hasText: /^approvals$/i });
      await expect(approvals).toHaveCount(0);
    });

    test('sidebar does NOT show Reports link', async ({ page }) => {
      const reports = page.locator('nav a, nav button').filter({ hasText: /^reports$/i });
      await expect(reports).toHaveCount(0);
    });

    test('sidebar does NOT show Admin link', async ({ page }) => {
      const admin = page.locator('nav a, nav button').filter({ hasText: /^admin$/i });
      await expect(admin).toHaveCount(0);
    });

    test('clicking Timesheet navigates to /timesheet', async ({ page }) => {
      await page.locator('nav a, nav button').filter({ hasText: /timesheet/i }).first().click();
      await page.waitForURL('/timesheet**');
    });

    test('clicking Leave navigates to /leave', async ({ page }) => {
      await page.locator('nav a, nav button').filter({ hasText: /leave/i }).first().click();
      await page.waitForURL('/leave**');
    });

    test('clicking Help navigates to /help', async ({ page }) => {
      await page.locator('nav a, nav button').filter({ hasText: /help/i }).first().click();
      await page.waitForURL('/help');
    });
  });

  // ─── Manager Navigation ────────────────────────────────────────────

  test.describe('Manager sidebar', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'manager');
    });

    test('sidebar shows Approvals link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /approval/i }).first()).toBeVisible();
    });

    test('sidebar shows Reports link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /report/i }).first()).toBeVisible();
    });

    test('sidebar does NOT show Admin link', async ({ page }) => {
      const admin = page.locator('nav a, nav button').filter({ hasText: /^admin$/i });
      await expect(admin).toHaveCount(0);
    });

    test('clicking Approvals navigates to /approvals', async ({ page }) => {
      await page.locator('nav a, nav button').filter({ hasText: /approval/i }).first().click();
      await page.waitForURL('/approvals**');
    });
  });

  // ─── Admin Navigation ──────────────────────────────────────────────

  test.describe('Admin sidebar', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'admin');
    });

    test('sidebar shows Admin link', async ({ page }) => {
      await expect(page.locator('nav a, nav button').filter({ hasText: /admin/i }).first()).toBeVisible();
    });

    test('sidebar shows all navigation items', async ({ page }) => {
      for (const item of ['Dashboard', 'Timesheet', 'Leave', 'Approval', 'Report', 'Admin', 'Help']) {
        const link = page.locator('nav a, nav button').filter({ hasText: new RegExp(item, 'i') }).first();
        await expect(link).toBeVisible();
      }
    });

    test('clicking Admin navigates to /admin', async ({ page }) => {
      await page.locator('nav a, nav button').filter({ hasText: /admin/i }).first().click();
      await page.waitForURL('/admin');
    });
  });

  // ─── Notification Bell ─────────────────────────────────────────────

  test('notification bell is visible in header', async ({ page }) => {
    await login(page, 'employee');
    const bell = page.locator('[aria-label*="notification" i], button:has(svg)').first();
    await expect(bell).toBeVisible({ timeout: 5_000 });
  });

  // ─── Profile / Avatar ──────────────────────────────────────────────

  test('user avatar/profile is visible in header', async ({ page }) => {
    await login(page, 'employee');
    const avatar = page.locator('[aria-label="User menu"], [data-testid="avatar"], img[alt*="avatar" i], button:has-text("Employee")').first();
    await expect(avatar).toBeVisible({ timeout: 5_000 });
  });
});
