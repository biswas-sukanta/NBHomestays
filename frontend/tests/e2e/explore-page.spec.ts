import { test, expect } from '@playwright/test';

test.describe('Search/Explore Page Automation Validation', () => {

    test('UI Test 1: SharedPageBanner renders correctly with background and title', async ({ page }) => {
        await page.goto('/search');

        // Locate the central banner by checking background color or specific generic class properties
        const banner = page.locator('div.bg-\\[\\#004d00\\]');
        await expect(banner).toBeVisible();

        // Verify Title
        const title = page.locator('h1.font-extrabold', { hasText: 'Discover North Bengal' });
        await expect(title).toBeVisible();
        await expect(title).toHaveClass(/drop-shadow-sm/);
    });

    test('UI Test 2: Mid-Navbar (CategoryFilterBar) renders and is sticky/centered', async ({ page }) => {
        await page.goto('/search');

        const navbarContainer = page.locator('.sticky.top-\\[64px\\]');
        await expect(navbarContainer).toBeVisible();

        // Check centering
        await expect(navbarContainer).toHaveClass(/flex justify-center/);

        // Verify categories render (using text pattern to match "Trending Now" etc)
        const category = page.locator('span', { hasText: 'Trending Now' });
        await expect(category).toBeVisible();
    });

    test('Network Test 3: Frontend strictly fires a GET request to native Search Infinite Scroll Endpoint', async ({ page }) => {
        // Intercept API call
        const requestPromise = page.waitForRequest(request =>
            request.url().includes('/api/homestays/search?page=0&size=12') && request.method() === 'GET'
        );

        // Load page to trigger the generic grid IntersectionObserver
        await page.goto('/search');

        // Scroll to trigger IntersectionObserver specifically for mobile viewports
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Wait for the specific page=0 network ping
        const req = await requestPromise;
        expect(req.url()).toContain('page=0');
        expect(req.url()).toContain('size=12');
    });

    test('Integration Test 4: Homestay cards render in "All Homestays" after API resolves', async ({ page }) => {
        // Mock the backend specifically to ensure cards mount properly
        await page.route('**/api/homestays/search?page=0&size=12', async (route) => {
            const json = {
                content: [
                    { id: 'mock-1', name: 'Zostel Mock View', locationName: 'Mock City', pricePerNight: 2000, photoUrls: [] }
                ],
                last: false
            };
            await route.fulfill({ json });
        });

        await page.goto('/search');

        // Scroll to trigger IntersectionObserver
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

        // Due to the mock overriding the initial intersection fetch, we wait for the card rendering mapping.
        const card = page.locator('h3', { hasText: 'Zostel Mock View' });
        await expect(card).toBeVisible({ timeout: 15000 });
    });
});
