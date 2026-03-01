import { test, expect } from '@playwright/test';

test.describe('Admin Seeder and Search UI Pipeline', () => {

    test.beforeAll(async ({ request }) => {
        // Authenticate as the system admin created by the seeder or manually prior to test
        const loginRes = await request.post('/api/auth/login', {
            data: { email: 'admin@nbhomestays.com', password: 'Securepassword123!' }
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        // Step 1: Fire the Secure Trigger API to wipe and seed
        const response = await request.post('/api/admin/database/seed', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // Assert the seeder executed successfully.
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.message).toContain('hyper-realistic homestays');
    });

    test('UI Validation: Seeded Homestays Render Accurately on Destination Click', async ({ page }) => {
        // Step 2: Navigate to the Search Page
        await page.goto('/search');

        // Step 3: Click the Mirik destination card
        const mirikCard = page.locator('a[href="/search?tag=Mirik"]');
        await expect(mirikCard).toBeVisible();

        // Step 4: Intercept the network request to ensure correct API payload
        const searchPromise = page.waitForResponse(response =>
            response.url().includes('/api/homestays/search') && response.url().includes('tag=Mirik') && response.request().method() === 'GET'
        );

        await mirikCard.click();

        // Wait for the exact filtered API to resolve
        const searchResponse = await searchPromise;
        expect(searchResponse.status()).toBe(200);

        // Step 5: Assert that the hyper-realistic Mirik data renders on the screen.
        // The seeder injected "Lakeview Serenity" and "Orange Orchard Farmstay".
        const lakeviewCard = page.locator('text=Lakeview Serenity');
        const orangeCard = page.locator('text=Orange Orchard Farmstay');

        // Assert they became visible elements on the UI
        await expect(lakeviewCard).toBeVisible({ timeout: 15000 });
        await expect(orangeCard).toBeVisible({ timeout: 15000 });
    });
});

