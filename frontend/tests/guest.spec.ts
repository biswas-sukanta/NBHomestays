import { test, expect } from '@playwright/test';

test.describe('Community Feed - Guest User', () => {

    test('Navigate to /community. Assert Feed loads and API returns 200 OK.', async ({ page }) => {
        // Intercept API call to ensure backend is syncing accurately.
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('/api/posts') && response.request().method() === 'GET'
        );

        await page.goto('/community');
        const response = await responsePromise;

        expect(response.status()).toBe(200);
        await expect(page.getByText('Community', { exact: true })).toBeVisible();
    });

    test('Assert that the "Share Your Journey" (Add Post) input is hidden for guests.', async ({ page }) => {
        await page.goto('/community');
        // The Add Post floating action button (FAB) is rendered ONLY for authenticated users.
        await expect(page.getByRole('button', { name: 'Write a Story' })).toBeHidden();
        // The embedded composer should also be absent
        await expect(page.getByText('Share Your Journey')).toBeHidden();
    });

    test('Assert that clicking "Love" blocks action and prompts for login.', async ({ page }) => {
        await page.goto('/community');

        // Wait for posts to load
        await page.waitForSelector('[data-testid="post-card"]');

        // Target the first post's Like button
        const firstLikeBtn = page.getByTestId('like-btn').first();
        await firstLikeBtn.click();

        // Verify Toaster prompt for unauthenticated users
        await expect(page.getByText('Sign in to love this story')).toBeVisible();
    });

    test('Assert that clicking "Comment" opens the drawer, but blocks interaction and prompts for login.', async ({ page }) => {
        await page.goto('/community');

        await page.waitForSelector('[data-testid="post-card"]');
        const firstCommentBtn = page.getByTestId('comment-btn').first();
        await firstCommentBtn.click();

        // Drawer opens
        await expect(page.getByRole('heading', { name: 'Comments' })).toBeVisible();

        // Verify input is hidden and Login prompt exists
        await expect(page.getByPlaceholder('Add a comment...')).toBeHidden();
        await expect(page.getByText('Login to join the conversation')).toBeVisible();
    });

    test('Assert that the UI does NOT contain the text NaN anywhere on the screen.', async ({ page }) => {
        await page.goto('/community');
        await page.waitForSelector('[data-testid="post-card"]');

        const content = await page.content();
        expect(content.includes('NaN')).toBeFalsy();
    });
});

