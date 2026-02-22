import { test, expect, Page } from '@playwright/test';

// Global network listener to catch any 500 errors and fail the test immediately
const setupNetworkMonitor = (page: Page) => {
    page.on('response', async (response) => {
        if (response.status() >= 500) {
            const url = response.url();
            const status = response.status();
            let requestBody = '';
            try {
                requestBody = response.request().postData() || 'No payload';
            } catch (e) { }

            const errorMessage = `🔴 500 ERROR DETECTED ON: ${url}\nStatus: ${status}\nPayload: ${requestBody}`;
            console.error(errorMessage);
            throw new Error(errorMessage);
        }
    });
};

test.describe('NBHomestays E2E Regression Suite (500 Error Hunter)', () => {

    test.beforeEach(async ({ page }) => {
        setupNetworkMonitor(page);
    });

    test('Auth & Identity Flow: Complete Lifecycle', async ({ page }) => {
        // Navigate to Login/Register (Assume /login or similar)
        await page.goto('/login');

        // Switch to Register
        await page.getByRole('button', { name: /create an account/i }).click();

        // Fill Registration
        const testEmail = `regression_${Date.now()}@example.com`;
        await page.getByPlaceholder('Email address').fill(testEmail);
        await page.getByPlaceholder('Password').fill('Password123!');
        await page.getByPlaceholder('First Name').fill('Reg');
        await page.getByPlaceholder('Last Name').fill('Tester');
        await page.getByRole('button', { name: /sign up/i }).click();

        // Login with new credentials
        await page.getByPlaceholder('Email address').fill(testEmail);
        await page.getByPlaceholder('Password').fill('Password123!');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Verify successful login (e.g., redirect to home or dashboard)
        await expect(page).toHaveURL('/');

        // Profile Check
        await page.goto('/profile');
        await expect(page.getByText(testEmail)).toBeVisible();

        // Logout
        await page.getByRole('button', { name: /logout|sign out/i }).click();
    });

    test('Discovery Flow: Search and Homestay Details', async ({ page }) => {
        await page.goto('/explore');

        // Perform a search
        await page.getByPlaceholder(/search/i).fill('Darjeeling');
        await page.waitForTimeout(1000); // Wait for debounce / API

        // Click on a homestay if available, or just verify the search API didn't 500
        const homestayCard = page.locator('.homestay-card').first();
        if (await homestayCard.isVisible()) {
            await homestayCard.click();

            // Wait for details page to render (this hits cached GET /api/homestays/{id})
            await expect(page.getByRole('heading').first()).toBeVisible();

            // Check for Q&A section
            await expect(page.getByText(/Ask a Question/i)).toBeVisible();
        }
    });

    test('Community Flow: Posting, Liking, and Commenting', async ({ page }) => {
        // Assuming we have a test admin/user seeded, we would login first
        await page.goto('/login');
        await page.getByPlaceholder('Email address').fill('admin@example.com');
        await page.getByPlaceholder('Password').fill('admin123'); // Adjust to actual seed data
        await page.getByRole('button', { name: /sign in/i }).click();

        await page.goto('/community');

        // Infinite Scroll Test
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);

        // Create Post
        await page.getByPlaceholder(/share your experience/i).fill('Regression Test Post');
        await page.getByRole('button', { name: /post/i }).click();

        // Wait for post to appear
        await expect(page.getByText('Regression Test Post')).toBeVisible();

        // Like the post
        await page.locator('.like-button').first().click();

        // Comment on the post
        await page.getByPlaceholder(/add a comment/i).first().fill('Test Comment');
        await page.keyboard.press('Enter');

        // Verify comment is visible
        await expect(page.getByText('Test Comment')).toBeVisible();
    });

    test('Engagement Flow: Q&A on Homestay', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.getByPlaceholder('Email address').fill('admin@example.com');
        await page.getByPlaceholder('Password').fill('admin123');
        await page.getByRole('button', { name: /sign in/i }).click();

        await page.goto('/explore');
        const homestayCard = page.locator('.homestay-card').first();
        if (await homestayCard.isVisible()) {
            await homestayCard.click();

            // Ask a question
            await page.getByPlaceholder(/Type your question/i).fill('Is Wi-Fi stable here?');
            await page.getByRole('button', { name: /ask/i }).click();

            // Verify question appears
            await expect(page.getByText('Is Wi-Fi stable here?')).toBeVisible();

            // Answer the question (assumes logged in user is host/admin)
            const answerBtn = page.getByRole('button', { name: /reply|answer/i }).first();
            if (await answerBtn.isVisible()) {
                await answerBtn.click();
                await page.getByPlaceholder(/Type your answer/i).fill('Yes, 100Mbps fiber.');
                await page.getByRole('button', { name: /submit/i }).click();

                await expect(page.getByText('Yes, 100Mbps fiber.')).toBeVisible();
            }
        }
    });

    test('Profile & Admin Operations', async ({ page }) => {
        // Login as Admin
        await page.goto('/login');
        await page.getByPlaceholder('Email address').fill('admin@example.com');
        await page.getByPlaceholder('Password').fill('admin123');
        await page.getByRole('button', { name: /sign in/i }).click();

        // Admin Dashboard / Featured Toggles
        await page.goto('/admin');

        const featureToggle = page.locator('.feature-toggle').first();
        if (await featureToggle.isVisible()) {
            await featureToggle.click();
        }

        // Navigation to profile
        await page.goto('/profile');

        // Delete Post (cascade check)
        const deletePostBtn = page.getByRole('button', { name: /delete/i }).first();
        if (await deletePostBtn.isVisible()) {
            await deletePostBtn.click();
            // Handle confirm dialog if any
            page.on('dialog', dialog => dialog.accept());
        }
    });
});
