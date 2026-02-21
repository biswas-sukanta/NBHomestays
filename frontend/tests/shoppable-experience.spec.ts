import { test, expect } from '@playwright/test';

test.describe('Shoppable Experiences (Viral Loop)', () => {
    const timestamp = Date.now();
    const USER_EMAIL = `nb.shopper.${timestamp}@test.com`;
    const PASSWORD = 'password123';
    const HOMESTAY_NAME = `Shoppable Stay ${timestamp}`;

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('Flow: Link Post to Homestay and Verify Booking Gateway', async ({ page }) => {
        // 1. Register and Login
        await page.goto('/register');
        await page.fill('input[name="firstname"]', 'Shopper');
        await page.fill('input[name="lastname"]', 'Tester');
        await page.fill('input[name="email"]', USER_EMAIL);
        await page.fill('input[name="password"]', PASSWORD);
        await page.selectOption('select[name="role"]', 'ROLE_HOST');

        await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/register') && res.status() === 200),
            page.click('button[type="submit"]')
        ]);

        await page.waitForURL('/');
        const token = await page.evaluate(() => localStorage.getItem('token'));
        expect(token).toBeDefined();

        // 2. Create a Homestay via API (Pending)
        const createHomestayRes = await page.request.post('/api/homestays', {
            headers: { 'Authorization': `Bearer ${token}` },
            data: {
                name: HOMESTAY_NAME,
                description: 'A vibe-worthy stay.',
                pricePerNight: 1500,
                latitude: 26.5,
                longitude: 88.5,
                locationName: 'Sittong',
                amenities: { wifi: true },
                photoUrls: ['https://images.unsplash.com/photo-1501785888041-af3ef285b470']
            }
        });
        const homestay = await createHomestayRes.json();
        const homestayId = homestay.id;

        // 3. Approve via Admin API
        const adminLoginRes = await page.request.post('/api/auth/authenticate', {
            data: { email: 'admin@test.com', password: 'password123' }
        });
        const adminData = await adminLoginRes.json();
        const adminToken = adminData.accessToken;

        await page.request.put(`/api/homestays/${homestayId}/approve`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });

        // 4. Share Experience and Link Homestay
        await page.goto('/community');
        await page.click('#share-experience-btn');

        await page.fill('#post-location', 'Sittong');
        await page.fill('#post-text', 'Check out this amazing place!');

        // Use selectOption on the homestay dropdown
        await page.selectOption('#post-homestay', homestayId);

        await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/posts') && res.status() === 200),
            page.click('#submit-post-btn')
        ]);

        // 5. Verify "Book This Vibe" button
        const bookButton = page.locator(`[data-post-id]`).first().getByRole('button', { name: 'Book This Vibe' });
        await expect(bookButton).toBeVisible();

        // 6. Navigate to Details
        await bookButton.click();
        await page.waitForURL(new RegExp(`/homestays/${homestayId}`));
        await expect(page.locator('h1')).toContainText(HOMESTAY_NAME);
    });
});
