
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test.describe('The Phoenix Suite: System Rescue', () => {

    test('Test 1: Search Alive Check', async ({ page }) => {
        // 1. Visit /search (Explore Page)
        console.log('Visiting /search...');
        await page.goto(`${BASE}/search`);

        // 2. Assert "No homestays found" is NOT visible
        const noHomestays = page.getByText('No homestays found');
        await expect(noHomestays).not.toBeVisible({ timeout: 10000 });

        // 3. Assert at least 1 homestay card is visible
        // We look for text from seeded data
        const card1 = page.getByText('Misty Mountain Retreat');
        const card2 = page.getByText('River View Kalimpong');

        await expect(card1.or(card2).first()).toBeVisible();
        console.log('Search Check Passed: Data is visible.');
    });

    test('Test 2: Admin Power Check', async ({ page }) => {
        // 1. Login as Admin
        console.log('Logging in as Admin...');
        await page.goto(`${BASE}/login`);
        await page.fill('input[type="email"]', 'admin@nbh.com');
        await page.fill('input[type="password"]', 'admin123');
        await page.click('button[type="submit"]');
        await page.waitForURL(url => !url.toString().includes('/login'));

        // 2. Go to Admin Dashboard
        await page.goto(`${BASE}/admin`);

        // 3. Verify God View (All Listings)
        console.log('Checking God View...');
        await page.click('button:has-text("All Listings")');

        // 4. Assert at least one card is visible
        // HomestayCard has bg-white rounded-xl shadow-sm
        const anyCard = page.locator('.rounded-xl').first();
        await expect(anyCard).toBeVisible();

        // 5. Assert Owner Email is visible (Admin feature)
        console.log('Checking Owner Email visibility...');
        const ownerEmail = page.getByText('host@nbh.com').first();
        await expect(ownerEmail).toBeVisible();

        console.log('Admin Check Passed: God View verified.');
    });

});
