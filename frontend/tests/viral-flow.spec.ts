import { test, expect } from '@playwright/test';

test('Viral Flow: Search to Details', async ({ page }) => {
    // 1. Go to search page
    await page.goto('/search');

    // 2. Click the first homestay card
    // We wait for at least one card to be visible
    const firstCard = page.locator('a[href^="/homestays/"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });
    await firstCard.click();

    // 3. Verify visual assertion on details page
    // The StoryCarousel should be present and take up viewport height (or close to it on mobile)
    // For desktop it might be different, but let's check for the component presence
    const carousel = page.getByTestId('story-carousel');
    await expect(carousel).toBeVisible();

    // 4. Verify "Book Now" or Price is visible
    await expect(page.getByText(/night/i)).toBeVisible();
});
