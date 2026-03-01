import { test, expect } from '@playwright/test';

test.describe.serial('Approval Pipeline: Ghost to Live', () => {
    let homestayId: string;
    const timestamp = Date.now();
    const homestayName = `Invisible Villa ${timestamp}`;

    test('Step 1 & 2: Host submits homestay and sees PENDING badge', async ({ page }) => {
        test.setTimeout(120000);
        page.on('console', msg => console.log(`HOST [${msg.type()}]: ${msg.text()}`));

        // --- Login as Host ---
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'host@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // --- Add Homestay ---
        await page.goto('http://localhost:3000/host/add-homestay');

        // Step 1: Basics
        await page.fill('#name', homestayName);
        await page.fill('#description', 'A villa that should not be visible to guests until approved');
        await page.fill('#price', '3500');
        await page.click('button:has-text("Next")');

        // Step 2: Location — search then click map (mirrors working RBAC test)
        await page.fill('input[placeholder*="Search"]', 'Darjeeling');
        await page.click('button:has-text("Search"), button:has(.lucide-search)');
        await page.waitForTimeout(4000);

        const map = page.locator('.leaflet-container');
        await map.click({ position: { x: 300, y: 200 }, force: true });
        await page.waitForTimeout(1000);

        // Verify lat/lng are populated
        const latInput = page.locator('input[data-testid="lat-input"]');
        const lat = await latInput.inputValue();
        console.log(`Location set: lat=${lat}`);
        expect(lat).not.toBe('');

        await page.click('button:has-text("Next")');

        // Step 3: Amenities — skip
        await page.click('button:has-text("Next")');

        // Step 4: Photos
        await page.fill('#photos', `https://example.com/invisible-${timestamp}.jpg`);
        await page.click('button:has-text("Submit Listing")');

        // --- Verify redirect to dashboard ---
        await expect(page).toHaveURL(/.*\/host\/dashboard/, { timeout: 30000 });

        // --- Verify PENDING badge ---
        await expect(page.getByText(homestayName)).toBeVisible({ timeout: 10000 });

        // Find the card containing our homestay and check badge
        const card = page.locator(`text=${homestayName}`).locator('..');
        await expect(card.locator('text=PENDING')).toBeVisible();

        // --- Capture ID via API ---
        const token = await page.evaluate(() => localStorage.getItem('token'));
        const listingsRes = await page.request.get('http://localhost:8080/api/homestays/my-listings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        expect(listingsRes.ok()).toBeTruthy();

        const listings = await listingsRes.json();
        const myStay = listings.find((h: any) => h.name === homestayName);
        expect(myStay).toBeDefined();
        homestayId = myStay.id;
        console.log(`Captured Homestay ID: ${homestayId}, Status: ${myStay.status}`);
        expect(myStay.status).toBe('PENDING');
    });

    test('Step 3: Guest cannot find the pending homestay in search', async ({ browser }) => {
        if (!homestayId) test.skip(true, 'No homestay created');

        const context = await browser.newContext(); // Fresh context, no auth
        const page = await context.newPage();

        // Search for the homestay by querying the backend search endpoint
        const searchRes = await page.request.get(`http://localhost:8080/api/homestays/search?q=${encodeURIComponent(homestayName)}`);
        const results = await searchRes.json();
        const found = results.find((h: any) => h.name === homestayName);
        expect(found).toBeUndefined();
        console.log(`Guest search returned ${results.length} results, target NOT found (correct)`);

        await context.close();
    });

    test('Step 4 & 5: Admin sees pending homestay and approves it', async ({ page }) => {
        if (!homestayId) test.skip(true, 'No homestay created');
        test.setTimeout(60000);

        // --- Login as Admin ---
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'admin@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // --- Go to Admin Dashboard ---
        await page.goto('http://localhost:3000/admin');

        // --- Verify homestay is visible ---
        await expect(page.getByText(homestayName)).toBeVisible({ timeout: 15000 });

        // --- Click Approve ---
        const card = page.locator(`text=${homestayName}`).locator('..').locator('..');
        await card.locator('button:has-text("Approve")').click();

        // --- Verify it disappears from pending ---
        await expect(page.getByText(homestayName)).not.toBeVisible({ timeout: 5000 });

        // --- API verification: status is now APPROVED ---
        const res = await page.request.get(`http://localhost:8080/api/homestays/${homestayId}`);
        const data = await res.json();
        console.log(`After approval — Status: ${data.status}`);
        expect(data.status).toBe('APPROVED');
    });

    test('Step 6: Host sees APPROVED badge on dashboard', async ({ page }) => {
        if (!homestayId) test.skip(true, 'No homestay created');
        test.setTimeout(60000);

        // --- Login as Host ---
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'host@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/');

        // --- Go to Host Dashboard ---
        await page.goto('http://localhost:3000/host/dashboard');

        // --- Verify APPROVED badge ---
        await expect(page.getByText(homestayName)).toBeVisible({ timeout: 10000 });
        const card = page.locator(`text=${homestayName}`).locator('..');
        await expect(card.locator('text=APPROVED')).toBeVisible();
    });
});

