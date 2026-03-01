import { test, expect } from '@playwright/test';

test.describe('NB-HOMESTAY FULL SYSTEM VALIDATION', () => {
    test.describe.configure({ mode: 'serial' });
    const timestamp = Date.now() + Math.floor(Math.random() * 1000);
    const USER_EMAIL = `full.user.${timestamp}@test.com`;
    const HOST_EMAIL = `full.host.${timestamp}@test.com`;
    const ADMIN_EMAIL = `full.admin.${timestamp}@test.com`;
    const PASSWORD = 'password123';
    const HOMESTAY_NAME = `Full Validation Stay ${timestamp}`;
    let homestayId: string;

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    // Increase timeout for the whole suite
    test.setTimeout(120000);

    async function loginAs(page: any, email: string, pass: string) {
        console.log(`Attempting login for ${email}...`);
        await page.goto('/login');
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', pass);
        await page.click('button:has-text("Sign in")');

        // Wait for Logout button to appear (means we are logged in)
        try {
            await expect(page.locator('button:has-text("Logout"), a:has-text("Logout")').first()).toBeVisible({ timeout: 15000 });
            console.log(`Login successful for ${email}`);
        } catch (e) {
            console.log(`Login failed/timed out for ${email}. Current URL: ${page.url()}`);
            await page.screenshot({ path: `login_failed_${email.replace('@', '_')}.png` });
            throw e;
        }
    }

    test('FULL SYSTEM VALIDATION JOURNEY', async ({ page, request }) => {
        console.log('Starting Unified Validation Journey');

        // --- STEP 1: Admin & Host Onboarding ---
        await test.step('Step 1: Admin & Host Onboarding', async () => {
            // 1.1 Register Host
            const hostReg = await request.post('/api/auth/register', {
                data: { firstname: 'Host', lastname: 'NBH', email: HOST_EMAIL, password: PASSWORD, role: 'ROLE_HOST' }
            });
            expect(hostReg.status()).toBe(200);

            // 1.2 Register Admin
            const adminReg = await request.post('/api/auth/register', {
                data: { firstname: 'Admin', lastname: 'NBH', email: ADMIN_EMAIL, password: PASSWORD, role: 'ROLE_ADMIN' }
            });
            expect(adminReg.status()).toBe(200);

            // 1.3 Create Homestay as Host
            const hostAuth = await request.post('/api/auth/authenticate', {
                data: { email: HOST_EMAIL, password: PASSWORD }
            });
            const hostToken = (await hostAuth.json()).accessToken;

            const homeRes = await request.post('/api/homestays', {
                headers: { 'Authorization': `Bearer ${hostToken}` },
                data: {
                    name: HOMESTAY_NAME,
                    description: 'A beautiful test homestay for full validation.',
                    pricePerNight: 2000,
                    latitude: 27.0,
                    longitude: 88.0,
                    locationName: `City${timestamp}`,
                    amenities: { wifi: true, parking: true },
                    media: [{ url: '' }]
                }
            });
            expect(homeRes.status()).toBe(200);
            homestayId = (await homeRes.json()).id;
            console.log('Step 1: homestayId set to:', homestayId);

            // 1.4 Approve Homestay as Admin
            const adminAuth = await request.post('/api/auth/authenticate', {
                data: { email: ADMIN_EMAIL, password: PASSWORD }
            });
            const adminToken = (await adminAuth.json()).accessToken;

            const approveRes = await request.put(`/api/homestays/${homestayId}/approve`, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            expect(approveRes.status()).toBe(200);
            console.log('Step 1 Complete. homestayId:', homestayId);
        });

        // --- STEP 2: Discovery & Inquiry Flow ---
        await test.step('Step 2: Discovery & Inquiry Flow', async () => {
            console.log('Step 2: Starting Discovery for homestayId:', homestayId);

            let found = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                console.log(`Discovery attempt ${attempt}...`);
                await page.goto('/');
                await page.fill('input[placeholder*="Where to?"]', `City${timestamp}`);
                await page.click('button:has-text("Explore Vibey Stays")');

                await page.waitForURL(new RegExp(`search\\?query=City${timestamp}`));
                await expect(page.locator('h1')).toContainText(`City${timestamp}`);

                const cardLink = page.locator(`a[href="/homestays/${homestayId}"]`).first();
                if (await cardLink.isVisible()) {
                    await cardLink.click();
                    found = true;
                    break;
                }
                console.log(`Homestay ${homestayId} not found in attempt ${attempt}. Retrying...`);
                await page.waitForTimeout(3000);
            }

            if (!found) {
                console.log('Step 2 failure. Search grid HTML:', await page.locator('.grid').first().innerHTML().catch(() => 'no grid'));
                await page.screenshot({ path: 'step2_grid_final_failure.png' });
                throw new Error(`Could not find homestay ${homestayId} after 3 attempts`);
            }

            console.log('Navigated to Details Page');
            await page.waitForURL(new RegExp(`/homestays/${homestayId}`));

            // 2.3 Verify Antigravity Excision
            await expect(page.locator('h1')).toContainText(HOMESTAY_NAME);
            await expect(page.getByText(/Love this vibe?/)).toBeVisible();
            await expect(page.getByRole('button', { name: /Enquire via WhatsApp/i })).toBeVisible();

            // Ensure no old booking elements
            await expect(page.locator('#checkin')).toBeHidden();
            await expect(page.locator('button:has-text("Reserve")')).toBeHidden();
            console.log('Step 2 Complete');
        });

        // --- STEP 3: Community & Shoppable Experience ---
        await test.step('Step 3: Community & Shoppable Experience', async () => {
            await loginAs(page, HOST_EMAIL, PASSWORD);

            await page.goto('/community');
            await page.click('#share-experience-btn');

            await page.fill('#post-location', `City${timestamp}`);
            await page.fill('#post-text', `Check out this amazing vibe at ${HOMESTAY_NAME}!`);
            await page.selectOption('#post-homestay', homestayId);

            await Promise.all([
                page.waitForResponse(res => res.url().includes('/api/posts') && res.status() === 200),
                page.click('#submit-post-btn')
            ]);

            // 3.2 Verify Shoppable Gateway
            const post = page.locator(`[data-post-id]`).first();
            await expect(post.getByText(HOMESTAY_NAME, { exact: true })).toBeVisible();

            const vibeButton = post.getByRole('button', { name: 'Book This Vibe' });
            await expect(vibeButton).toBeVisible();

            // 3.3 Viral Loop Test
            await vibeButton.click();
            await page.waitForURL(new RegExp(`/homestays/${homestayId}`));
            await expect(page.locator('h1')).toContainText(HOMESTAY_NAME);
            console.log('Step 3 Complete');
        });

        // --- STEP 4: Host Dashboard & Profiles ---
        await test.step('Step 4: Host Dashboard & Profiles', async () => {
            // Already logged in as Host from Step 3
            // Host Dashboard
            console.log('Step 4: Host Dashboard & Profiles');
            await page.goto('http://localhost:3000/host/dashboard');

            try {
                // Wait for even longer and look anywhere in the text content
                await expect(page.locator('body')).toContainText(HOMESTAY_NAME, { timeout: 30000 });
            } catch (e) {
                console.log('Step 4 Content Debug:');
                console.log(await page.content());
                throw e;
            }

            // Profile
            await page.goto('http://localhost:3000/profile');
            // Look for 'Host' role badge/text specifically, case-insensitive
            await expect(page.locator('body')).toContainText(/Host/i, { timeout: 15000 });
            await expect(page.getByText(`Check out this amazing vibe at ${HOMESTAY_NAME}!`)).toBeVisible({ timeout: 15000 });
            console.log('Step 4 Complete');
        });
    });
});

