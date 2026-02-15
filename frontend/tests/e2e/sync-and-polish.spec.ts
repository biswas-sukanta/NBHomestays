import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const HOST_EMAIL = 'host@test.com';
const HOST_PASS = 'host123';
const BASE = 'http://localhost:3000';

/**
 * Test 1: Contract Verification
 * Runs the gen:api script and asserts:
 *   - Exit code 0
 *   - Generated model file exists with photoUrls array field
 */
test('Contract: gen:api succeeds and generates Homestay model with photoUrls', async () => {
    const frontendDir = path.resolve(__dirname, '../..');

    // Run the gen:api script
    let exitCode = 0;
    try {
        execSync('npx openapi-generator-cli generate -i http://localhost:8080/v3/api-docs -g typescript-axios -o ./src/lib/api -c openapi-config.json', {
            cwd: frontendDir,
            timeout: 120_000,
            stdio: 'pipe',
        });
    } catch (err: any) {
        exitCode = err.status ?? 1;
    }

    expect(exitCode).toBe(0);

    // Assert the generated Homestay model contains photoUrls as array
    const modelPath = path.join(frontendDir, 'src', 'lib', 'api', 'models', 'homestay.ts');
    expect(fs.existsSync(modelPath)).toBe(true);

    const content = fs.readFileSync(modelPath, 'utf-8');
    expect(content).toContain("'photoUrls'?: Array<string>");
});

/**
 * Test 2: Security Visual Check
 * On /search page, homestay cards should NOT have a Delete button.
 */
test('Security: no Delete button visible on search homestay cards', async ({ page }) => {
    // Navigate to search (public page)
    await page.goto(`${BASE}/search`);

    // Wait for cards to render
    const cards = page.locator('.group.block.relative');

    // If there are no cards (empty db), we skip the check
    const count = await cards.count();
    if (count === 0) {
        test.skip(true, 'No homestay cards to check');
        return;
    }

    // Assert no Delete button exists in any card
    const deleteButtons = page.locator('[aria-label="Delete"]');
    await expect(deleteButtons).toHaveCount(0);

    // Also check there's no button containing "Delete" text on the page
    const deleteTextButtons = page.locator('button:has-text("Delete")');
    await expect(deleteTextButtons).toHaveCount(0);
});

/**
 * Test 3: Layout Check
 * The page title h1 on /search must be below the Navbar (y > 60px)
 */
test('Layout: search page title is below the fixed Navbar', async ({ page }) => {
    await page.goto(`${BASE}/search`);

    // Wait for the h1 to appear (contains "All Homestays" when no query)
    const heading = page.locator('h1').first();
    await heading.waitFor({ state: 'visible', timeout: 10000 });

    const box = await heading.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.y).toBeGreaterThan(60);
});
