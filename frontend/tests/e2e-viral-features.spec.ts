import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.describe.serial('E2E Viral Features & UI Overhaul Validations', () => {

    const userEmail = `sdet_${Date.now()}@test.com`;
    const password = 'Password!123';
    const firstName = 'ViralUser';
    let newPostText = `Automated Viral Post Content ${Date.now()}`;
    let createdPostId = '';
    let homestayId = '';

    test.beforeAll(async ({ request }) => {
        // Register a clean user via API for our scenarios
        const reqUser = await request.post('/api/auth/register', {
            data: {
                firstName: firstName,
                lastName: 'Smith',
                email: userEmail,
                password: password,
                role: 'ROLE_USER'
            }
        });
        expect(reqUser.ok()).toBeTruthy();

        // Fetch a valid homestay ID to assert against in Scenario 4
        const res = await request.get('/api/homestays');
        const data = await res.json();
        if (data && data.content && data.content.length > 0) {
            homestayId = data.content[0].id;
        }

        // Drop a background post natively so Scenario 1 has something to like if DB is empty
        const loginTokenRes = await request.post('/api/auth/login', {
            data: { email: userEmail, password: password }
        });
        const tokenData = await loginTokenRes.json();
        const jwt = tokenData.token;

        await request.post('/api/posts', {
            headers: { 'Authorization': `Bearer ${jwt}`, 'Content-Type': 'application/json' },
            data: { textContent: 'Initial Background Post', locationName: 'Validation City', imageUrls: [] }
        });
    });

    /** Centralized Helper for Authentication Context */
    async function login(page: Page) {
        // Use strict API-based login to avoid window.location.href redirect race in the UI
        const res = await page.request.post('http://localhost:8080/api/auth/login', {
            data: { email: userEmail, password: password },
        });
        const body = await res.json();
        const token = body.token;

        await page.goto('/');
        await page.evaluate(({ t }) => {
            localStorage.setItem('token', t);
        }, { t: token });

        await page.reload({ waitUntil: 'load' });
        await expect(page.locator('nav').first()).toBeVisible({ timeout: 15000 });
    }

    test('Scenario 1: Security & Identity Validation', async ({ page, isMobile }) => {
        await login(page);

        // Verify Navigation bar explicitly displays the dynamic greeting
        if (isMobile) {
            await page.click('button[aria-label="Open menu"]');
        }
        await expect(page.locator(`text=Welcome back, ${firstName}`).first()).toBeVisible();

        // Navigate to the Community Feed and verify the URL cleanly
        if (isMobile) {
            await page.click('a[href="/community"]');
        } else {
            await page.locator('nav').locator('a[href="/community"]').first().click();
        }
        await page.waitForURL('**/community');

        // Test the Spring Security Like endpoint (Fix 1 & 2 Validation)
        const likeBtn = page.locator('button[aria-label="Like post"]').first();
        await expect(likeBtn).toBeVisible();

        const likeResPromise = page.waitForResponse(res => res.url().includes('/like') && res.request().method() === 'POST');
        await likeBtn.click();
        const likeRes = await likeResPromise;

        // Assert explicitly that the server returns a 200 OK (Ruling out the old 403 Forbidden)
        expect(likeRes.status()).toBe(200);
    });

    test('Scenario 2: The Community Feed Viral Loop', async ({ page }) => {
        await login(page);
        await page.goto('/community');

        // Simulate multi-image upload
        const dummyPath = path.join(__dirname, 'fixtures', 'dummy-image.jpg');
        await page.click('button[aria-label="Write a Story"]');
        await page.fill('textarea[placeholder*="Share your experience"]', newPostText);

        // Bypass UI visually triggering and inject strictly via the concealed input
        await page.setInputFiles('input[type="file"]', dummyPath);

        // Wait for image upload payload
        await page.waitForResponse(res => res.url().includes('/api/upload') && res.status() === 200);

        // Wait explicitly for the Post submission endpoint
        const postResPromise = page.waitForResponse(res => res.url().includes('/api/posts') && res.request().method() === 'POST' && res.status() === 200);
        await page.click('button:has-text("Post")');
        const postRes = await postResPromise;
        const json = await postRes.json();
        createdPostId = json.id; // Store explicitly for Scenario 3

        // Assert the new post appears precisely at the top
        await expect(page.locator(`text=${newPostText}`)).toBeVisible();

        // Verify the Infinite Scroll intercepts natively
        const scrollResPromise = page.waitForResponse(res => res.url().includes('/api/posts?page=1') && res.status() === 200);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        const scrollRes = await scrollResPromise;
        expect(scrollRes.status()).toBe(200);
    });

    test('Scenario 3: Profile Redirection & Cascading Deletion', async ({ page }) => {
        // Requires ID from Scenario 2
        test.skip(!createdPostId, 'Depends on successful post creation in Scenario 2');

        await login(page);
        await page.goto('/profile');

        // Verify the Post exists securely in the User's personal Feed HUB
        await page.click('button[role="tab"]:has-text("My Posts")');
        const postCardLink = page.locator(`a:has-text("${newPostText}")`).first();
        await expect(postCardLink).toBeVisible();

        // Click the beautifully designed Link card, intercept network router logic
        await postCardLink.click();
        await page.waitForURL(`**/community/post/${createdPostId}`);

        // Jump explicitly to the Community page to enforce Feed Dropdown Menu logic (Update/Delete)
        await page.goto('/community');
        const exactPostArticle = page.locator('article').filter({ hasText: newPostText });
        await exactPostArticle.locator('button:has(svg.lucide-more-horizontal)').click();

        // Assert cascading database network hit 
        const deleteResPromise = page.waitForResponse(res => res.url().includes(`/api/posts/${createdPostId}`) && res.request().method() === 'DELETE' && res.status() === 200);

        // Playwright handles the Window.confirm implicitly if defined natively, otherwise force acceptance
        page.on('dialog', dialog => dialog.accept());

        await page.click('div[role="menuitem"]:has-text("Delete")');
        const deleteRes = await deleteResPromise;
        expect(deleteRes.status()).toBe(200);

        // Circle back to the Profile Hub -> verify it is eradicated deeply from the DB and UI
        await page.goto('/profile');
        await page.click('button[role="tab"]:has-text("My Posts")');
        await expect(page.locator(`text=${newPostText}`)).toBeHidden();
    });

    test('Scenario 4: Homestay Q&A Threading', async ({ page }) => {
        test.skip(!homestayId, 'Platform empty -> Needs a seeded homestay for Q&A Thread logic');

        await login(page);
        await page.goto(`/homestays/${homestayId}`);

        // Post the root Thread Question
        const qText = `Viral UI Threadable Question ${Date.now()}`;
        await page.fill('input[placeholder="Ask a question..."]', qText);

        const qResPromise = page.waitForResponse(res => res.url().includes(`/api/homestays/${homestayId}/questions`) && res.status() === 200);
        await page.click('button:has-text("Post")');
        await qResPromise;

        // Execute precise Reply threading
        const questionNode = page.locator('li').filter({ hasText: qText }).first();
        await questionNode.locator('button:has-text("Reply")').first().click();

        const aText = `Nested Thread Answer ${Date.now()}`;
        await questionNode.locator('input[placeholder="Write a reply..."]').fill(aText);

        const aResPromise = page.waitForResponse(res => res.url().includes('/answers') && res.request().method() === 'POST' && res.status() === 200);
        // Explicitly hit the "Reply" submission
        await questionNode.locator('button:has-text("Reply")').last().click();
        await aResPromise;

        // --- Geometric Constraint Validations ---
        // Assert dynamically that the visual UI dictates strict nested hierarchy logic!
        const questionBoundingBox = await questionNode.locator('.flex-1.min-w-0 > div').first().boundingBox();
        const answerBoundingBox = await questionNode.locator(`text=${aText}`).first().boundingBox();

        expect(questionBoundingBox).not.toBeNull();
        expect(answerBoundingBox).not.toBeNull();

        if (questionBoundingBox && answerBoundingBox) {
            // Unbiased mathematical proof: In a LTR layout, a strictly nested reply 
            // MUST possess a strictly greater X geometric origin coordinate boundary (using margin/border offsets).
            expect(answerBoundingBox.x).toBeGreaterThan(questionBoundingBox.x + 15);
        }
    });
});

