import { test, expect } from '@playwright/test';

test.describe('Community Feed - Owner Actions', () => {

    test.beforeEach(async ({ page }) => {
        // Intercept the backend Auth verification so our frontend AuthProvider stays logged in
        await page.route('**/api/users/me', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'e2e-owner-123',
                    firstName: 'Admin',
                    lastName: 'User',
                    email: 'admin@nbhomestays.com',
                    role: 'ROLE_ADMIN'
                })
            });
        });

        // Also intercept the generic auth endpoint just in case
        await page.route('**/api/auth/me', async route => {
            await route.fulfill({ status: 200, body: JSON.stringify({ id: 'e2e-owner-123', role: 'ROLE_ADMIN' }) });
        });

        // Authenticate as a user who owns specific posts, or ROLE_ADMIN
        await page.addInitScript(() => {
            window.localStorage.setItem('token', 'mock_e2e_admin_token');
            window.localStorage.setItem('user', JSON.stringify({
                id: 'e2e-owner-123',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@nbhomestays.com',
                role: 'ROLE_ADMIN'
            }));
        });

        // Inject a known test post to edit
        await page.route('**/api/posts**', async route => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        content: [{
                            id: 'mock-edit-post',
                            userId: 'e2e-owner-123',
                            userName: 'Admin User',
                            locationName: 'Darjeeling',
                            textContent: 'This is the original text to hydrate.',
                            imageUrls: [],
                            createdAt: new Date().toISOString(),
                        }]
                    })
                });
            } else {
                route.continue();
            }
        });

        await page.goto('/community');
    });

    test('Edit Hydration: The payload correctly fills the composer UI', async ({ page }) => {
        // Find our specific mock post
        const postCard = page.getByTestId('post-card').first();
        await expect(postCard).toContainText('This is the original text to hydrate.');

        // Open the dropdown and Edit
        await postCard.getByTestId('post-options-btn').click();
        await postCard.getByTestId('edit-post-btn').click();

        // Assert Hydration matching EXACT original payload lengths/text
        const textarea = page.getByPlaceholder('What\'s the atmosphere like? Tell the community...');
        await expect(textarea).toHaveValue('This is the original text to hydrate.');

        // Intercept PUT submission
        await page.route('**/api/posts/mock-edit-post', async route => {
            expect(route.request().method()).toBe('PUT');
            await route.fulfill({ status: 200, body: JSON.stringify({}) });
        });

        await textarea.fill('Edited Hydrated Text!');
        await page.getByRole('button', { name: 'Update' }).click();
    });

    test('Delete Post: DOM updates cleanly after confirmation and DELETE intercept', async ({ page }) => {
        // Auto-accept the window.confirm dialog natively
        page.on('dialog', dialog => dialog.accept());

        await page.route('**/api/posts/mock-edit-post', async route => {
            expect(route.request().method()).toBe('DELETE');
            await route.fulfill({ status: 204 });
        });

        const postCard = page.getByTestId('post-card').first();
        await expect(postCard).toBeVisible();

        await postCard.getByTestId('post-options-btn').click();
        await postCard.getByTestId('delete-post-btn').click();

        // Assert Optimistic UI wipes it cleanly without refresh
        await expect(postCard).toBeHidden();
        await expect(page.getByText('Story deleted')).toBeVisible(); // Sonner toast
    });
});
