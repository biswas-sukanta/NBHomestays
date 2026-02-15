import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * Test 1: Navbar Visibility & Geometry
 * The navbar must be visible, at the top of the viewport, full-width, and have height > 0.
 */
test('Navbar is visible, at top, full-width, and has height', async ({ page }) => {
    await page.goto(`${BASE}/search`);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    const box = await nav.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBe(0);
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(40);

    // Verify width spans the viewport
    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();
    expect(box!.width).toBe(viewport!.width);
});

/**
 * Test 2: Navbar is clickable (not blocked by an overlay)
 * Click "Explore" link and verify URL changes to /search.
 */
test('Navbar links are clickable (no z-index overlay)', async ({ page }) => {
    await page.goto(BASE);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    // The Navbar link "Explore" points to /search
    const exploreLink = nav.getByText('Explore');
    await expect(exploreLink).toBeVisible();
    await exploreLink.click();
    await expect(page).toHaveURL(/\/search/);
});

/**
 * Test 3: Navbar stays visible after scrolling (sticky/fixed resilience)
 */
test('Navbar remains visible after scrolling 500px', async ({ page }) => {
    await page.goto(`${BASE}/search`);

    const nav = page.locator('nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Scroll down 500px
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500); // let scroll settle

    // Navbar should still be visible and at top of viewport
    await expect(nav).toBeVisible();
    const box = await nav.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBe(0);
});
