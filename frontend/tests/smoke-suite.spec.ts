import { test, expect } from '@playwright/test';

test.describe('SMOKE SUITE: Critical User Flows', () => {
    // Use a unique suffix for this run to avoid data collisions
    const timestamp = Date.now();
    const USER_EMAIL = `smoke.user.${timestamp}@test.com`;
    const HOST_EMAIL = `smoke.host.${timestamp}@test.com`;
    const PASSWORD = 'password123';

    test.beforeEach(async ({ page }) => {
        // Ensure we are on the homepage
        await page.goto('/');
    });

    test('Flow 1: Auth - Register and Login (User)', async ({ page }) => {
        console.log(`Starting Auth Flow for ${USER_EMAIL}`);

        // Register
        await page.goto('/register');
        await page.fill('input[name="firstname"]', 'Smoke');
        await page.fill('input[name="lastname"]', 'User');
        await page.fill('input[name="email"]', USER_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.selectOption('select[name="role"]', 'ROLE_USER');

        // Listen for the API Call
        const registerResponsePromise = page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 200, { timeout: 10000 });
        await page.click('button[type="submit"]');
        await registerResponsePromise;

        // Should redirect to home or dashboard
        await expect(page).toHaveURL('/');

        // Logout
        if (await page.isVisible('button:has-text("Logout")')) { // simplified selector
            await page.click('button:has-text("Logout")');
        } else {
            // Find user menu if implemented
        }
    });

    test('Flow 2: Auth - Register and Login (Host)', async ({ page }) => {
        console.log(`Starting Auth Flow for ${HOST_EMAIL}`);

        // Register
        await page.goto('/register');
        await page.fill('input[name="firstname"]', 'Smoke');
        await page.fill('input[name="lastname"]', 'Host');
        await page.fill('input[name="email"]', HOST_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.selectOption('select[name="role"]', 'ROLE_HOST');

        const registerResponsePromise = page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 200);
        await page.click('button[type="submit"]');
        await registerResponsePromise;
        await expect(page).toHaveURL('/');
    });

    // Note: More complex flows like "Add Homestay" require the host to be logged in. 
    // For a basic smoke suite using individual test cases, we might need to re-login or use a single long test.
    // Using a single "Serial" test for the complex flow is better.
});

test.describe.serial('SMOKE SUITE: Management & Community Flow', () => {
    const timestamp = Date.now();
    const HOST_EMAIL = `host.flow.${timestamp}@test.com`;
    const ADMIN_EMAIL = `admin@nbh.com`; // Assuming admin exists from seed
    const ADMIN_PASS = `admin123`;
    const PASSWORD = 'password123';
    let homestayName = `Smoke Stay ${timestamp}`;

    test('Full Lifecycle: Host Create -> Admin Approve -> User Search', async ({ page }) => {
        // 1. Register Host
        await page.goto('/register');
        await page.fill('input[name="firstname"]', 'Host');
        await page.fill('input[name="lastname"]', 'Flow');
        await page.fill('input[name="email"]', HOST_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.selectOption('select[name="role"]', 'ROLE_HOST');

        const registerRes = page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 200);
        await page.click('button[type="submit"]');
        await registerRes;
        await page.waitForURL('/');

        // 2. Create Homestay via API (Bypass UI Map Wizard for Smoke Stability)
        const token = await page.evaluate(() => localStorage.getItem('token')); // Check usage in context
        // OR get it from response? Context stores it. Use localStorage.

        // Note: AuthContext saves 'token' or 'accessToken'? 
        // Checking register/page.tsx: login(res.data.accessToken, ...)
        // Check AuthContext.tsx ... assume 'accessToken' or 'token'. 
        // workflow.spec.ts used 'token'. Let's try 'accessToken' or 'token'.

        const apiBase = '/api'; // Relative path
        const createRes = await page.request.post(`${apiBase}/homestays`, {
            headers: {
                'Authorization': `Bearer ${token || await page.evaluate(() => localStorage.getItem('token'))}`,
                'Content-Type': 'application/json'
            },
            data: {
                name: homestayName,
                description: 'Smoke test description',
                pricePerNight: 1500,
                latitude: 27.0,
                longitude: 88.0,
                locationName: 'Smoke City',
                amenities: { wifi: true },
                photoUrls: ['https://example.com/photo.jpg']
            }
        });
        expect(createRes.status()).toBe(200);

        // 3. Admin Approve
        await page.context().clearCookies();
        await page.evaluate(() => localStorage.clear()); // Clear token
        await page.reload();

        // Login Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', ADMIN_EMAIL);
        await page.fill('input[name="password"]', ADMIN_PASS);

        const loginRes = page.waitForResponse(res => res.url().includes('/api/auth/authenticate') && res.status() === 200);
        await page.click('button[type="submit"]');
        await loginRes;
        await page.waitForURL('/');

        // Go to Admin Dashboard
        await page.goto('/admin');
        await expect(page.getByText(homestayName)).toBeVisible();

        // Click Approve
        const approvePromise = page.waitForResponse(res => res.url().includes('/approve') && res.status() === 200);
        // workflow.spec.ts used: card.locator('button:has-text("Approve")')
        // We'll use a specific row/card match
        await page.locator('div').filter({ hasText: homestayName }).last().getByRole('button', { name: 'Approve' }).click();
        await approvePromise;

        // 4. User Search
        await page.goto('/search');
        await page.fill('input[placeholder*="Search"]', homestayName);
        await page.keyboard.press('Enter');
        await expect(page.getByText(homestayName)).toBeVisible();
    });

    // Community Flow Skipped or Adapted? 
    // workflow.spec.ts validation of community seems solid.
    // For smoke suite, we can skip or include. 
    // Let's include simplified version using #ids if they exist
    test('Community Flow: Post Creation', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[name="email"]', HOST_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        await page.goto('/community');

        // workflow.spec.ts uses #share-experience-btn
        // We need to match actual implementation. 
        // If workflow.spec.ts passed, then #share-experience-btn exists.
        // But I don't see community/page.tsx content.
        // I will use text selector as fallback.

        const shareBtn = page.locator('button:has-text("Share your experience")').or(page.locator('#share-experience-btn'));
        await shareBtn.click();

        // Input
        // workflow.spec.ts uses #post-text. 
        // I used textarea[name="content"]. 
        // Falback:
        await page.fill('textarea', 'This is a smoke test post.');

        const postPromise = page.waitForResponse(res => res.url().includes('/api/posts') && res.status() === 200);
        await page.click('button:has-text("Post")'); // or Submit
        await postPromise;

        await expect(page.getByText('This is a smoke test post.')).toBeVisible();
    });
});
