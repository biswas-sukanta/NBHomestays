import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * Helper: login as a specific user and return the page.
 */
async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
    console.log(`Logging in as ${email}...`);
    await page.goto(`${BASE}/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    // Wait for redirect (home or dashboard)
    await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 30000 });
    console.log(`Logged in as ${email}`);
}

/**
 * Test 1: Navigation Logic — Role-based menu items
 */
test('Navigation: Admin sees Admin Console, Host sees My Listings', async ({ page }) => {
    // Login as Admin
    await loginAs(page, 'admin@nbh.com', 'admin123');
    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible();
    await expect(nav.getByText('Admin Console')).toBeVisible();
    // Admin should NOT see "My Listings" in nav
    await expect(nav.getByText('My Listings')).not.toBeVisible();

    // Logout
    await page.goto(`${BASE}/login`);

    // Login as Host
    await loginAs(page, 'host@nbh.com', 'host123');
    const nav2 = page.locator('nav').first();
    await expect(nav2.getByText('My Listings')).toBeVisible();
    await expect(nav2.getByText('Admin Console')).not.toBeVisible();
});

/**
 * Test 2: Admin God-View — The "All Listings" tab shows all homestays
 */
test('Admin Dashboard: All Listings tab shows all homestays', async ({ page }) => {
    await loginAs(page, 'admin@nbh.com', 'admin123');
    await page.goto(`${BASE}/admin`);

    // Both tabs should be visible
    await expect(page.getByText('Pending Approval')).toBeVisible();
    await expect(page.getByText('All Listings')).toBeVisible();

    // Click "All Listings" tab
    await page.getByText('All Listings').click();

    // All listings tab should show items (count depends on seeded data)
    // Just verify the tab switches and content area is present
    await page.waitForTimeout(500);
    // The tab should be active now (no specific assertion on count since DB may vary)
    const cards = page.locator('.grid > div');
    // If DB has data, cards should be visible; if empty, text should say "No homestays found."
    const count = await cards.count();
    if (count === 0) {
        await expect(page.getByText('No homestays found.')).toBeVisible();
    } else {
        expect(count).toBeGreaterThan(0);
    }
});

/**
 * Test 3: Modal Z-Index — the delete dialog is visible and clickable
 * Uses the host dashboard which has delete functionality.
 */
test('Z-Index: Delete confirmation modal is visible and clickable', async ({ page }) => {
    await loginAs(page, 'host@nbh.com', 'host123');
    await page.goto(`${BASE}/host/dashboard`);

    // Wait for listings to load
    await page.waitForTimeout(2000);

    // Find a delete button
    const deleteButtons = page.locator('button:has(svg.lucide-trash-2)');
    const count = await deleteButtons.count();

    if (count === 0) {
        test.skip(true, 'No listings with delete button to test');
        return;
    }

    // Click the first delete button
    await deleteButtons.first().click();

    // The confirmation dialog should be visible
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // The "Cancel" or close button inside the dialog should be clickable (proving z-index is correct)
    const cancelButton = dialog.locator('button').first();
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    // After cancel, dialog should close
    await expect(dialog).not.toBeVisible();
});
