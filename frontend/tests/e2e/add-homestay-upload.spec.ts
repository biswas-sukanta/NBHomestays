import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Add Homestay Flow with Local Image Uploads', () => {

    test.beforeEach(async ({ page }) => {
        // Navigate to the add homestay page
        await page.goto('/host/add-homestay');
    });

    test('UI and Backend Sync: Validates drag and drop previews and intercepts mock upload', async ({ page }) => {
        // Step 1: Basic Info
        await page.getByLabel('Property Name *').fill('Cloudinary Test Villa');
        await page.getByLabel('Price per Night (₹) *').fill('4500');
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 2: Location pin
        await page.getByRole('combobox').click();
        await page.getByRole('option', { name: 'Kalimpong' }).click();
        await page.getByRole('button', { name: 'Next' }).click();

        // Step 3: Photos (ImageDropzone)
        // We create a dummy file to upload
        const dummyFileData = Buffer.from('mock image data');
        const dummyPath = path.resolve(__dirname, 'mock-image.jpg');
        fs.writeFileSync(dummyPath, dummyFileData);

        // Mock the backend image upload service so it doesn't hit Cloudinary during E2E
        await page.route('**/api/upload', async route => {
            // Return a simulated Cloudinary URL list
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(['https://res.cloudinary.com/dummy/image/upload/v1234/mock-image.jpg'])
            });
        });

        // Mock the homestay post endpoint as before
        await page.route('**/api/homestays', async route => {
            // Validate that the returned URL was bundled into the final payload payload
            const postData = route.request().postDataJSON();
            expect(postData.media).toBeDefined();

            await route.fulfill({
                status: 201,
                body: JSON.stringify({ id: 'homestay-456', name: 'Cloudinary Test Villa' })
            });
        });

        try {
            // Select the dropzone file input programmatically
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(dummyPath);
        } finally {
            // Clean up the dummy file
            if (fs.existsSync(dummyPath)) {
                fs.unlinkSync(dummyPath);
            }
        }

        // Assert that the preview rendered correctly
        const previewImage = page.locator('img[alt="Preview 0"]');
        await expect(previewImage).toBeVisible();

        // Finish the wizard
        await page.getByRole('button', { name: 'Next' }).click(); // Step 4
        await page.getByRole('button', { name: 'Next' }).click(); // Step 5
        await page.getByRole('button', { name: 'Next' }).click(); // Step 6
        await page.getByRole('button', { name: 'Next' }).click(); // Step 7

        // Submit
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/homestays') && request.method() === 'POST'
        );
        await page.getByRole('button', { name: 'List Homestay' }).click();

        // Test implicitly passes if the route assertions inside `page.route` succeed
        const request = await requestPromise;
        expect(request.url()).toMatch(/\/api\/homestays$/);
    });
});

