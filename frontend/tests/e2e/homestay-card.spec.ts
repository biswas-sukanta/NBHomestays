import { test, expect } from '@playwright/test';

test.describe('HomestayCard UI Data Binding', () => {

    test('should display dynamic location name instead of hardcoded North Bengal Hills', async ({ page }) => {
        // Intercept API search response and mock data
        await page.route('**/api/homestays/search*', async route => {
            const json = {
                content: [
                    {
                        id: 'test-1234',
                        name: 'Mock Darjeeling Homestay',
                        description: 'A lovely place in Darjeeling',
                        pricePerNight: 2500,
                        latitude: 27.0410,
                        longitude: 88.2663,
                        amenities: { "wifi": true },
                        photoUrls: ['https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800'],
                        vibeScore: 4.8,
                        status: 'APPROVED',
                        locationName: 'Darjeeling' // Dynamic location
                    }
                ],
                pageable: { pageNumber: 0, pageSize: 50 },
                totalElements: 1,
                totalPages: 1,
                last: true
            };
            await route.fulfill({ json });
        });

        // Navigate to search page where cards are rendered
        await page.goto('/search?query=Darjeeling');

        // Wait for the mock homestay card to appear
        const card = page.getByTestId('homestay-card').first();
        await expect(card).toBeVisible();

        // Assert that the dynamic locationName "Darjeeling" is visible
        await expect(card.getByTestId('location-text')).toHaveText('Darjeeling');

        // Assert that the hardcoded dummy text "North Bengal Hills" is NOT present
        await expect(card.locator('text=North Bengal Hills')).toHaveCount(0);
    });
});
