import { test, expect } from '@playwright/test';

test.describe('Gate 1: Search & Filter (Data Flow)', () => {

    test('Search "Darjeeling" returns results with Price and Image', async ({ page }) => {
        // Navigate to search with query
        await page.goto('/search?query=Darjeeling');

        // Wait for loading skeleton to disappear (loading state renders animate-pulse placeholders)
        await page.waitForFunction(() => {
            return document.querySelectorAll('.animate-pulse').length === 0;
        }, { timeout: 15000 });

        // Assert at least 1 result card appears
        const cards = page.locator('.group.block.relative');
        await expect(cards.first()).toBeVisible({ timeout: 10000 });
        const count = await cards.count();
        console.log(`Search results for "Darjeeling": ${count} cards`);
        expect(count).toBeGreaterThanOrEqual(1);

        // Assert the first card has Price (₹ symbol)
        const priceText = cards.first().locator('text=₹');
        await expect(priceText.first()).toBeVisible();

        // Assert the first card has a visible Image (not broken)
        const img = cards.first().locator('img');
        await expect(img).toBeVisible();

        // Verify image has a valid src (not empty)
        const src = await img.getAttribute('src');
        expect(src).toBeTruthy();
        expect(src!.length).toBeGreaterThan(10);
        console.log(`First card image src: ${src!.substring(0, 60)}...`);

        await page.screenshot({ path: 'gate1-search-pass.png', fullPage: true });
    });

    test('Search with empty query returns all homestays', async ({ page }) => {
        await page.goto('/search');

        await page.waitForFunction(() => {
            return document.querySelectorAll('.animate-pulse').length === 0;
        }, { timeout: 15000 });

        const heading = page.locator('h1');
        await expect(heading).toContainText('All Homestays');

        const cards = page.locator('.group.block.relative');
        const count = await cards.count();
        console.log(`All homestays: ${count} cards`);
        expect(count).toBeGreaterThanOrEqual(1);
    });
});
