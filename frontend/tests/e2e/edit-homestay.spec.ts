import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Edit Homestay Flow with Hydration', () => {

    test('UI and Backend Sync: Validates pre-filled data and PUT synchronization', async ({ page }) => {
        // 1. Mock the GET request to hydrate the form
        await page.route('**/api/homestays/test-homestay-123', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'test-homestay-123',
                    name: 'Existing Villa',
                    description: 'A beautiful place',
                    pricePerNight: 5000,
                    latitude: 27.041,
                    longitude: 88.266,
                    locationName: 'Darjeeling',
                    media: [{ url: '' }],
                    tags: ['Couples Getaway'],
                    amenities: { 'Free Wi-Fi': true, 'Mountain View': true },
                    policies: ['No loud music after 10 PM']
                })
            });
        });

        // 2. Mock the PUT request for form submission
        await page.route('**/api/homestays/test-homestay-123', async route => {
            if (route.request().method() === 'PUT') {
                const postData = route.request().postDataJSON();

                // Assertions on the submitted payload
                expect(postData.name).toBe('Existing Villa Updated');
                expect(postData.pricePerNight).toBe(6000);
                expect(postData.media.some((m: any) => m.url === 'https://res.cloudinary.com/dummy/image/upload/v1234/existing.jpg')).toBeTruthy();
                // Mock upload gets appended
                // Mock upload gets appended in backend, but existingMedia + new uploads logic might vary in mock.
                // In actual Form, existingMedia is sent in payload.

                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({ id: 'test-homestay-123', name: 'Existing Villa Updated' })
                });
            } else {
                route.continue();
            }
        });

        // Mock upload endpoint for the new file
        await page.route('**/api/upload', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(['https://res.cloudinary.com/dummy/image/upload/v1234/new-mock-image.jpg'])
            });
        });


        // Navigate to the edit page
        await page.goto('/host/edit-homestay/test-homestay-123');

        // 3. Verify Hydration
        await expect(page.getByLabel('Property Name *')).toHaveValue('Existing Villa');
        await expect(page.getByLabel('Price per Night (₹) *')).toHaveValue('5000');

        // Modify values
        await page.getByLabel('Property Name *').fill('Existing Villa Updated');
        await page.getByLabel('Price per Night (₹) *').fill('6000');

        // Proceed to Photos step
        await page.getByRole('button', { name: 'Next' }).click(); // To Loc
        await page.getByRole('button', { name: 'Next' }).click(); // To Photos

        // Assert existing image is rendered
        await expect(page.locator('img[alt="Existing Preview 0"]')).toBeVisible();

        // Create a dummy file to upload new image
        const dummyFileData = Buffer.from('mock image data');
        const dummyPath = path.resolve(__dirname, 'mock-image.jpg');
        fs.writeFileSync(dummyPath, dummyFileData);

        try {
            // 4. Upload a new image alongside the existing one
            const fileInput = page.locator('input[type="file"]');
            await fileInput.setInputFiles(dummyPath);
        } finally {
            if (fs.existsSync(dummyPath)) fs.unlinkSync(dummyPath);
        }

        // Finish Wizard
        await page.getByRole('button', { name: 'Next' }).click(); // To Tags
        await page.getByRole('button', { name: 'Next' }).click(); // To Rules
        await page.getByRole('button', { name: 'Next' }).click(); // To Quick Facts
        await page.getByRole('button', { name: 'Next' }).click(); // To Host Details

        // 5. Submit and verify the PUT operation
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/homestays/test-homestay-123') && request.method() === 'PUT'
        );
        await page.getByRole('button', { name: 'Update Homestay' }).click();

        const request = await requestPromise;
        expect(request.url()).toMatch(/\/api\/homestays\/test-homestay-123$/);
    });
});

