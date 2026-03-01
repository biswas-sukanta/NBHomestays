import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080/api';

// Helper: login in a given page context
async function login(page: Page, email: string, password: string) {
    await page.goto(`${BASE}/login`);
    await page.fill('input[placeholder="Email address"]', email);
    await page.fill('input[placeholder="Password"]', password);

    const [response] = await Promise.all([
        page.waitForResponse(res => res.url().includes('/api/auth/authenticate'), { timeout: 15000 }),
        page.click('button[type="submit"]'),
    ]);
    expect(response.status()).toBe(200);
    // Wait for redirect after login
    await page.waitForTimeout(2000);
}

test.describe('Scenario A: Host vs Admin Handshake', () => {
    let hostContext: BrowserContext;
    let adminContext: BrowserContext;
    let hostPage: Page;
    let adminPage: Page;

    test.beforeAll(async ({ browser }) => {
        hostContext = await browser.newContext();
        adminContext = await browser.newContext();
        hostPage = await hostContext.newPage();
        adminPage = await adminContext.newPage();
    });

    test.afterAll(async () => {
        await hostContext.close();
        await adminContext.close();
    });

    test('Host submits homestay → PENDING → Admin approves → APPROVED in search', async () => {
        // 1. Host logs in
        await login(hostPage, 'host@example.com', 'password');

        // 2. Host creates a new homestay via API (simulates form submission)
        const hostToken = await hostPage.evaluate(() => localStorage.getItem('token'));
        expect(hostToken).toBeTruthy();

        const createRes = await hostPage.request.post(`${API}/homestays`, {
            headers: { 'Authorization': `Bearer ${hostToken}`, 'Content-Type': 'application/json' },
            data: {
                name: 'Cloud 9 Homestay',
                description: 'A heavenly stay above the clouds in Darjeeling hills.',
                pricePerNight: 3000,
                latitude: 27.05,
                longitude: 88.26,
                amenities: { wifi: true, breakfast: true },
                media: [{ url: '' }]
            }
        });
        expect(createRes.status()).toBe(200);
        const created = await createRes.json();
        console.log('Created homestay:', created.id, 'Status:', created.status);
        expect(created.status).toBe('PENDING');

        // 3. Host checks my-listings — should see PENDING badge
        const myListingsRes = await hostPage.request.get(`${API}/homestays/my-listings`, {
            headers: { 'Authorization': `Bearer ${hostToken}` }
        });
        expect(myListingsRes.status()).toBe(200);
        const myListings = await myListingsRes.json();
        const cloud9 = myListings.find((h: any) => h.name === 'Cloud 9 Homestay');
        expect(cloud9).toBeTruthy();
        expect(cloud9.status).toBe('PENDING');

        // 4. Public search for "Cloud 9" should return 0 results (not approved yet)
        const publicSearch1 = await hostPage.request.get(`${API}/homestays/search?query=Cloud 9`);
        expect(publicSearch1.status()).toBe(200);
        const searchResults1 = await publicSearch1.json();
        const cloud9InSearch1 = searchResults1.filter((h: any) => h.name === 'Cloud 9 Homestay');
        expect(cloud9InSearch1.length).toBe(0);
        console.log('Public search before approval: 0 results ✓');

        // 5. Admin logs in
        await login(adminPage, 'admin@example.com', 'password');

        // 6. Admin goes to /admin — should see "Cloud 9"
        await adminPage.goto(`${BASE}/admin`);
        await adminPage.waitForLoadState('networkidle');
        const cloud9Card = adminPage.locator('text=Cloud 9 Homestay');
        await expect(cloud9Card).toBeVisible({ timeout: 10000 });
        console.log('Admin sees Cloud 9 in pending list ✓');

        // 7. Admin clicks "Approve" on the Cloud 9 card
        const card = adminPage.locator('div').filter({ hasText: 'Cloud 9 Homestay' }).first();
        const approveButton = card.locator('button:has-text("Approve")');
        await approveButton.click();
        await adminPage.waitForTimeout(1000);

        // Verify it's removed from pending list
        await expect(adminPage.locator('text=Cloud 9 Homestay')).not.toBeVisible({ timeout: 5000 });
        console.log('Cloud 9 removed from pending list after approval ✓');

        // 8. Host reloads my-listings — status should now be APPROVED
        const myListingsRes2 = await hostPage.request.get(`${API}/homestays/my-listings`, {
            headers: { 'Authorization': `Bearer ${hostToken}` }
        });
        const myListings2 = await myListingsRes2.json();
        const cloud9After = myListings2.find((h: any) => h.name === 'Cloud 9 Homestay');
        expect(cloud9After).toBeTruthy();
        expect(cloud9After.status).toBe('APPROVED');
        console.log('Host sees APPROVED status ✓');

        // 9. Public search for "Cloud 9" should now return 1 result
        const publicSearch2 = await hostPage.request.get(`${API}/homestays/search?query=Cloud 9`);
        const searchResults2 = await publicSearch2.json();
        const cloud9InSearch2 = searchResults2.filter((h: any) => h.name === 'Cloud 9 Homestay');
        expect(cloud9InSearch2.length).toBe(1);
        console.log('Public search after approval: 1 result ✓');
    });
});

test.describe('Scenario B: Instant Post Flow', () => {
    test('User creates post → instant appearance in feed and search', async ({ page }) => {
        // 1. Login as guest user
        await login(page, 'guest@example.com', 'password');

        // 2. Navigate to /community
        await page.goto(`${BASE}/community`);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('h1')).toContainText('Community');

        // 3. Click "Share Experience"
        const shareBtn = page.locator('#share-experience-btn');
        await expect(shareBtn).toBeVisible({ timeout: 5000 });
        await shareBtn.click();

        // 4. Fill in the modal form
        await page.fill('#post-location', 'Tinchuley');
        await page.fill('#post-text', 'Amazing sunrise!');

        // 5. Submit
        const submitBtn = page.locator('#submit-post-btn');
        await submitBtn.click();
        await page.waitForTimeout(1500);

        // 6. Assert post appears at top of feed (modal should close)
        await expect(page.locator('#posts-feed')).toBeVisible({ timeout: 5000 });
        const firstPost = page.locator('#posts-feed > div').first();
        await expect(firstPost).toContainText('Tinchuley');
        await expect(firstPost).toContainText('Amazing sunrise!');
        console.log('Post appears instantly in feed ✓');

        // 7. Search for "Tinchuley" in community
        await page.fill('#community-search', 'Tinchuley');
        await page.click('#search-btn');
        await page.waitForTimeout(1000);

        // Assert search results contain the post
        await expect(page.locator('#posts-feed')).toContainText('Amazing sunrise!');
        console.log('Community search finds post ✓');
    });
});

