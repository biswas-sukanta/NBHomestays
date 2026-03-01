import { test, expect, Page } from '@playwright/test';

// ── NETWORK SPY HELPERS ──────────────────────────────────────────
function attachNetworkSpy(page: Page) {
    const log: string[] = [];
    page.on('request', (req) => {
        if (req.url().includes('/api/')) {
            log.push(`>> ${req.method()} ${req.url()}`);
        }
    });
    page.on('response', (res) => {
        if (res.url().includes('/api/')) {
            log.push(`<< ${res.status()} ${res.url()}`);
        }
    });
    return log;
}

function attachConsoleSpy(page: Page) {
    const errors: string[] = [];
    page.on('console', (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => {
        errors.push(`PAGE_ERROR: ${err.message}`);
    });
    return errors;
}

// ── PHASE 1 — STEP A: DIAGNOSTIC TEST ───────────────────────────
test.describe('PHASE 1: Login Rescue Diagnostic', () => {

    test('Diagnose Login for guest@example.com', async ({ page }) => {
        const netLog = attachNetworkSpy(page);
        const consoleErrors = attachConsoleSpy(page);

        // 1. Navigate to login
        await page.goto('/login');
        await expect(page.locator('input[placeholder="Email address"]')).toBeVisible();

        // 2. Fill credentials
        await page.fill('input[placeholder="Email address"]', 'guest@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        // 3. Click submit and wait for API response
        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/authenticate'), { timeout: 15000 }),
            page.click('button[type="submit"]'),
        ]);

        const status = response.status();
        console.log(`\n===== AUTH RESPONSE =====`);
        console.log(`Status: ${status}`);
        console.log(`URL: ${response.url()}`);
        console.log(`CORS: ${response.headers()['access-control-allow-origin'] ?? 'MISSING'}`);

        if (status >= 400) {
            let body = '';
            try { body = await response.text(); } catch { body = '<unreadable>'; }
            console.log(`Body: ${body}`);
        }

        console.log(`\n===== NETWORK LOG =====`);
        netLog.forEach(l => console.log(l));

        if (consoleErrors.length) {
            console.log(`\n===== CONSOLE ERRORS =====`);
            consoleErrors.forEach(e => console.log(e));
        }

        // Take screenshot regardless
        await page.screenshot({ path: 'login-result.png', fullPage: true });

        // 4. ASSERT: status must be 200
        expect(status, `Login returned ${status}. See logs above.`).toBe(200);

        // 5. ASSERT: should redirect to home
        await expect(page).toHaveURL('/', { timeout: 10000 });

        // 6. ASSERT: Logout button visible (proves auth state)
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Diagnose Login for host@example.com', async ({ page }) => {
        const netLog = attachNetworkSpy(page);
        await page.goto('/login');
        await page.fill('input[placeholder="Email address"]', 'host@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/authenticate'), { timeout: 15000 }),
            page.click('button[type="submit"]'),
        ]);

        const status = response.status();
        if (status >= 400) {
            let body = '';
            try { body = await response.text(); } catch { body = '<unreadable>'; }
            console.log(`HOST LOGIN FAILED (${status}): ${body}`);
            netLog.forEach(l => console.log(l));
        }
        await page.screenshot({ path: 'login-host-result.png', fullPage: true });
        expect(status, `Host login returned ${status}`).toBe(200);
        await expect(page).toHaveURL('/', { timeout: 10000 });
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Diagnose Login for admin@example.com', async ({ page }) => {
        const netLog = attachNetworkSpy(page);
        await page.goto('/login');
        await page.fill('input[placeholder="Email address"]', 'admin@example.com');
        await page.fill('input[placeholder="Password"]', 'password');

        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/authenticate'), { timeout: 15000 }),
            page.click('button[type="submit"]'),
        ]);

        const status = response.status();
        if (status >= 400) {
            let body = '';
            try { body = await response.text(); } catch { body = '<unreadable>'; }
            console.log(`ADMIN LOGIN FAILED (${status}): ${body}`);
            netLog.forEach(l => console.log(l));
        }
        await page.screenshot({ path: 'login-admin-result.png', fullPage: true });
        expect(status, `Admin login returned ${status}`).toBe(200);
        await expect(page).toHaveURL('/', { timeout: 10000 });
        await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    });

    test('Register new user (self-service)', async ({ page }) => {
        const netLog = attachNetworkSpy(page);
        await page.goto('/register');

        const uid = Date.now();
        await page.fill('input[name="firstname"]', 'E2E');
        await page.fill('input[name="lastname"]', 'Tester');
        await page.fill('input[name="email"]', `e2e_${uid}@test.com`);
        await page.fill('input[name="password"]', 'password');

        const [response] = await Promise.all([
            page.waitForResponse(res => res.url().includes('/api/auth/register'), { timeout: 15000 }),
            page.click('button[type="submit"]'),
        ]);

        const status = response.status();
        if (status >= 400) {
            let body = '';
            try { body = await response.text(); } catch { body = '<unreadable>'; }
            console.log(`REGISTER FAILED (${status}): ${body}`);
            netLog.forEach(l => console.log(l));
        }
        await page.screenshot({ path: 'register-result.png', fullPage: true });
        expect(status, `Register returned ${status}`).toBe(200);
        await expect(page).toHaveURL('/', { timeout: 10000 });
    });
});

