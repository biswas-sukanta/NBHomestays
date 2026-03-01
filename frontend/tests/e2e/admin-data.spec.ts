import { test, expect } from '@playwright/test';

test.describe('Admin Data Management E2E', () => {

    test.beforeEach(async ({ page }) => {
        // Log all requests
        page.on('request', request => console.log('>>', request.method(), request.url()));
        page.on('response', response => console.log('<<', response.status(), response.url()));

        // Increase timeout for cold starts/Turbopack compilation
        test.setTimeout(180000);

        // 1. Authenticate via UI
        console.log('--- Navigating to Login ---');
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@nbh.com');
        await page.fill('input[type="password"]', 'admin123');

        const loginBtn = page.locator('button', { hasText: /Sign In|Login|Login to your account/i });
        await loginBtn.click();

        // 2. Wait for successful login and redirect to Home
        await page.waitForURL('**/', { timeout: 60000 });
        console.log('--- Login Successful, Navigating to Admin ---');

        // 3. Navigate to Admin
        await page.goto('/admin');

        // 4. Wait for the dashboard to render (Wait for "Admin Dashboard" title)
        await expect(page.getByText('Admin Dashboard')).toBeVisible({ timeout: 45000 });

        // 5. Click on the Data Management Tab
        const dataTab = page.getByRole('button', { name: 'Data Management' });
        await expect(dataTab).toBeVisible({ timeout: 45000 });
        await dataTab.click();

        // 6. Ensure the module is rendered
        await expect(page.locator('text=Purge Specific')).toBeVisible({ timeout: 30000 });
    });

    test('Test 1: Seed Data Validation', async ({ page }) => {
        const seedInput = page.locator('input[placeholder="e.g., 10"]');
        await seedInput.fill('2');

        // Match POST /api/admin/homestays/seed with count=2
        const seedPromise = page.waitForResponse(res =>
            /\/api\/admin\/homestays\/seed\?count=2/.test(res.url()) && res.request().method() === 'POST'
        );

        const generateBtn = page.locator('button', { hasText: 'Generate Homestays' });
        await generateBtn.click();

        const response = await seedPromise;
        expect(response.status()).toBe(200);

        await expect(page.locator('text=Successfully generated 2 hyper-realistic homestays!')).toBeVisible({ timeout: 45000 });

        // Verify on search page
        await page.goto('/search');
        await page.waitForTimeout(4000);

        const homestayCards = page.locator('h3');
        const cardCount = await homestayCards.count();
        expect(cardCount).toBeGreaterThanOrEqual(2);
    });

    test('Test 2: Delete Count Validation', async ({ page }) => {
        const deleteInput = page.locator('input[placeholder="e.g., 5"]');
        await deleteInput.fill('1');

        // Match DELETE /api/admin/homestays with limit=1
        const deletePromise = page.waitForResponse(res =>
            /\/api\/admin\/homestays\?limit=1/.test(res.url()) && res.request().method() === 'DELETE'
        );

        const deleteBtn = page.locator('button', { hasText: 'Delete 1 Records' });
        await deleteBtn.click();

        const response = await deletePromise;
        expect(response.status()).toBe(200);

        await expect(page.locator('text=Successfully deleted 1 homestays!')).toBeVisible({ timeout: 30000 });
    });

    test('Test 3: Nuclear Wipe Validation', async ({ page }) => {
        const wipeBtn = page.locator('button', { hasText: 'Delete All Homestays' });
        await wipeBtn.click();

        // Accept Confirmation Modal
        const confirmBtn = page.locator('button', { hasText: 'Yes, Wipe Everything' });
        await expect(confirmBtn).toBeVisible({ timeout: 10000 });

        const wipePromise = page.waitForResponse(res =>
            /\/api\/admin\/homestays\/all/.test(res.url()) && res.request().method() === 'DELETE'
        );

        page.on('console', msg => console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`));

        await confirmBtn.click();

        const response = await wipePromise;
        if (response.status() !== 200) {
            console.error('DELETE /api/admin/homestays/all failed:', response.status());
            console.error('Response Body:', await response.text());
        }
        expect(response.status()).toBe(200);

        await expect(page.locator('text=Nuclear wipe executed: All homestays deleted.')).toBeVisible({ timeout: 30000 });

        // Verify search page is empty
        await page.goto('/search');
        await page.waitForTimeout(4000);

        // When storefront is completely empty, zero cards will be rendered
        await expect(page.getByTestId('homestay-card')).toHaveCount(0, { timeout: 20000 });
    });

});

