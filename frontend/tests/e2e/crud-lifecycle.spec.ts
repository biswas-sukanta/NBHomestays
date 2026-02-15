import { test, expect } from '@playwright/test';

test.describe.serial('CRUD Lifecycle Tests', () => {

    test('Host Homestay Lifecycle: Create -> Update -> Delete', async ({ page }) => {
        console.log('Starting Host Lifecycle Test');
        test.setTimeout(60000); // 60s timeout
        try {
            // 1. Login as Host
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'host@example.com');
            await page.fill('input[type="password"]', 'password');
            await page.click('button[type="submit"]');
            await expect(page).toHaveURL('/');
            console.log('Logged in');

            // 2. Direct Navigation to Dashboard (bypassing Navbar)
            await page.goto('http://localhost:3000/host/dashboard');
            await expect(page).toHaveURL(/.*\/host\/dashboard/);
            console.log('Navigated to Dashboard');

            // Click Add Homestay
            // It's a button inside a link. Playwright can click the text.
            await page.click('text=Add Homestay');
            await expect(page).toHaveURL(/.*\/host\/add-homestay/);
            console.log('On Wizard');

            // 3. Wizard Step 1: Basic Info
            const homestayName = `Test Homestay ${Date.now()}`;
            await page.fill('input[id="name"]', homestayName);
            await page.fill('textarea[id="description"]', 'A beautiful test homestay');
            await page.fill('input[id="price"]', '1500');
            await page.click('button:has-text("Next")');
            console.log('Step 1 complete');

            // Step 2: Location
            await page.click('button:has-text("Next")');
            console.log('Step 2 complete');

            // Step 3: Amenities
            // Using force click for amenities checkbox
            await page.locator('input#WiFi').click({ force: true });
            await page.click('button:has-text("Next")');
            console.log('Step 3 complete');

            // Step 4: Photos
            await page.fill('textarea[id="photos"]', 'https://example.com/image1.jpg');
            await page.click('button:has-text("Submit Listing")');
            console.log('Submitted Listing');

            // 4. Verify Redirect to Dashboard and Listing Exists
            await expect(page).toHaveURL(/.*\/host\/dashboard/);
            // Wait for list to load
            await expect(page.getByText(homestayName)).toBeVisible({ timeout: 15000 });
            console.log('Listing verified on dashboard');

            // 5. Update Homestay
            const row = page.locator('.flex-row', { hasText: homestayName });
            await row.locator('button:has-text("Edit")').click();
            console.log('Clicked Edit');
            await expect(page.locator('div[role="dialog"]')).toBeVisible();

            const updatedName = homestayName + " Updated";
            await page.fill('div[role="dialog"] input', updatedName);
            await page.click('button:has-text("Save Changes")');
            console.log('Saved changes');

            // Verify Update
            await expect(page.locator('div[role="dialog"]')).not.toBeVisible();
            await expect(page.getByText(updatedName)).toBeVisible({ timeout: 10000 });
            console.log('Update verified');

            // 6. Delete Homestay
            await page.locator('.flex-row', { hasText: updatedName }).locator('button:has-text("Delete")').click();
            console.log('Clicked Delete');
            await expect(page.locator('text=Confirm Deletion')).toBeVisible();
            await page.click('div[role="dialog"] button:has-text("Delete")');

            // Verify Deletion
            await expect(page.getByText(updatedName)).not.toBeVisible({ timeout: 10000 });
            console.log('Deletion verified');
        } catch (error) {
            console.error('Host Lifecycle Test Failed:', error);
            await page.screenshot({ path: 'host_failure.png', fullPage: true });
            throw error;
        }
    });

    test('Community Post Lifecycle: Create -> Edit -> Delete', async ({ page }) => {
        console.log('Starting Community Test');
        test.setTimeout(60000);
        try {
            // 1. Login as User (Guest)
            await page.goto('http://localhost:3000/login');
            await page.fill('input[type="email"]', 'guest@example.com');
            await page.fill('input[type="password"]', 'password');
            await page.click('button[type="submit"]');
            await expect(page).toHaveURL('/');

            // 2. Go to Community
            await page.click('text=Community');
            await expect(page).toHaveURL('/community');
            console.log('On Community Page');

            // 3. Share Experience
            await page.click('button:has-text("Share Experience")');
            await expect(page.getByText('Share Your Experience')).toBeVisible();

            const location = `Test Location ${Date.now()}`;
            const story = `This is a test story ${Date.now()}`;

            await page.fill('input[id="post-location"]', location);
            await page.fill('textarea[id="post-text"]', story);
            await page.click('button:has-text("Share")');
            console.log('Shared Post');

            // 4. Verify Post Appears
            await expect(page.getByText('Share Your Experience')).not.toBeVisible();
            await expect(page.locator('div#posts-feed')).toContainText(location);
            console.log('Post verified');

            // 5. Edit Post
            // Wait for buttons to appear (myPosts match)
            // This might take time as it fetches /my-posts
            await expect(page.locator('div#posts-feed').locator('.rounded-xl', { hasText: location }).locator('button:has-text("Edit")')).toBeVisible({ timeout: 15000 });

            await page.locator('div#posts-feed').locator('.rounded-xl', { hasText: location })
                .locator('button:has-text("Edit")').click();

            await expect(page.getByText('Edit Post')).toBeVisible();

            const updatedStory = story + " Updated";
            await page.fill('textarea', updatedStory);
            await page.click('button:has-text("Save")');
            console.log('Saved Update');

            // Verify Update
            await expect(page.getByText('Edit Post')).not.toBeVisible();
            await expect(page.locator('div#posts-feed')).toContainText(updatedStory);

            // 6. Delete Post
            page.on('dialog', dialog => dialog.accept());

            await page.locator('div#posts-feed').locator('.rounded-xl', { hasText: location })
                .locator('button:has-text("Delete")').click();
            console.log('Clicked Delete');

            // Verify Deletion
            await expect(page.getByText(location)).not.toBeVisible();
            console.log('Deletion Verified');
        } catch (e) {
            console.error('Community Test Failed', e);
            await page.screenshot({ path: 'community_fail.png', fullPage: true });
            throw e;
        }
    });

});
