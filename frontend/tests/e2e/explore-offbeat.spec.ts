import { test, expect } from '@playwright/test';

test.describe('Explore Offbeat Swimlane Verification', () => {

    test('E2E: Explore Offbeat swimlane renders correctly on the search page', async ({ page }) => {
        test.setTimeout(60000);

        // ---------------------------------------------------------
        // PART 1: Login and Data Preparation
        // ---------------------------------------------------------
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@nbh.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button:has-text("Sign In")');

        await page.waitForURL('**/', { timeout: 30000 });

        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeTruthy();

        // Purge and Seed to ensure data
        await page.request.delete('/api/admin/homestays/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        await page.request.post('/api/admin/homestays/seed?count=20', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        // ---------------------------------------------------------
        // PART 2: Verification at /search
        // ---------------------------------------------------------
        await page.goto('/search');

        // Wait for dynamic content
        await page.waitForTimeout(5000);

        // Identify the "Explore Offbeat" swimlane
        const offbeatSection = page.locator('section').filter({ hasText: 'Explore Offbeat' });
        await expect(offbeatSection).toBeVisible({ timeout: 15000 });

        // Verify the heading and emoji
        await expect(offbeatSection.locator('h2')).toContainText('Explore Offbeat');
        await expect(offbeatSection.getByText('🌿')).toBeVisible();

        // Verify card presence
        const cards = offbeatSection.locator('[data-slot="card-title"]');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });
        const cardCount = await cards.count();
        expect(cardCount).toBeGreaterThan(0);
    });
});

