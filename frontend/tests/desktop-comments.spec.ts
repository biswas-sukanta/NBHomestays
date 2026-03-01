import { test, expect } from '@playwright/test';

test.describe('Desktop Comment Drawer', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('drawer holds rigid shape and close button is visible', async ({ page }) => {
        await page.goto('/community', { waitUntil: 'networkidle', timeout: 30000 });

        // Click the first Comment button on the feed
        const commentBtn = page.locator('[data-testid="comment-btn"]').first();
        await expect(commentBtn).toBeVisible({ timeout: 15000 });
        await commentBtn.click();

        // Wait for the drawer to appear
        const drawer = page.locator('.rounded-t-3xl.flex.flex-col.overflow-hidden').first();
        await expect(drawer).toBeVisible({ timeout: 5000 });

        // CRUCIAL: Assert minimum height to catch the collapse bug
        const box = await drawer.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(400);
        console.log(`Drawer height: ${box!.height}px — PASS (>= 400px)`);

        // Assert Close button is visible in the header
        const closeBtn = drawer.locator('button[aria-label="Close comments"]');
        await expect(closeBtn).toBeVisible();

        // Assert Close button is within the drawer's bounds (not pushed off-screen)
        const closeBtnBox = await closeBtn.boundingBox();
        expect(closeBtnBox).not.toBeNull();
        expect(closeBtnBox!.y).toBeGreaterThanOrEqual(box!.y);
        expect(closeBtnBox!.y).toBeLessThan(box!.y + 80); // within top 80px = header area

        // Assert the Comments header text is visible
        const header = drawer.locator('h2:has-text("Comments")');
        await expect(header).toBeVisible();

        // Close the drawer
        await closeBtn.click();
        await expect(drawer).not.toBeVisible({ timeout: 3000 });
    });
});

