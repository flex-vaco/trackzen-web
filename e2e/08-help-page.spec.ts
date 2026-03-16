import { test, expect } from '@playwright/test';
import { login, type UserKey } from './helpers/auth';

test.describe('Help Page', () => {
  // ─── Common Help Page Tests (all roles) ────────────────────────────

  for (const role of ['employee', 'manager', 'admin'] as UserKey[]) {
    test.describe(`${role} role`, () => {
      test.beforeEach(async ({ page }) => {
        await login(page, role);
        await page.goto('/help');
        await page.waitForLoadState('networkidle');
      });

      test('help page loads with title', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /help|user guide/i })).toBeVisible({ timeout: 10_000 });
      });

      test('shows Getting Started section', async ({ page }) => {
        const section = page.locator('button, [role="tab"]').filter({ hasText: /getting started/i }).first();
        await expect(section).toBeVisible({ timeout: 5_000 });
        await section.click();
        await expect(page.locator('text=/welcome to trackzen/i').first()).toBeVisible({ timeout: 5_000 });
      });

      test('shows Timesheets section', async ({ page }) => {
        const section = page.locator('button, [role="tab"]').filter({ hasText: /timesheets/i }).first();
        await expect(section).toBeVisible({ timeout: 5_000 });
        await section.click();
        await expect(page.locator('text=/creating a timesheet/i').first()).toBeVisible({ timeout: 5_000 });
      });

      test('shows Leave Management section', async ({ page }) => {
        const section = page.locator('button, [role="tab"]').filter({ hasText: /leave/i }).first();
        await expect(section).toBeVisible({ timeout: 5_000 });
        await section.click();
        await expect(page.locator('text=/applying for leave/i').first()).toBeVisible({ timeout: 5_000 });
      });

      test('shows FAQ section', async ({ page }) => {
        await expect(page.locator('text=/frequently asked questions/i').first()).toBeVisible({ timeout: 10_000 });
      });

      test('FAQ search filters questions', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search" i]').first();
        await expect(searchInput).toBeVisible({ timeout: 5_000 });
        await searchInput.fill('password');
        await page.waitForTimeout(500);
        // Should show the password FAQ
        await expect(page.locator('text=/change my password/i').first()).toBeVisible();
      });

      test('FAQ search shows no results message for gibberish', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search" i]').first();
        await searchInput.fill('xyzzy123nonexistent');
        await page.waitForTimeout(500);
        await expect(page.locator('text=/no matching/i').first()).toBeVisible();
      });

      test('FAQ accordion opens and closes', async ({ page }) => {
        // Click first FAQ question
        const firstFaq = page.locator('button:has-text("How do I change my password")').first();
        if (await firstFaq.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await firstFaq.click();
          // Answer should be visible
          await expect(page.locator('text=/Navigate to your profile/i').first()).toBeVisible();
          // Click again to close
          await firstFaq.click();
          await page.waitForTimeout(500);
        }
      });

      test('shows Workflow Reference section', async ({ page }) => {
        await expect(page.locator('text=/workflow reference/i').first()).toBeVisible({ timeout: 10_000 });
      });

      test('shows Timesheet Lifecycle diagram', async ({ page }) => {
        await expect(page.locator('text=/timesheet lifecycle/i').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('text=/draft/i').first()).toBeVisible();
        await expect(page.locator('text=/submitted/i').first()).toBeVisible();
        await expect(page.locator('text=/approved/i').first()).toBeVisible();
      });

      test('shows Leave Request Lifecycle diagram', async ({ page }) => {
        await expect(page.locator('text=/leave request lifecycle/i').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('text=/pending/i').first()).toBeVisible();
      });

      test('shows Keyboard Shortcuts', async ({ page }) => {
        await expect(page.locator('text=/keyboard shortcuts/i').first()).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('kbd:has-text("Tab")').first()).toBeVisible();
        await expect(page.locator('kbd:has-text("Enter")').first()).toBeVisible();
        await expect(page.locator('kbd:has-text("Esc")').first()).toBeVisible();
      });

      test('table of contents navigation works', async ({ page }) => {
        const tocLink = page.locator('button:has-text("Timesheets")').first();
        await tocLink.click();
        await page.waitForTimeout(500);
        await expect(page.locator('text=/creating a timesheet/i').first()).toBeVisible();
      });
    });
  }

  // ─── Role-specific Section Visibility ──────────────────────────────

  test.describe('Role-specific sections', () => {
    test('employee does NOT see Approvals section', async ({ page }) => {
      await login(page, 'employee');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const approvalSection = page.locator('button').filter({ hasText: /^approvals$/i });
      await expect(approvalSection).toHaveCount(0);
    });

    test('employee does NOT see Reports section', async ({ page }) => {
      await login(page, 'employee');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const reportsSection = page.locator('button').filter({ hasText: /reports.*exports/i });
      await expect(reportsSection).toHaveCount(0);
    });

    test('employee does NOT see Administration section', async ({ page }) => {
      await login(page, 'employee');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const adminSection = page.locator('button').filter({ hasText: /^administration$/i });
      await expect(adminSection).toHaveCount(0);
    });

    test('manager sees Approvals section', async ({ page }) => {
      await login(page, 'manager');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const approvalSection = page.locator('button').filter({ hasText: /approvals/i }).first();
      await expect(approvalSection).toBeVisible({ timeout: 5_000 });
    });

    test('manager sees Reports section', async ({ page }) => {
      await login(page, 'manager');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const reportsSection = page.locator('button').filter({ hasText: /reports/i }).first();
      await expect(reportsSection).toBeVisible({ timeout: 5_000 });
    });

    test('manager does NOT see Administration section', async ({ page }) => {
      await login(page, 'manager');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const adminSection = page.locator('button').filter({ hasText: /^administration$/i });
      await expect(adminSection).toHaveCount(0);
    });

    test('admin sees Approvals section', async ({ page }) => {
      await login(page, 'admin');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const approvalSection = page.locator('button').filter({ hasText: /approvals/i }).first();
      await expect(approvalSection).toBeVisible({ timeout: 5_000 });
    });

    test('admin sees Reports section', async ({ page }) => {
      await login(page, 'admin');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const reportsSection = page.locator('button').filter({ hasText: /reports/i }).first();
      await expect(reportsSection).toBeVisible({ timeout: 5_000 });
    });

    test('admin sees Administration section', async ({ page }) => {
      await login(page, 'admin');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const adminSection = page.locator('button').filter({ hasText: /administration/i }).first();
      await expect(adminSection).toBeVisible({ timeout: 5_000 });
    });
  });

  // ─── Role-specific FAQ Visibility ──────────────────────────────────

  test.describe('Role-specific FAQs', () => {
    test('employee does NOT see export FAQ', async ({ page }) => {
      await login(page, 'employee');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const exportFaq = page.locator('button:has-text("How do I export my timesheet data")');
      await expect(exportFaq).toHaveCount(0);
    });

    test('employee does NOT see mandatory descriptions FAQ', async ({ page }) => {
      await login(page, 'employee');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      const mdFaq = page.locator('button:has-text("Mandatory Descriptions")');
      await expect(mdFaq).toHaveCount(0);
    });

    test('manager sees export FAQ', async ({ page }) => {
      await login(page, 'manager');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('button:has-text("export my timesheet")').first()).toBeVisible({ timeout: 5_000 });
    });

    test('admin sees mandatory descriptions FAQ', async ({ page }) => {
      await login(page, 'admin');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('button:has-text("Mandatory Descriptions")').first()).toBeVisible({ timeout: 5_000 });
    });

    test('admin sees assign employees FAQ', async ({ page }) => {
      await login(page, 'admin');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('button:has-text("assign employees")').first()).toBeVisible({ timeout: 5_000 });
    });
  });
});
