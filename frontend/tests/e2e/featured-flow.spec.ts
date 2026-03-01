import { test, expect } from '@playwright/test';

test.describe('Featured Homestays Flow', () => {

    test('E2E: Admin can feature a homestay and it appears on the public Search page', async ({ page }) => {
        test.setTimeout(120000); // 2 minutes for slow startups
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

        // ---------------------------------------------------------
        // PART 1: Admin Action
        // ---------------------------------------------------------
        console.log('--- Navigating to Login ---');
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@nbh.com');
        await page.fill('input[type="password"]', 'admin123');

        const loginBtn = page.locator('button', { hasText: /Sign In|Login|Login to your account/i });
        await loginBtn.click();

        // Wait for successful login and redirect to Home
        await page.waitForURL('**/', { timeout: 60000 });
        console.log('--- Login Successful ---');

        // Wait for token to appear in localStorage
        await page.waitForFunction(() => {
            const t = localStorage.getItem('token');
            return t && t !== 'undefined' && t !== 'null';
        }, { timeout: 10000 });

        const token = await page.evaluate(() => localStorage.getItem('token'));
        const periodCount = (token?.match(/\./g) || []).length;
        console.log(`--- Purging Existing Homestays ---`);
        const purgeRes = await page.request.delete('/api/admin/homestays/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        expect(purgeRes.status()).toBe(200);

        console.log(`--- Seeding Homestays ---`);
        console.log(`Token Length: ${token?.length}`);
        console.log(`Period Count: ${periodCount}`);
        console.log(`Token Value (starts with): ${token?.substring(0, 50)}...`);
        console.log(`Token Value (ends with): ...${token?.substring(token.length - 50)}`);
        if (periodCount !== 2) {
            console.error('CRITICAL: Token in localStorage is NOT a valid JWS (missing periods)!');
        }

        const seedRes = await page.request.post('/api/admin/homestays/seed?count=5', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (seedRes.status() !== 200) {
            console.error(`--- Seed FAILED: ${seedRes.status()} ---`);
            console.error(await seedRes.text());
        }
        expect(seedRes.status()).toBe(200);

        console.log('--- Navigating to Admin ---');
        await page.goto('/admin');
        await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 45000 });

        // Navigate to Featured tab
        const featuredTab = page.getByRole('button', { name: 'Featured' });
        await expect(featuredTab).toBeVisible({ timeout: 45000 });
        await featuredTab.click();

        // Wait for homestays to populate
        await expect(page.locator('text=Toggle featured status')).toBeVisible({ timeout: 30000 });

        // Find the first available Feature toggle button
        const firstCard = page.locator('[data-slot="card"]').first();
        await expect(firstCard).toBeVisible({ timeout: 30000 });

        // Extract the name of the homestay to verify it later
        const rawName = await firstCard.locator('[data-slot="card-title"]').textContent();
        const homestayName = rawName?.trim();
        expect(homestayName).toBeTruthy();
        console.log(`Targeting Homestay for Feature Toggle: "${homestayName}"`);

        // Click the Feature toggle button inside the card
        const featureButton = firstCard.locator('button');

        // Match PUT /api/admin/homestays/:id/feature
        const featurePromise = page.waitForResponse(res =>
            /\/api\/admin\/homestays\/.*?\/feature/.test(res.url()) && res.request().method() === 'PUT'
        );

        await featureButton.click();

        // Assert the API returns 200 OK
        const response = await featurePromise;
        if (response.status() !== 200) {
            console.error('--- API Error Body ---');
            console.error(await response.text());
            console.error('----------------------');
        }
        expect(response.status()).toBe(200);

        // Wait for toast to disappear or just pause briefly before continuing
        await page.waitForTimeout(2000);

        // ---------------------------------------------------------
        // PART 2: Public Verification
        // ---------------------------------------------------------
        console.log('--- Navigating to Public Search Page ---');
        await page.goto('/search');

        // Look for the "⭐ Featured Escapes" header
        const featuredHeader = page.locator('h2', { hasText: 'Featured Escapes' });
        await expect(featuredHeader).toBeVisible({ timeout: 45000 });

        // The Swimlane immediately following the Featured header should contain the homestay name
        // Swimlanes share the same structure: <section> -> <h2>...
        // Finding the correct Swimlane explicitly
        const featuredSection = page.locator('section').filter({ hasText: 'Featured Escapes' });
        await expect(featuredSection).toBeVisible();

        // Check if the specific homestay we featured is visible in this swimlane
        const targetFeaturedCard = featuredSection.locator(`text=${homestayName}`).first();
        await expect(targetFeaturedCard).toBeVisible({ timeout: 15000 });

        console.log(`Successfully verified ${homestayName} in the Featured Escapes swimlane!`);
    });

});

