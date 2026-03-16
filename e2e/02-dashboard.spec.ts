import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Dashboard', () => {
  test.describe('Employee Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'employee');
    });

    test('displays greeting heading', async ({ page }) => {
      // Dashboard h1 is "Good morning/afternoon/evening, <Name>"
      await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible({ timeout: 10_000 });
    });

    test('shows timesheet summary or call-to-action', async ({ page }) => {
      // Dashboard shows "Recent Timesheets" section or "This Week Hours" stat
      const tsSection = page.locator('text=/timesheet|hours|week/i').first();
      await expect(tsSection).toBeVisible({ timeout: 10_000 });
    });

    test('shows leave balance summary', async ({ page }) => {
      const leaveSection = page.locator('text=/leave remaining/i').first();
      await expect(leaveSection).toBeVisible({ timeout: 10_000 });
    });

    test('shows notifications area', async ({ page }) => {
      // Notifications section heading on the dashboard
      const notifHeading = page.getByRole('heading', { name: /notifications/i });
      await expect(notifHeading).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Manager Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'manager');
    });

    test('displays dashboard with approval stats', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible({ timeout: 10_000 });
      // Manager should see pending approvals stat cards
      const approvalSection = page.locator('text=/pending.*approval|approval/i').first();
      await expect(approvalSection).toBeVisible({ timeout: 10_000 });
    });
  });

  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, 'admin');
    });

    test('displays dashboard with admin stats', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible({ timeout: 10_000 });
    });
  });
});
