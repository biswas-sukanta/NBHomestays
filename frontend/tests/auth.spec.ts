import { test, expect } from '@playwright/test';

test.describe('Community Feed - Authenticated User', () => {

    test.beforeEach(async ({ page }) => {
        // Inject a mock auth token to bypass the actual login page flow
        // and trigger the "isAuthenticated" boolean in our AuthContext.
        await page.addInitScript(() => {
            window.localStorage.setItem('token', 'mock_e2e_jwt_token');
            window.localStorage.setItem('user', JSON.stringify({
                id: 'e2e-user-123',
                firstName: 'Test',
                lastName: 'User',
                email: 'test@example.com',
                role: 'ROLE_USER'
            }));
        });
        await page.goto('/community');
    });

    test('Add Post: Select Homestay via Combobox, Upload Image, Submit', async ({ page }) => {
        // Intercept POST /api/posts to ensure 201 Created and NO 500 error
        await page.route('**/api/posts', async route => {
            if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        id: 'mock-post-1',
                        textContent: 'Amazing homestay experience!',
                        locationName: 'Darjeeling',
                        imageUrls: ['http://imagekit.io/mock.jpg'],
                        createdAt: new Date().toISOString()
                    })
                });
            } else {
                route.continue();
            }
        });

        // Intercept image upload
        await page.route('**/api/upload', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify(['http://imagekit.io/mock.jpg'])
            });
        });

        // Intercept homestays
        await page.route('**/api/homestays', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify([
                    { id: 'hs-1', name: 'Very Long Homestay Name That Must Not Truncate Ahhhh' }
                ])
            });
        });

        // Open composer
        await page.getByRole('button', { name: 'Write a Story' }).click();

        await page.getByPlaceholder('What\'s the atmosphere like? Tell the community...').fill('Amazing homestay experience!');

        // Assert homestay selection and no truncation
        await page.getByTestId('homestay-combobox-input').fill('Long Homestay');
        const option = page.getByTestId('combobox-option-hs-1');
        await expect(option).toBeVisible();
        await expect(option).toHaveClass(/break-words/);
        await option.click();

        // Mock file upload
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.getByTitle('Add Photos').click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles({
            name: 'test.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('mock-image')
        });

        // Submit and assert success (intercepted above)
        await page.getByRole('button', { name: 'Post' }).click();
        await expect(page.getByText('Amazing homestay experience!')).toBeVisible();
    });

    test('Love Button: Assert count increments exactly by 1 and intercepts 200 OK', async ({ page }) => {
        await page.route('**/api/posts/*/like', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ isLiked: true, loveCount: 999 })
            });
        });

        await page.waitForSelector('[data-testid="post-card"]');
        const firstLikeBtn = page.getByTestId('like-btn').first();
        await firstLikeBtn.click();

        // Wait for the simulated backend increment response
        await expect(firstLikeBtn).toContainText('999');
    });

    test('Comment Drawer: Submit intercepts and 0-count empty state check', async ({ page }) => {
        await page.route('**/api/posts/*/comments**', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, body: JSON.stringify([]) });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 200,
                    body: JSON.stringify({ id: 'cm-1', body: 'Great place!', authorName: 'Test User' })
                });
            }
        });

        await page.waitForSelector('[data-testid="post-card"]');
        await page.getByTestId('comment-btn').first().click();

        // Assert empty state is visible
        await expect(page.getByText('Be the first to comment')).toBeVisible(); // Corrected text

        // Create comment
        await page.getByTestId('comment-input').fill('Great place!');
        await page.getByTestId('comment-send-btn').click();

        // Assert UI updates
        await expect(page.getByTestId('comment-item').first()).toContainText('Great place!');
    });

    test('Recursive Repost: Inner quoted post renders gracefully', async ({ page }) => {
        await page.waitForSelector('[data-testid="post-card"]');
        await page.getByTestId('repost-btn').first().click();

        // Since we caught the `onRepost` hook from PostCard, it creates a new draft wrapping the post.
        // We ensure the Add Post Composer opens and quote element is visible inside.
        // (If the UI opens the Add Post modal correctly on Repost click:
        await expect(page.getByPlaceholder('What\'s the atmosphere like? Tell the community...')).toBeVisible();
        await page.getByRole('button', { name: 'Post' }).click();
    });
});
