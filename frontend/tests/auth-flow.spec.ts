import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {

    test('Should register a new user successfully', async ({ page }) => {
        await page.goto('/register');

        const uniqueId = Date.now();
        const email = `testuser${uniqueId}@example.com`;

        await page.fill('input[name="firstname"]', 'Test');
        await page.fill('input[name="lastname"]', 'User');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'password');

        await page.click('button[type="submit"]');

        // Expect redirection to home
        await expect(page).toHaveURL('/');

        // Verify UI reflects logged in state (Logout button should be visible)
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Should login with existing guest user', async ({ page }) => {
        await page.goto('/login');

        // Login page inputs don't have name attributes, using placeholders
        await page.fill('input[placeholder="Email address"]', 'guest@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        await page.click('button[type="submit"]');

        // Expect redirection to home
        await expect(page).toHaveURL('/');

        // Verify UI reflects logged in state (Logout button should be visible)
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Should login with existing admin user', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[placeholder="Email address"]', 'admin@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/');
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Should login with existing host user', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[placeholder="Email address"]', 'host@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        await page.click('button[type="submit"]');

        await expect(page).toHaveURL('/');
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Should fail login with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[placeholder="Email address"]', 'wrong@example.com');
        await page.fill('input[placeholder="Password"]', 'wrongpassword');

        await page.click('button[type="submit"]');

        // Expect error message
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });
});
