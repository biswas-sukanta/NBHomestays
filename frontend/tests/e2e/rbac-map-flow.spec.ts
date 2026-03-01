import { test, expect } from '@playwright/test';

test.describe.serial('RBAC & Map Flow Tests', () => {
    let homestayId: string;
    const timestamp = Date.now();
    const homestayName = `Map Stay ${timestamp}`;

    test.beforeAll(async () => {
        // Ensure backend is reachable? 
        // We rely on standard timeout.
    });

    test('Host: Create Listing with Map', async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOAD [${msg.type()}]: ${msg.text()}`));
        test.setTimeout(120000); // 2 minutes

        // 1. Login
        await page.goto('http://localhost:3000/login');
        await page.fill('input[type="email"]', 'host@example.com');
        await page.fill('input[type="password"]', 'password');
        await page.click('button[type="submit"]'); // Assuming button type="submit"
        await expect(page).toHaveURL('/');

        // 2. Navigate to Add Homestay
        await page.goto('http://localhost:3000/host/add-homestay');

        // Step 1: Basics
        await page.fill('#name', homestayName);
        await page.fill('#description', 'A beautiful test stay with map location');
        await page.fill('#price', '4500');
        await page.click('button:has-text("Next")');

        // Step 2: Location Map
        // Verify hidden inputs empty
        const latInput = page.locator('input[data-testid="lat-input"]');
        const lngInput = page.locator('input[data-testid="lng-input"]');
        await expect(latInput).toHaveValue('');

        // Search "Darjeeling"
        await page.fill('input[placeholder*="Search"]', 'Darjeeling');
        await page.click('button:has-text("Search"), button:has(.lucide-search)');
        // Wait for map animation/network
        await page.waitForTimeout(4000);

        // Click on map to set marker (center)
        const map = page.locator('.leaflet-container');
        await map?.click({ position: { x: 300, y: 200 }, force: true });
        await page.waitForTimeout(1000);

        // Verify inputs
        const lat = await latInput.inputValue();
        const lng = await lngInput.inputValue();
        console.log(`Selected Location: ${lat}, ${lng}`);
        expect(Number(lat)).not.toBeNaN();
        expect(Number(lng)).not.toBeNaN();
        expect(lat).not.toBe('');

        await page.click('button:has-text("Next")');

        // Step 3: Amenities
        await page.click('button:has-text("Next")');

        // Step 4: Photos
        await page.fill('#photos', `https://example.com/photo-${timestamp}.jpg`);
        await page.click('button:has-text("Submit Listing")');

        // 3. Verify on Dashboard
        await expect(page).toHaveURL(/.*\/host\/dashboard/, { timeout: 30000 });
        await expect(page.getByText(homestayName)).toBeVisible({ timeout: 10000 });

        // 4. Capture ID via API (Robust)
        // Actually, getting token from localStorage in Playwright:
        const token = await page.evaluate(() => localStorage.getItem('token'));

        // Hit Backend directly to avoid Next.js proxy issues
        const listingsRes = await page.request.get('http://localhost:8080/api/homestays/my-listings', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!listingsRes.ok()) {
            console.error(`Failed to fetch listings: ${listingsRes.status()} ${listingsRes.statusText()}`);
            // Force fail to see logs
            expect(listingsRes.ok()).toBeTruthy();
        }

        const listings = await listingsRes.json();
        const myStay = listings.find((h: any) => h.name === homestayName);

        if (myStay) {
            homestayId = myStay.id;
            console.log(`Captured Homestay ID via API: ${homestayId}`);
        } else {
            console.error('Failed to find homestay in my-listings');
            // Fail test?
            expect(myStay).toBeDefined();
        }
    });

    test.describe('Guest & Admin Tests', () => {
        test('Guest: Read-Only Map & Permissions', async ({ browser }) => {
            if (!homestayId) test.skip(true, 'No homestay created');

            const context = await browser.newContext();
            const page = await context.newPage();
            page.on('console', msg => console.log(`GUEST [${msg.type()}]: ${msg.text()}`));

            // 1. Visit Details Page
            await page.goto(`http://localhost:3000/homestays/${homestayId}`);

            // 2. Verify Map
            // Check if loading
            await expect(page.getByText('Loading Map...')).toBeHidden({ timeout: 10000 });

            // Check map
            // Note: leaflet-container is a class on the map div
            await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 10000 });

            await expect(page.locator('input[data-testid="lat-input"]')).not.toBeVisible(); // Hidden or non-existent
            await expect(page.locator('text=Selected Location')).not.toBeVisible();
            // Readonly popup shouldn't show "Selected" immediately? Actually it might if we set it to open by default?
            // Current LocationPicker doesn't auto-open popup in readonly.

            // 3. Negative Assert: No Edit/Delete
            await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
            await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();

            await context.close();
        });

        test('Admin: Override Delete', async ({ page }) => {
            if (!homestayId) test.skip(true, 'No homestay created');
            page.on('console', msg => console.log(`ADMIN [${msg.type()}]: ${msg.text()}`));

            // 1. Login Admin
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'admin@example.com');
            await page.fill('input[type="password"]', 'password');
            await page.click('button[type="submit"]');
            await expect(page).toHaveURL('/');

            // 2. Go to Listing
            await page.goto(`http://localhost:3000/homestays/${homestayId}`);

            // 3. Verify Admin Delete Button exists
            await expect(page.locator('button:has-text("Delete")')).toBeVisible({ timeout: 10000 });

            // 4. Delete
            // Triggers Modal
            await page.click('button:has-text("Delete")');

            // Wait for Modal
            await expect(page.getByText('Confirm Deletion')).toBeVisible();

            // Click Confirm inside Modal (The destructive button)
            // There might be two deletions on screen (one trigger, one in modal).
            // Modal one is usually last or inside dialog.
            await page.locator('div[role="dialog"] button:has-text("Delete")').click();

            // 5. Verify Redirect or Gone
            await expect(page).not.toHaveURL(/.*\/homestays\/.+/);
            // Verify 404
            const res = await page.request.get(`http://localhost:8080/api/homestays/${homestayId}`);
            expect(res.status()).toBe(404);
        });
    });

});

