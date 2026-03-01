import { test, expect } from '@playwright/test';

test.describe('Add Homestay Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the add homestay page
        await page.goto('/host/add-homestay');
    });

    test('UX: Select All/None for Amenities correctly toggles checkboxes', async ({ page }) => {
        // Navigate to step 3 (Amenities & Photos)
        await page.getByRole('button', { name: 'Next' }).click(); // To step 2
        await page.getByRole('button', { name: 'Next' }).click(); // To step 3

        // Find the Highlights section
        const highlightsSection = page.locator('div:has(> div > h3:has-text("Highlights"))').first();

        // Check initial state (should be unchecked)
        const mountainView = highlightsSection.getByLabel('Mountain View');
        await expect(mountainView).not.toBeChecked();

        // Click 'Select All' for Highlights
        await highlightsSection.getByRole('button', { name: 'Select All' }).click();

        // Verify checkboxes in this section are checked
        await expect(mountainView).toBeChecked();
        await expect(highlightsSection.getByLabel('Free Wi-Fi')).toBeChecked();

        // Click 'Select None' for Highlights
        await highlightsSection.getByRole('button', { name: 'Select None' }).click();

        // Verify they are unchecked again
        await expect(mountainView).not.toBeChecked();
        await expect(highlightsSection.getByLabel('Free Wi-Fi')).not.toBeChecked();
    });

    test('API Sync: Form submission correctly sends POST /api/homestays', async ({ page }) => {
        // Step 1: Basic Info
        await page.getByLabel('Property Name *').fill('E2E Test Villa');
        await page.getByLabel('Price per Night (₹) *').fill('3500');
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 2: Location pin
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: 'Darjeeling' }).click();

        // We mock the API interaction or we proceed and intercept the final submission
        // Let's mock the component internal state if necessary, but we attempt clicking map
        const map = page.locator('.leaflet-container');
        if (await map.isVisible()) {
            await map.click();
        }
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 3: Photos (Dynamic inputs)
        await page.getByPlaceholder('https://...').first().fill('https://example.com/photo.jpg');
        // Add another photo
        await page.getByRole('button', { name: 'Add another photo' }).click();
        await page.getByPlaceholder('https://...').nth(1).fill('https://example.com/photo2.jpg');

        await page.getByRole('button', { name: 'Next' }).click(); // Step 4
        await page.getByRole('button', { name: 'Next' }).click(); // Step 5
        await page.getByRole('button', { name: 'Next' }).click(); // Step 6
        await page.getByRole('button', { name: 'Next' }).click(); // Step 7

        // We prepare to intercept the POST request
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/homestays') && request.method() === 'POST'
        );

        // We mock the backend response to prevent actual DB inserts during UI tests,
        // but assert that the route is correct (no `/add` path and no 500 error from routing missing)
        await page.route('**/api/homestays', route => route.fulfill({
            status: 201,
            body: JSON.stringify({ id: 'homestay-123', name: 'E2E Test Villa' })
        }));

        await page.getByRole('button', { name: 'List Homestay' }).click();

        // Asset the request was made to exactly `/api/homestays` and successfully intercepted
        const request = await requestPromise;
        expect(request.url()).toMatch(/\/api\/homestays$/);
    });
});

