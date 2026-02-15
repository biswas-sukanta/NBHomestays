import { test, expect } from '@playwright/test';

test.describe('Gate 2: Detail Page (UI Rendering)', () => {

    test('Navigate to detail page via search result click', async ({ page }) => {
        // Start from search results
        await page.goto('/search?query=Darjeeling');

        // Wait for loading to finish
        await page.waitForFunction(() => {
            return document.querySelectorAll('.animate-pulse').length === 0;
        }, { timeout: 15000 });

        // Click the first result card
        const firstCard = page.locator('.group.block.relative').first();
        await expect(firstCard).toBeVisible({ timeout: 10000 });
        await firstCard.click();

        // Assert URL is /homestays/{uuid}
        await page.waitForURL(/\/homestays\/[0-9a-f-]+/, { timeout: 10000 });
        const url = page.url();
        console.log(`Detail page URL: ${url}`);
        expect(url).toMatch(/\/homestays\/[0-9a-f-]+/);

        // Wait for page to load
        await page.waitForLoadState('networkidle', { timeout: 15000 });

        // Assert the homestay name (h1) is visible
        const heading = page.locator('h1').first();
        await expect(heading).toBeVisible({ timeout: 10000 });
        const name = await heading.textContent();
        console.log(`Homestay name: ${name}`);
        expect(name).toBeTruthy();

        // Assert "Amenities" section is present and not empty
        const amenitiesHeading = page.locator('h3:text("Amenities")');
        await expect(amenitiesHeading).toBeVisible({ timeout: 10000 });

        // Check that at least one amenity item is rendered (not the "No specific amenities" fallback)
        const amenityItems = page.locator('.capitalize');
        const amenityCount = await amenityItems.count();
        console.log(`Amenity items: ${amenityCount}`);
        expect(amenityCount).toBeGreaterThanOrEqual(1);

        // Assert the story carousel is present
        const carousel = page.locator('[data-testid="story-carousel"]');
        await expect(carousel).toBeVisible({ timeout: 10000 });

        // Assert the booking form section exists (Reserve button)
        const reserveButton = page.locator('button:text("Reserve")');
        await expect(reserveButton).toBeVisible({ timeout: 10000 });

        await page.screenshot({ path: 'gate2-detail-pass.png', fullPage: true });
    });
});
