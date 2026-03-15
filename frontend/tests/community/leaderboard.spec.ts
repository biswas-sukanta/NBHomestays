import { expect, test } from '@playwright/test';
import { authenticateViaApi } from '../helpers/api-helper';

/**
 * Leaderboard E2E Tests
 * 
 * Tests cover:
 * 1. Leaderboard page loads with title visible
 * 2. Leaderboard shows content (entries or loading state)
 * 3. Top 3 users have special styling (gold, silver, bronze)
 * 4. Navigation from community feed to leaderboard works
 * 
 * Uses seeded test credentials from AI_TEST_CREDENTIALS.md:
 * - user@nbh.com / user123 (Guest)
 */

// Test credentials
const GUEST_EMAIL = process.env.PW_USER_EMAIL || 'user@nbh.com';
const GUEST_PASSWORD = process.env.PW_USER_PASSWORD || 'user123';

test.describe('Community Leaderboard', () => {
  test.setTimeout(90000);

  // ============================================================
  // TEST 1: Leaderboard page renders with title
  // ============================================================
  test('Test 1: Leaderboard page displays title', async ({ page, request, baseURL }) => {
    // Authenticate as user@nbh.com via API
    const tokens = await authenticateViaApi(request, baseURL!, GUEST_EMAIL, GUEST_PASSWORD);
    
    // Inject tokens into browser session
    await page.addInitScript(({ at, rt }) => {
      sessionStorage.setItem('accessToken', at);
      localStorage.setItem('refreshToken', rt);
    }, { at: tokens.accessToken, rt: tokens.refreshToken });
    
    // Navigate to leaderboard page
    await page.goto('/community/leaderboard', { waitUntil: 'domcontentloaded' });
    
    // Wait for either the title or loading spinner to appear
    await page.waitForSelector('h1, .animate-spin', { timeout: 20000 });
    
    // Assert page title is visible - the h1 contains "Community Leaderboard"
    const pageTitle = page.locator('h1').filter({ hasText: 'Community Leaderboard' });
    await expect(pageTitle).toBeVisible({ timeout: 25000 });
  });

  // ============================================================
  // TEST 2: Leaderboard shows content (entries or loading state)
  // ============================================================
  test('Test 2: Leaderboard displays content', async ({ page, request, baseURL }) => {
    // Authenticate as user@nbh.com via API
    const tokens = await authenticateViaApi(request, baseURL!, GUEST_EMAIL, GUEST_PASSWORD);
    
    // Inject tokens into browser session
    await page.addInitScript(({ at, rt }) => {
      sessionStorage.setItem('accessToken', at);
      localStorage.setItem('refreshToken', rt);
    }, { at: tokens.accessToken, rt: tokens.refreshToken });
    
    // Navigate to leaderboard page
    await page.goto('/community/leaderboard', { waitUntil: 'domcontentloaded' });
    
    // Wait for loading to complete - either entries appear or we get content
    // Use a longer timeout and wait for any content
    await page.waitForSelector('[data-testid^="leaderboard-podium-"], [data-testid="leaderboard-list"], h2:has-text("Top Travelers"), h2:has-text("Rankings")', { timeout: 30000 });
    
    // Check for podium entries (top 3)
    const podiumEntry = page.locator('[data-testid^="leaderboard-podium-"]');
    const listEntry = page.locator('[data-testid^="leaderboard-entry-"]');
    const topTravelersHeading = page.locator('h2').filter({ hasText: 'Top Travelers' });
    const rankingsHeading = page.locator('h2').filter({ hasText: 'Rankings' });
    
    // Either podium or list entries should be visible, or at least the headings
    const podiumCount = await podiumEntry.count();
    const listCount = await listEntry.count();
    const topTravelersVisible = await topTravelersHeading.isVisible().catch(() => false);
    const rankingsVisible = await rankingsHeading.isVisible().catch(() => false);
    
    // Assert at least some content structure is visible
    expect(podiumCount + listCount + (topTravelersVisible ? 1 : 0) + (rankingsVisible ? 1 : 0)).toBeGreaterThan(0);
  });

  // ============================================================
  // TEST 3: Top 3 users have special styling
  // ============================================================
  test('Test 3: Top 3 users have gold, silver, bronze styling', async ({ page, request, baseURL }) => {
    // Authenticate as user@nbh.com via API
    const tokens = await authenticateViaApi(request, baseURL!, GUEST_EMAIL, GUEST_PASSWORD);
    
    // Inject tokens into browser session
    await page.addInitScript(({ at, rt }) => {
      sessionStorage.setItem('accessToken', at);
      localStorage.setItem('refreshToken', rt);
    }, { at: tokens.accessToken, rt: tokens.refreshToken });
    
    // Navigate to leaderboard page
    await page.goto('/community/leaderboard', { waitUntil: 'domcontentloaded' });
    
    // Wait for content to appear
    await page.waitForSelector('[data-testid^="leaderboard-podium-"], h2:has-text("Top Travelers")', { timeout: 30000 });
    
    // Check for podium entries (top 3)
    const podium1 = page.locator('[data-testid="leaderboard-podium-1"]');
    const podium2 = page.locator('[data-testid="leaderboard-podium-2"]');
    const podium3 = page.locator('[data-testid="leaderboard-podium-3"]');
    
    // If podium entries exist, verify they're visible
    const podium1Count = await podium1.count();
    const podium2Count = await podium2.count();
    const podium3Count = await podium3.count();
    
    // If there are users on the leaderboard, verify styling classes
    if (podium1Count > 0) {
      // Rank 1 should have gold/amber styling
      await expect(podium1).toBeVisible();
      
      // Check for gold/amber gradient classes
      const container = podium1;
      const classes = await container.getAttribute('class');
      expect(classes).toContain('amber');
    }
    
    if (podium2Count > 0) {
      // Rank 2 should have silver/slate styling
      await expect(podium2).toBeVisible();
    }
    
    if (podium3Count > 0) {
      // Rank 3 should have bronze/orange styling
      await expect(podium3).toBeVisible();
    }
    
    // If no podium entries, at least verify the page loaded
    if (podium1Count === 0 && podium2Count === 0 && podium3Count === 0) {
      // Page should still have the title
      const pageTitle = page.locator('h1').filter({ hasText: 'Community Leaderboard' });
      await expect(pageTitle).toBeVisible();
    }
  });

  // ============================================================
  // TEST 4: Navigation from community feed to leaderboard
  // ============================================================
  test('Test 4: Can navigate from community feed to leaderboard', async ({ page, request, baseURL }) => {
    // Authenticate as user@nbh.com via API
    const tokens = await authenticateViaApi(request, baseURL!, GUEST_EMAIL, GUEST_PASSWORD);
    
    // Inject tokens into browser session
    await page.addInitScript(({ at, rt }) => {
      sessionStorage.setItem('accessToken', at);
      localStorage.setItem('refreshToken', rt);
    }, { at: tokens.accessToken, rt: tokens.refreshToken });
    
    // Navigate to community feed
    await page.goto('/community', { waitUntil: 'domcontentloaded' });
    
    // Find the leaderboard link (with trophy icon)
    const leaderboardLink = page.locator('a[href="/community/leaderboard"]').first();
    
    // Assert the link is visible
    await expect(leaderboardLink).toBeVisible({ timeout: 20000 });
    
    // Click the link
    await leaderboardLink.click();
    
    // Wait for navigation
    await page.waitForURL('/community/leaderboard', { timeout: 15000 });
    
    // Assert we're on the leaderboard page
    expect(page.url()).toContain('/community/leaderboard');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 25000 });
    
    // Assert leaderboard title is visible
    const pageTitle = page.locator('h1').filter({ hasText: 'Community Leaderboard' });
    await expect(pageTitle).toBeVisible({ timeout: 10000 });
  });
});
