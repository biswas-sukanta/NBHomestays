import { test, expect, devices } from '@playwright/test';

/**
 * UI Viral Layout — Visual Regression & Overlap Tests
 *
 * Tests the redesigned homepage, search grid, and homestay details
 * on Desktop Chrome (1280×720) and iPhone 13 (390×844).
 *
 * Run first time with --update-snapshots to generate baselines:
 *   npx playwright test tests/ui-viral-layout.spec.ts --update-snapshots
 *
 * Subsequent runs will diff against stored snapshots.
 */

const LOCALHOST = 'http://localhost:3000';

// ── Helpers ────────────────────────────────────────────────────────────────

/** Checks that no two child elements of a parent overlap each other. */
async function assertNoOverlap(page: any, parentSelector: string) {
    const boxes = await page.evaluate((sel: string) => {
        const parent = document.querySelector(sel);
        if (!parent) return [];
        const children = Array.from(parent.children);
        return children.map((el) => {
            const r = (el as HTMLElement).getBoundingClientRect();
            return { top: r.top, left: r.left, bottom: r.bottom, right: r.right };
        });
    }, parentSelector);

    for (let i = 0; i < boxes.length; i++) {
        for (let j = i + 1; j < boxes.length; j++) {
            const a = boxes[i], b = boxes[j];
            const overlap =
                a.left < b.right &&
                a.right > b.left &&
                a.top < b.bottom &&
                a.bottom > b.top;
            expect(overlap, `Elements ${i} and ${j} should not overlap`).toBe(false);
        }
    }
}

// ── Desktop Tests ──────────────────────────────────────────────────────────

test.describe('Desktop Chrome (1280×720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('Homepage hero renders correctly', async ({ page }) => {
        await page.goto(LOCALHOST);
        // Wait for the Ken Burns hero to be visible
        await expect(page.locator('h1')).toContainText('Find Your Vibe', { timeout: 10000 });
        await expect(page.locator('#hero-search-input')).toBeVisible();

        // Snapshot
        await expect(page).toHaveScreenshot('desktop-homepage.png', {
            maxDiffPixelRatio: 0.04,
            fullPage: false,
        });
    });

    test('Homepage feature cards do not overlap', async ({ page }) => {
        await page.goto(LOCALHOST);
        await page.waitForSelector('.grid > div', { timeout: 8000 });
        // Feature grid should have no overlapping children
        await assertNoOverlap(page, 'section .grid');
    });

    test('Search page grid renders with vibe pills', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        // Wait for content or skeleton
        await page.waitForTimeout(1500);

        // Banner heading
        await expect(page.locator('h1')).toContainText('All Homestays', { timeout: 10000 });

        // At least one vibe pill
        await expect(page.locator('.pill').first()).toBeVisible({ timeout: 8000 });

        await expect(page).toHaveScreenshot('desktop-search.png', {
            maxDiffPixelRatio: 0.04,
        });
    });

    test('Search grid cards do not overlap', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        await page.waitForSelector('.grid > *', { timeout: 10000 });
        await assertNoOverlap(page, '.grid');
    });

    test('Homestay details page shows Bento gallery on desktop', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        // Click first listing card
        const firstCard = page.locator('a[href^="/homestays/"]').first();
        if (await firstCard.count() === 0) {
            // If no homestays in DB, skip gracefully
            test.skip();
        }
        await firstCard.click();
        await page.waitForURL(/\/homestays\//, { timeout: 10000 });

        // Bento grid visible on desktop
        await expect(page.locator('.md\\:grid').first()).toBeVisible({ timeout: 8000 });

        // Price and rating
        await expect(page.locator('h1')).not.toBeEmpty();

        await expect(page).toHaveScreenshot('desktop-details.png', {
            maxDiffPixelRatio: 0.04,
        });
    });

    test('Sticky mobile bar is hidden on desktop', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        const firstCard = page.locator('a[href^="/homestays/"]').first();
        if (await firstCard.count() === 0) test.skip();
        await firstCard.click();
        await page.waitForURL(/\/homestays\//);

        // Mobile sticky bar should not be visible on desktop
        const stickyBar = page.locator('.md\\:hidden').filter({ hasText: 'WhatsApp' });
        // It's md:hidden so may be in DOM but not visually present
        await page.waitForTimeout(500);
        const isVisible = await stickyBar.isVisible().catch(() => false);
        expect(isVisible).toBe(false);
    });
});

// ── Mobile Tests ───────────────────────────────────────────────────────────

test.describe('iPhone 13 (390×844)', () => {
    test.use(devices['iPhone 13']);

    test('Homepage hero renders on mobile', async ({ page }) => {
        await page.goto(LOCALHOST);
        await expect(page.locator('h1')).toContainText('Find Your Vibe', { timeout: 10000 });

        await expect(page).toHaveScreenshot('mobile-homepage.png', {
            maxDiffPixelRatio: 0.05,
        });
    });

    test('Search page vibe pills are scrollable on mobile', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        await expect(page.locator('.snap-row').first()).toBeVisible({ timeout: 8000 });

        await expect(page).toHaveScreenshot('mobile-search.png', {
            maxDiffPixelRatio: 0.05,
        });
    });

    test('Details page shows sticky mobile bar', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        const firstCard = page.locator('a[href^="/homestays/"]').first();
        if (await firstCard.count() === 0) test.skip();
        await firstCard.click();
        await page.waitForURL(/\/homestays\//, { timeout: 10000 });

        // Sticky bar should be visible after bounce-in (600ms)
        await page.waitForTimeout(700);
        const wa = page.locator('#whatsapp-enquire-btn');
        await expect(wa).toBeVisible({ timeout: 5000 });

        await expect(page).toHaveScreenshot('mobile-details-bar.png', {
            maxDiffPixelRatio: 0.05,
        });
    });

    test('Sticky bar does not overlap main content on mobile', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        const firstCard = page.locator('a[href^="/homestays/"]').first();
        if (await firstCard.count() === 0) test.skip();
        await firstCard.click();
        await page.waitForURL(/\/homestays\//);
        await page.waitForTimeout(700);

        // Get bounding boxes
        const [barBox, headingBox] = await Promise.all([
            page.locator('#whatsapp-enquire-btn').boundingBox(),
            page.locator('h1').boundingBox(),
        ]);

        if (!barBox || !headingBox) return;

        // Heading (top of page) must not overlap with sticky bar (bottom of page)
        const headingBottom = headingBox.y + headingBox.height;
        const barTop = barBox.y;
        expect(headingBottom).toBeLessThan(barTop + 40); // 40px tolerance
    });

    test('Mobile details snap carousel is present', async ({ page }) => {
        await page.goto(`${LOCALHOST}/search`);
        const firstCard = page.locator('a[href^="/homestays/"]').first();
        if (await firstCard.count() === 0) test.skip();
        await firstCard.click();
        await page.waitForURL(/\/homestays\//);

        // Mobile snap carousel (md:hidden)
        const carousel = page.locator('[class*="snap-x"]');
        await expect(carousel).toBeVisible({ timeout: 8000 });
    });
});
