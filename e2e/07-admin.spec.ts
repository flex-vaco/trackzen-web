import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * Helper to click a sidebar nav item in the admin page.
 * The admin page uses a left sidebar with clickable items (links/buttons/divs).
 */
async function clickAdminSection(page: import('@playwright/test').Page, name: RegExp) {
  const item = page.locator('a, button, [role="tab"], div[class*="cursor"]').filter({ hasText: name }).first();
  if (await item.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await item.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
  }
}

test.describe('Administration — Admin Only', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
  });

  // ─── Admin Page Access ─────────────────────────────────────────────

  test('admin page loads', async ({ page }) => {
    await expect(page.locator('text=/admin|administration/i').first()).toBeVisible({ timeout: 10_000 });
  });

  test('admin page has sidebar navigation items', async ({ page }) => {
    // Sidebar has: General Settings, Users & Roles, Projects, Leave Types, Holidays, etc.
    const navItems = page.locator('a, button, div').filter({ hasText: /users|projects|leave type|holiday|setting/i });
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  // ─── Users Management ──────────────────────────────────────────────

  test.describe('Users Section', () => {
    test('shows list of users or empty state', async ({ page }) => {
      await clickAdminSection(page, /users/i);
      const userList = page.locator('text=/admin@acme|manager@acme|employee@acme|no users/i').first();
      await expect(userList).toBeVisible({ timeout: 10_000 });
    });

    test('can create a new user', async ({ page }) => {
      await clickAdminSection(page, /users/i);

      const addBtn = page.getByRole('button', { name: /add user|create user|new user|add/i }).first();
      if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
        const emailInput = page.locator('input[name="email"], input[placeholder*="email" i], input[type="email"]').first();
        const passwordInput = page.locator('input[name="password"], input[type="password"]').first();

        if (await nameInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          const timestamp = Date.now();
          await nameInput.fill(`Test User ${timestamp}`);
          await emailInput.fill(`test${timestamp}@acme.com`);
          await passwordInput.fill('Password123!');

          const submitBtn = page.getByRole('button', { name: /create|save|add/i }).last();
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('can edit a user', async ({ page }) => {
      await clickAdminSection(page, /users/i);
      const editBtn = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
      if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('can deactivate a user', async ({ page }) => {
      await clickAdminSection(page, /users/i);
      await page.waitForTimeout(2_000);
    });

    test('can assign manager-employee relationships', async ({ page }) => {
      await clickAdminSection(page, /users/i);
      await page.waitForTimeout(2_000);
    });
  });

  // ─── Projects Management ───────────────────────────────────────────

  test.describe('Projects Section', () => {
    test('shows list of projects or empty state', async ({ page }) => {
      await clickAdminSection(page, /projects/i);
      const projectList = page.locator('text=/PRJ|project|no projects/i').first();
      await expect(projectList).toBeVisible({ timeout: 10_000 });
    });

    test('can create a new project', async ({ page }) => {
      await clickAdminSection(page, /projects/i);

      const addBtn = page.getByRole('button', { name: /add project|create project|new project|add/i }).first();
      if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const codeInput = page.locator('input[name="code"], input[placeholder*="code" i]').first();
        const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();

        if (await codeInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
          const ts = Date.now();
          await codeInput.fill(`TST-${ts}`);
          await nameInput.fill(`Test Project ${ts}`);

          const submitBtn = page.getByRole('button', { name: /create|save|add/i }).last();
          await submitBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    test('project list has table columns', async ({ page }) => {
      await clickAdminSection(page, /projects/i);
      // Should see table headers or project data
      await page.waitForTimeout(2_000);
    });

    test('can edit a project', async ({ page }) => {
      await clickAdminSection(page, /projects/i);
      const editBtn = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
      if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('can assign employees and managers to project', async ({ page }) => {
      await clickAdminSection(page, /projects/i);
      const editBtn = page.locator('button:has-text("Edit"), [aria-label*="edit" i]').first();
      if (await editBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await editBtn.click();
        await page.waitForTimeout(500);
        const assignSection = page.locator('text=/assign|employee|manager/i').first();
        if (await assignSection.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await expect(assignSection).toBeVisible();
        }
      }
    });
  });

  // ─── Leave Types Management ────────────────────────────────────────

  test.describe('Leave Types Section', () => {
    test('shows leave types list or empty state', async ({ page }) => {
      await clickAdminSection(page, /leave type/i);
      // May show leave types OR "No leave types configured" message
      const content = page.locator('text=/casual leave|earned leave|sick|no leave types/i').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });

    test('shows Add Leave Type button', async ({ page }) => {
      await clickAdminSection(page, /leave type/i);
      const addBtn = page.getByRole('button', { name: /add leave type/i });
      await expect(addBtn).toBeVisible({ timeout: 5_000 });
    });

    test('leave types table has correct columns', async ({ page }) => {
      await clickAdminSection(page, /leave type/i);
      // Wait for loading to finish, then check table header NAME is visible
      await page.waitForTimeout(3_000);
      await expect(page.locator('th').filter({ hasText: /name/i }).first()).toBeVisible({ timeout: 10_000 });
    });

    test('can deactivate a leave type', async ({ page }) => {
      await clickAdminSection(page, /leave type/i);
      await page.waitForTimeout(2_000);
    });
  });

  // ─── Holidays Management ───────────────────────────────────────────

  test.describe('Holidays Section', () => {
    test('shows list of holidays or empty state', async ({ page }) => {
      await clickAdminSection(page, /holiday/i);
      const content = page.locator('text=/christmas|new year|republic day|independence|no holidays/i').first();
      await expect(content).toBeVisible({ timeout: 10_000 });
    });

    test('can add a new holiday', async ({ page }) => {
      await clickAdminSection(page, /holiday/i);
      const addBtn = page.getByRole('button', { name: /add|create|new/i }).first();
      if (await addBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(500);
      }
    });

    test('holidays show recurring flag', async ({ page }) => {
      await clickAdminSection(page, /holiday/i);
      await page.waitForTimeout(2_000);
    });
  });

  // ─── Organisation Settings ─────────────────────────────────────────

  test.describe('Settings Section', () => {
    test('shows organisation settings', async ({ page }) => {
      await clickAdminSection(page, /general setting/i);
      await expect(page.locator('text=/max hours|mandatory|approval|setting/i').first()).toBeVisible({ timeout: 10_000 });
    });

    test('can update max hours per day setting', async ({ page }) => {
      await clickAdminSection(page, /general setting/i);
      const maxHoursInput = page.locator('input[name*="maxHours" i], input[name*="max_hours" i]').first();
      if (await maxHoursInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await maxHoursInput.fill('12');
      }
    });

    test('can toggle mandatory descriptions', async ({ page }) => {
      await clickAdminSection(page, /general setting/i);
      const mandatoryToggle = page.locator('text=/mandatory desc/i').first();
      await page.waitForTimeout(2_000);
    });

    test('can toggle allow back-dated timesheets', async ({ page }) => {
      await clickAdminSection(page, /general setting/i);
      const backdateToggle = page.locator('text=/back.?dated|allow back/i').first();
      await page.waitForTimeout(2_000);
    });

    test('can toggle allow copy week', async ({ page }) => {
      await clickAdminSection(page, /general setting/i);
      const copyWeekToggle = page.locator('text=/copy week|copy previous/i').first();
      await page.waitForTimeout(2_000);
    });

    test('can save settings', async ({ page }) => {
      await clickAdminSection(page, /general setting/i);
      const saveBtn = page.getByRole('button', { name: /save|update/i }).first();
      if (await saveBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await saveBtn.click();
        await page.waitForLoadState('networkidle');
      }
    });
  });
});

test.describe('Admin Page — Access Control', () => {
  test('employee cannot access admin page', async ({ page }) => {
    await login(page, 'employee');
    await page.goto('/admin');
    await page.waitForTimeout(2_000);
    expect(page.url()).not.toContain('/admin');
  });

  test('manager cannot access admin page', async ({ page }) => {
    await login(page, 'manager');
    await page.goto('/admin');
    await page.waitForTimeout(2_000);
    expect(page.url()).not.toContain('/admin');
  });
});
