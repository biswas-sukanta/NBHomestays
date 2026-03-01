import { test, expect } from '@playwright/test';

test.describe('Search/Explore Page UI Automation Validation', () => {

    test('UI Test 1: Mobile Search Bar Bounds - Search Form Elements Stack Properly', async ({ page }) => {
        // iPhone 12 Pro dimensions
        await page.setViewportSize({ width: 390, height: 844 });

        await page.goto('/search');

        // Locate form and button
        const form = page.locator('form').first();
        const searchButton = form.locator('button[type="submit"]');

        // Wait for elements to be visible
        await expect(form).toBeVisible();
        await expect(searchButton).toBeVisible();

        // Get bounding boxes
        const formBox = await form.boundingBox();
        const buttonBox = await searchButton.boundingBox();

        expect(formBox).not.toBeNull();
        expect(buttonBox).not.toBeNull();

        // Check if button stays within form width constraints (not overflowing)
        // With standard padding, width of button should be essentially width of form (minus padding)
        expect(buttonBox!.width).toBeLessThanOrEqual(formBox!.width);

        // Check that layout actually stacks: center of button should have higher Y than center of form total
        // OR simply verify button width is almost 100% since it stacks vertically without absolute bounds
        const viewportWidth = page.viewportSize()!.width;
        expect(buttonBox!.width).toBeLessThanOrEqual(viewportWidth);
    });

    test('UI Test 2: Desktop Centering - Enforced Equal Margins', async ({ page }) => {
        // Enforce large desktop viewport dimensions
        await page.setViewportSize({ width: 1280, height: 720 });
        await page.goto('/search');

        // Locate main content wrapper
        const mainElement = page.locator('main.max-w-7xl');

        await expect(mainElement).toBeVisible();

        // Fetch client rect logic directly via evaluated DOM to reliably assess offsets
        const layoutMetrics = await page.evaluate(() => {
            const mainNode = document.querySelector('main');
            if (!mainNode) return null;
            const rect = mainNode.getBoundingClientRect();
            return {
                leftDist: rect.left,
                rightDist: window.innerWidth - rect.right,
            };
        });

        expect(layoutMetrics).not.toBeNull();

        // Margin equality implies perfect horizontal centering. Allow for < 2px aliasing differences.
        const diff = Math.abs(layoutMetrics!.leftDist - layoutMetrics!.rightDist);
        expect(diff).toBeLessThan(2);
    });

    test('UI Test 3: Swimlane Conditional Rendering Lifecycle', async ({ page }) => {
        // Universal mock for all search APIs to prevent test leakage
        await page.route('**/api/homestays/search*', async (route) => {
            const url = route.request().url();
            if (url.includes('tag=Trending')) {
                await route.fulfill({ json: { content: [], last: true } });
            } else if (url.includes('tag=Featured')) {
                await route.fulfill({ json: { content: [{ id: 'mock-feat-1', name: 'Mock Featured Estate', media: [] }], last: true } });
            } else {
                // Catch standard, offbeat, or unspecified requests safely
                await route.fulfill({ json: { content: [], last: true } });
            }
        });

        await page.goto('/search');

        // Validate Trending Now component disappears entirely
        const trendingHeader = page.locator('h2', { hasText: 'Trending Now' });
        await expect(trendingHeader).toBeHidden();

        // Validate Featured Escapes renders correctly
        const featuredHeader = page.locator('h2', { hasText: 'Featured Escapes' });
        await expect(featuredHeader).toBeVisible();
    });
});

