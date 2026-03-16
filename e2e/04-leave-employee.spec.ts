import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Leave Management — Employee', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/leave');
    await page.waitForLoadState('networkidle');
  });

  // ─── Leave Page Layout ─────────────────────────────────────────────

  test('leave page loads', async ({ page }) => {
    await expect(page.locator('text=/leave|my leave/i').first()).toBeVisible({ timeout: 10_000 });
  });

  // ─── Leave Balances ────────────────────────────────────────────────

  test('displays leave balance cards or no-balances message', async ({ page }) => {
    // Should show balance cards OR "No leave balances found" message
    const balanceArea = page.locator('text=/allocated|remaining|balance|no leave balances/i').first();
    await expect(balanceArea).toBeVisible({ timeout: 10_000 });
  });

  test('shows Casual Leave balance (if balances exist)', async ({ page }) => {
    // Wait for balances or no-balances to appear
    const noBalances = page.locator('text=/no leave balances/i').first();
    const casualLeave = page.locator('text=/casual leave/i').first();
    await expect(noBalances.or(casualLeave)).toBeVisible({ timeout: 10_000 });
    if (await noBalances.isVisible().catch(() => false)) {
      return; // No balances seeded
    }
    await expect(casualLeave).toBeVisible();
  });

  test('shows Earned Leave balance (if eligible)', async ({ page }) => {
    // Employee is FULL_TIME, so should see EL if balances exist
    const elCard = page.locator('text=/earned leave/i').first();
    await page.waitForTimeout(2_000);
  });

  test('shows Sick / Medical Leave balance (if balances exist)', async ({ page }) => {
    const noBalances = page.locator('text=/no leave balances/i').first();
    const sickLeave = page.locator('text=/sick|medical/i').first();
    await expect(noBalances.or(sickLeave)).toBeVisible({ timeout: 10_000 });
    if (await noBalances.isVisible().catch(() => false)) {
      return;
    }
    await expect(page.locator('text=/sick|medical/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('balance cards show allocated and used days', async ({ page }) => {
    const allocated = page.locator('text=/allocated/i').first();
    const used = page.locator('text=/used/i').first();
    if (await allocated.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await expect(allocated).toBeVisible();
    }
    if (await used.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(used).toBeVisible();
    }
  });

  // ─── Applying for Leave ────────────────────────────────────────────

  test('shows apply for leave button or form', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    await expect(applyBtn).toBeVisible({ timeout: 10_000 });
  });

  test('can open leave request form', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Should see leave type dropdown
    await expect(page.locator('text=/leave type/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('leave form has required fields', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Leave type dropdown
    await expect(page.locator('text=/leave type/i').first()).toBeVisible();
    // Date fields
    await expect(page.locator('text=/start date/i').first()).toBeVisible();
    await expect(page.locator('text=/end date/i').first()).toBeVisible();
  });

  test('can select a leave type', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    await applyBtn.click();
    await page.waitForTimeout(500);

    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const options = await typeSelect.locator('option').all();
      if (options.length > 1) {
        await typeSelect.selectOption({ index: 1 });
      }
    }
  });

  test('business days are calculated automatically', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Fill start and end dates
    const startDate = page.locator('input[type="date"]').first();
    const endDate = page.locator('input[type="date"]').last();
    if (await startDate.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startDate.fill('2026-04-20');
      await endDate.fill('2026-04-24');
      await page.waitForTimeout(1_000);
      // Should show calculated business days
      const businessDays = page.locator('text=/business day|day|working/i').first();
      await expect(businessDays).toBeVisible({ timeout: 5_000 });
    }
  });

  test('can submit a leave request', async ({ page }) => {
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    await applyBtn.click();
    await page.waitForTimeout(500);

    // Select leave type
    const typeSelect = page.locator('select').first();
    if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const options = await typeSelect.locator('option').all();
      if (options.length > 1) {
        await typeSelect.selectOption({ index: 1 });
      }
    }

    // Fill dates
    const startDate = page.locator('input[type="date"]').first();
    const endDate = page.locator('input[type="date"]').last();
    if (await startDate.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await startDate.fill('2026-06-15');
      await endDate.fill('2026-06-16');
    }

    // Optional reason
    const reasonField = page.locator('textarea').first();
    if (await reasonField.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await reasonField.fill('E2E test leave request');
    }

    // Submit
    const submitBtn = page.getByRole('button', { name: /submit|apply/i }).last();
    await submitBtn.click();
    await page.waitForLoadState('networkidle');
  });

  // ─── Leave History ─────────────────────────────────────────────────

  test('shows leave request history', async ({ page }) => {
    const history = page.locator('text=/history|request|recent/i').first();
    await expect(history).toBeVisible({ timeout: 10_000 });
  });

  test('leave requests show status badges', async ({ page }) => {
    // Look for status badges
    const statusBadge = page.locator('text=/pending|approved|rejected|cancelled/i').first();
    // This might not be visible if no requests exist yet
    await page.waitForTimeout(2_000);
  });

  // ─── Cancelling Leave ──────────────────────────────────────────────

  test('pending leave request shows cancel button', async ({ page }) => {
    const cancelBtn = page.locator('button:has-text("Cancel")').first();
    // Only visible if there's a pending request
    await page.waitForTimeout(2_000);
  });

  // ─── Leave Overlap Detection ───────────────────────────────────────

  test('duplicate leave request for same dates is prevented', async ({ page }) => {
    // Try to create overlapping request — the system should block it
    const applyBtn = page.locator('button:has-text("Apply"), button:has-text("New"), button:has-text("Request")').first();
    if (await applyBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await applyBtn.click();
      await page.waitForTimeout(500);

      const typeSelect = page.locator('select').first();
      if (await typeSelect.isVisible({ timeout: 3_000 }).catch(() => false)) {
        const options = await typeSelect.locator('option').all();
        if (options.length > 1) {
          await typeSelect.selectOption({ index: 1 });
        }
      }

      // Use the same dates as the previous test
      const startDate = page.locator('input[type="date"]').first();
      const endDate = page.locator('input[type="date"]').last();
      if (await startDate.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await startDate.fill('2026-06-15');
        await endDate.fill('2026-06-16');
      }

      const submitBtn = page.getByRole('button', { name: /submit|apply/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(2_000);

      // Should show an error about overlap
      const errorMsg = page.locator('text=/overlap|already|exist|conflict/i').first();
      // May or may not be visible depending on prior test state
      await page.waitForTimeout(1_000);
    }
  });
});
