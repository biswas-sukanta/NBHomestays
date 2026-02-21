import { test, expect } from '@playwright/test';

test.describe('NB-HOMESTAY AUTOMATION SUITE', () => {
    test.describe.configure({ mode: 'serial' });
    const timestamp = Date.now();
    const USER_EMAIL = `nb.user.${timestamp}@test.com`;
    const HOST_EMAIL = `nb.host.${timestamp}@test.com`;
    // Use dynamic admin email to avoid conflicts
    const ADMIN_EMAIL = `nb.admin.${timestamp}@test.com`;
    const ADMIN_PASS = `admin123`;
    const PASSWORD = 'password123';
    const HOMESTAY_NAME = `NB Retreat ${timestamp}`;
    let homestayId: string;

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    // Increase timeout for the whole suite
    test.setTimeout(60000);

    async function ensureLoggedOut(page: any) {
        await page.goto('/');
        // Check for Logout button (desktop/mobile)
        const logoutBtn = page.locator('button:has-text("Logout")');
        if (await logoutBtn.isVisible()) {
            console.log('User is logged in. Logging out...');
            await logoutBtn.click();
            await expect(page.locator('a[href="/login"]')).toBeVisible();
        }
    }

    test('Flow 1: User Auth - Register -> Login -> Profile (No 404)', async ({ page }) => {
        // Register
        await page.goto('/register');
        await page.fill('input[name="firstname"]', 'NB');
        await page.fill('input[name="lastname"]', 'User');
        await page.fill('input[name="email"]', USER_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.selectOption('select[name="role"]', 'ROLE_USER');

        const regRes = page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 200);
        await page.click('button[type="submit"]');
        await regRes;

        // Login
        // (Assuming auto-login or redirect to login)
        await page.waitForTimeout(1000); // Wait for redirect
        if (page.url().includes('/login')) {
            await page.fill('input[name="email"]', USER_EMAIL);
            await page.fill('input[name="password"]', PASSWORD);
            await page.click('button[type="submit"]');
        }

        // Check Profile
        await page.goto('/profile');
        // Profile page fetches /posts/my-posts, not /me directly (AuthContext handles user)
        await expect(page.locator('h1')).toContainText('My Profile');
        await expect(page.getByText('My Posts History')).toBeVisible();
    });

    test('Flow 2: Homestay Host Flow - Create -> Pending', async ({ page }) => {
        // Register Host
        await page.goto('/register');
        await page.fill('input[name="firstname"]', 'NB');
        await page.fill('input[name="lastname"]', 'Host');
        await page.fill('input[name="email"]', HOST_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.selectOption('select[name="role"]', 'ROLE_HOST');

        const regRes = page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 200);
        await page.click('button[type="submit"]');
        await regRes;

        await page.waitForURL('/');

        // Create Homestay via API (Stable)
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const createRes = await page.request.post('/api/homestays', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                name: HOMESTAY_NAME,
                description: 'A test homestay for NB automation.',
                pricePerNight: 2000,
                latitude: 27.0,
                longitude: 88.0,
                locationName: 'Test Location',
                amenities: { wifi: true },
                photoUrls: ['https://example.com/photo.jpg']
            }
        });
        expect(createRes.status()).toBe(200);

        // Capture homestayId for later flows
        const listingsRes = await page.request.get('/api/homestays/my-listings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const myHomes = await listingsRes.json();
        homestayId = myHomes[0].id;
        expect(homestayId).toBeDefined();

        // Verify Pending Status
        const listRes = await page.request.get('/api/homestays/my-listings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const listings = await listRes.json();
        const myStay = listings.find((h: any) => h.name === HOMESTAY_NAME);
        expect(myStay).toBeTruthy();
        expect(myStay.status).toBe('PENDING');
    });

    test('Flow 3: Admin Flow - View -> Approve (No 404)', async ({ page, context }) => {
        // 1. Smart Logout
        await ensureLoggedOut(page);

        // Register Admin (Programmatically)
        const regRes = await page.request.post('/api/auth/register', {
            data: {
                firstname: 'Admin',
                lastname: 'User',
                email: ADMIN_EMAIL,
                password: ADMIN_PASS,
                role: 'ROLE_ADMIN'
            }
        });
        expect(regRes.status()).toBe(200);

        // Login Admin
        await page.goto('/login');
        await page.fill('input[name="email"]', ADMIN_EMAIL);
        await page.fill('input[name="password"]', ADMIN_PASS);
        await expect(page.locator('button[type="submit"]')).toBeEnabled();
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        // Admin Dashboard
        await page.goto('/admin');

        // FORCE REFRESH to ensure new data is loaded
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Ensure we are on Pending Tab
        await page.getByText('Pending Approval', { exact: false }).click().catch(() => { });

        // Verify Homestay is visible
        await expect(page.getByText(HOMESTAY_NAME)).toBeVisible();

        // Approve
        const approveRes = page.waitForResponse(res => res.url().includes('/approve') && res.status() === 200);
        // Robust accessibility locator
        await page.getByRole('button', { name: `Approve ${HOMESTAY_NAME}` }).click();
        await approveRes;
    });

    test('Flow 4: Explorer Flow - Search -> View -> Select (No 404)', async ({ page, context }) => {
        // 1. Smart Logout
        await ensureLoggedOut(page);

        // 2. Login as Standard User (reuse credentials from Flow 1)
        await page.goto('/login');
        await page.fill('input[name="email"]', USER_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('/'); // Wait for Home Page

        // 3. Now Navigate to Search
        await page.goto('/search');
        await page.waitForLoadState('networkidle'); // Wait for page to settle

        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();

        // 4. Perform Search & Verify Click (The 404 Check)
        await searchInput.fill(HOMESTAY_NAME);
        await page.keyboard.press('Enter');

        // Wait for results and click the first homestay card
        await page.waitForSelector('text=' + HOMESTAY_NAME, { timeout: 15000 });
        await page.click('text=' + HOMESTAY_NAME);

        // STRICT CHECK: Verify URL pattern for Dynamic Route
        await page.waitForURL(/\/homestays\/[a-f0-9-]+/);

        // 6. CRITICAL: Verify Content Exists
        await expect(page.locator('h1')).toContainText(HOMESTAY_NAME);

        // Verify a button for WhatsApp or Enquire exists
        await expect(page.locator('button:has-text("WhatsApp"), button:has-text("Enquire")').first()).toBeVisible();
    });

    test('Flow 4b: Invalid Homestay ID -> 404 Page', async ({ page }) => {
        const invalidId = '00000000-0000-0000-0000-000000000000';
        await page.goto(`/homestays/${invalidId}`);
        await page.waitForLoadState('networkidle');

        // Debugging
        if (!(await page.getByText('404').isVisible())) {
            console.log('404 Text not found. Page content:', await page.content());
            await page.screenshot({ path: 'flow4b_failure.png' });
        }

        // Allow for either specific 404 text or general error
        const is404Visible = await page.getByText('404').isVisible() ||
            await page.getByText('Page Not Found').isVisible() ||
            await page.getByText('could not be found').isVisible();

        expect(is404Visible).toBeTruthy();
    });

    test.skip('Flow 5: Community Flow - Create Post -> Feed (No 404)', async ({ page }) => {
        await ensureLoggedOut(page);

        // Login as Host (who is also a user)
        await page.goto('/login');
        await page.fill('input[name="email"]', HOST_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('/');

        await page.goto('/community');

        // Create Post
        await page.locator('#share-experience-btn').click();

        await expect(page.locator('#post-location')).toBeVisible();
        await page.fill('#post-location', 'Test Loc');
        await page.fill('#post-text', `Test Post for ${HOMESTAY_NAME}`);

        const postRes = page.waitForResponse(res => res.url().includes('/api/posts') && res.status() === 200);
        await page.locator('#submit-post-btn').click();
        await postRes;

        // Verify in Feed
        await expect(page.locator('#posts-feed')).toContainText(`Test Post for ${HOMESTAY_NAME}`);
    });


});
