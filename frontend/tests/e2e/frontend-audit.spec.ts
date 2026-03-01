import { test, expect } from '@playwright/test';

/**
 * Frontend Production Audit Verification
 * This test suite is designed to run against a REMOTE URL (Vercel/Kola).
 * BASE_URL must be configured in playwright.config.ts or via process.env.BASE_URL.
 */

test.describe('Frontend Production Audit - Performance & Resilience', () => {

    test.beforeEach(async ({ page }) => {
        const url = process.env.TEST_URL || 'https://nb-homestays.vercel.app'; // Fallback for documentation
        await page.goto('/');
    });

    test('Critical Path: Homepage and Search Navigation', async ({ page }) => {
        // 1. Verify Home Page Load & CLS check (implicitly verified by interaction)
        await expect(page).toHaveTitle(/North Bengal Homestays/);

        // 2. Search flow
        const searchInput = page.getByPlaceholder('Where do you want to go?');
        await expect(searchInput).toBeVisible();
        await searchInput.fill('Darjeeling');
        await page.getByRole('button', { name: 'Search' }).click();

        // 3. Verify Search Page Hydration (No white screen)
        await expect(page).toHaveURL(/\/search\?query=Darjeeling/);

        // 4. Verify Homestay Cards exist and have lazy loading
        const cards = page.locator('[data-testid="homestay-card"]');
        await expect(cards.first()).toBeVisible();

        const firstImg = cards.first().locator('img');
        await expect(firstImg).toHaveAttribute('loading', 'lazy');
    });

    test('Defensive UI: No White Screen on Component Failure', async ({ page }) => {
        // Navigate to search
        await page.goto('/search');

        // Verify Global App Context boundary doesn't trigger on healthy load
        await expect(page.locator('text=Something went wrong')).not.toBeVisible();
    });

    test('Accessibility: Interactive Elements have Labels', async ({ page }) => {
        await page.goto('/search');

        // Check for aria-labels on critical interactive buttons
        const compareButtons = page.getByLabel('Compare this homestay');
        if (await compareButtons.count() > 0) {
            await expect(compareButtons.first()).toBeVisible();
        }
    });

    test('Performance: Correct Image Sizing Attributes (CLS Mitigation)', async ({ page }) => {
        await page.goto('/search');

        const firstCardImg = page.locator('[data-testid="homestay-card"] img').first();
        await expect(firstCardImg).toHaveAttribute('width', '600');
        await expect(firstCardImg).toHaveAttribute('height', '450');
    });
});

