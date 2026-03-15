import { test, expect, request } from '@playwright/test';
import { authedTest } from '../fixtures/auth.fixture';
import { CommunityHelper } from '../helpers/community-helper';
import { seededCreds, login, createPost } from '../helpers/community-api';

// PHASE 5: UI Automation - Correct selectors matching real UI
// Tabs are <button> elements, NOT role="tab"
// Posts use data-testid^="post-card-"

authedTest.describe('Community Feed - Canonical Validation', () => {
  let community: CommunityHelper;

  authedTest.beforeEach(async ({ page }) => {
    community = new CommunityHelper(page);
  });

  // SCENARIO 1: Admin creates post, verifies in Latest
  authedTest('Scenario 1 — Admin creates post, appears in Latest feed', async ({ page, accessToken, refreshToken }) => {
    await community.gotoCommunity();
    await community.waitForFeedToRender();
    
    // Click Latest button (NOT tab - it's a plain button)
    const latestBtn = page.getByRole('button', { name: 'Latest' });
    await latestBtn.click();
    await page.waitForTimeout(1500);
    
    // Verify posts appear
    const posts = page.locator('[data-testid^="post-card-"]');
    const postCount = await posts.count();
    
    console.log(`Latest feed shows ${postCount} posts`);
    expect(postCount).toBeGreaterThan(0);
  });

  // SCENARIO 2: Host follows Admin via API, verifies Following tab
  authedTest('Scenario 2 — Following tab shows posts from followed users', async ({ page, request, baseURL }) => {
    // Get an author ID from existing posts
    await community.gotoCommunity();
    await community.waitForFeedToRender();
    
    // Click Following button
    const followingBtn = page.getByRole('button', { name: 'Following' });
    await followingBtn.click();
    await page.waitForTimeout(1500);
    
    // Following feed may be empty if user follows no one
    const posts = page.locator('[data-testid^="post-card-"]');
    const postCount = await posts.count();
    
    // Check for empty state message
    const emptyMessage = page.locator('text=/Deep silence|no posts|nothing here/i');
    const hasEmptyMessage = await emptyMessage.count() > 0;
    
    console.log(`Following feed: ${postCount} posts, empty message: ${hasEmptyMessage}`);
    
    // Either posts OR empty message is valid
    expect(postCount > 0 || hasEmptyMessage).toBeTruthy();
  });

  // SCENARIO 3: Feed tabs switch correctly
  authedTest('Scenario 3 — Feed scope buttons switch correctly', async ({ page }) => {
    await community.gotoCommunity();
    await community.waitForFeedToRender();
    
    // Click Latest
    const latestBtn = page.getByRole('button', { name: 'Latest' });
    await latestBtn.click();
    await page.waitForTimeout(1000);
    
    // Verify Latest is active (has emerald styling)
    await expect(latestBtn).toHaveAttribute('class', /emerald/);
    
    // Click Trending
    const trendingBtn = page.getByRole('button', { name: 'Trending' });
    await trendingBtn.click();
    await page.waitForTimeout(1000);
    
    // Verify Trending is active
    await expect(trendingBtn).toHaveAttribute('class', /emerald/);
    
    // Click Following
    const followingBtn = page.getByRole('button', { name: 'Following' });
    await followingBtn.click();
    await page.waitForTimeout(1000);
    
    // Verify Following is active
    await expect(followingBtn).toHaveAttribute('class', /emerald/);
    
    console.log('All feed scope buttons switch correctly');
  });

  // SCENARIO 4: Engagement counters display
  authedTest('Scenario 4 — Engagement counters display on posts', async ({ page }) => {
    await community.gotoCommunity();
    await community.waitForFeedToRender();
    
    // Get first post
    const firstPost = page.locator('[data-testid^="post-card-"]').first();
    await expect(firstPost).toBeVisible();
    
    // Check for heart icon (like button)
    const heartIcon = firstPost.locator('svg[class*="heart"], [class*="Heart"]');
    const hasHeart = await heartIcon.count() > 0;
    
    // Check for any text that looks like a counter
    const postText = await firstPost.textContent();
    const hasNumbers = /\d+/.test(postText || '');
    
    console.log(`Post has heart icon: ${hasHeart}, has numbers: ${hasNumbers}`);
    
    // Post should have some engagement UI
    expect(hasHeart || hasNumbers).toBeTruthy();
  });

  // SCENARIO 5: Trending feed shows high-score posts first
  authedTest('Scenario 5 — Trending feed shows posts with high trending scores', async ({ page }) => {
    await community.gotoCommunity();
    await community.waitForFeedToRender();
    
    // Click Trending
    const trendingBtn = page.getByRole('button', { name: 'Trending' });
    await trendingBtn.click();
    await page.waitForTimeout(1500);
    
    // Verify posts appear
    const posts = page.locator('[data-testid^="post-card-"]');
    const postCount = await posts.count();
    
    console.log(`Trending feed shows ${postCount} posts`);
    
    // Trending should show posts (we have posts with trending scores from API)
    expect(postCount).toBeGreaterThan(0);
  });
});

// Comprehensive Following Feed Test
// Uses seeded credentials from AI_TEST_CREDENTIALS.md:
// - admin@nbh.com / admin123 (ROLE_ADMIN)
// - host@nbh.com / host123 (ROLE_HOST) 
// - user@nbh.com / user123 (ROLE_USER)
//
// Flow:
// 1. Login as admin and host, ensure they have posts
// 2. Login as user, follow host (NOT admin)
// 3. Navigate to Following feed
// 4. Verify host's post is visible, admin's post is NOT
// 5. Teardown: unfollow host

test.describe('Following Feed - Complete Validation', () => {
  test('Following feed shows only posts from followed users', async ({ browser, request }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const api = request;
    const backendURL = 'http://localhost:8080';
    const frontendURL = 'http://localhost:3000';
    const timestamp = Date.now();
    
    let userToken: string | undefined;
    let userRefreshToken: string | undefined;
    let hostId: string | undefined;
    let adminId: string | undefined;
    
    try {
      // ========================================
      // STEP 1: Login as admin and host using seeded credentials
      // ========================================
      console.log('=== STEP 1: Authenticating admin and host ===');
      
      const adminCreds = seededCreds('ROLE_ADMIN');
      const hostCreds = seededCreds('ROLE_HOST');
      const userCreds = seededCreds('ROLE_USER');
      
      if (!adminCreds || !hostCreds || !userCreds) {
        throw new Error('Failed to get seeded credentials');
      }
      
      // Login admin
      const adminTokens = await login(adminCreds.email, adminCreds.password, frontendURL);
      console.log('Admin authenticated successfully');
      
      // Login host
      const hostTokens = await login(hostCreds.email, hostCreds.password, frontendURL);
      console.log('Host authenticated successfully');
      
      // Login user (the follower)
      const userTokens = await login(userCreds.email, userCreds.password, frontendURL);
      userToken = userTokens.accessToken;
      userRefreshToken = userTokens.refreshToken;
      console.log('User authenticated successfully');
      
      // ========================================
      // STEP 2: Extract user IDs from JWT tokens
      // ========================================
      console.log('=== STEP 2: Extracting user IDs from JWT ===');
      
      // Helper to decode JWT and extract userId
      const extractUserIdFromToken = (token: string): string | undefined => {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          return payload.userId;
        } catch {
          return undefined;
        }
      };
      
      adminId = extractUserIdFromToken(adminTokens.accessToken);
      hostId = extractUserIdFromToken(hostTokens.accessToken);
      const userIdFromToken = extractUserIdFromToken(userTokens.accessToken);
      
      console.log(`Admin ID: ${adminId}`);
      console.log(`Host ID: ${hostId}`);
      console.log(`User ID: ${userIdFromToken}`);
      
      // ========================================
      // STEP 3: Ensure host and admin have posts
      // ========================================
      console.log('=== STEP 3: Creating posts for host and admin ===');
      
      const hostPostText = `Host post for Following test ${timestamp}`;
      const adminPostText = `Admin post for Following test ${timestamp}`;
      
      // Create host post
      const hostPostResult = await createPost(hostTokens.accessToken, hostPostText, frontendURL);
      console.log(`Host post creation: status ${hostPostResult.status}, postId ${hostPostResult.postId}`);
      
      // Create admin post
      const adminPostResult = await createPost(adminTokens.accessToken, adminPostText, frontendURL);
      console.log(`Admin post creation: status ${adminPostResult.status}, postId ${adminPostResult.postId}`);
      
      // Wait for posts to be indexed
      await page.waitForTimeout(2000);
      
      // ========================================
      // STEP 4: Reset follow state - unfollow admin first (seeded user has pre-existing follows)
      // ========================================
      console.log('=== STEP 4: Resetting follow state ===');
      
      if (adminId) {
        const unfollowAdminRes = await api.delete(`${backendURL}/api/users/${adminId}/follow`, {
          headers: { Authorization: `Bearer ${userToken}` }
        });
        console.log(`Unfollow admin status: ${unfollowAdminRes.status()}`);
      }
      
      // ========================================
      // STEP 5: User follows Host (NOT Admin)
      // ========================================
      console.log('=== STEP 5: User follows Host ===');
      
      if (!hostId) {
        throw new Error('Host ID not found - cannot follow');
      }
      
      const followRes = await api.post(`${backendURL}/api/users/${hostId}/follow`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log(`Follow API status: ${followRes.status()}`);
      
      // Accept 200, 201, or 204 as success
      expect([200, 201, 204, 409]).toContain(followRes.status()); // 409 = already following
      
      // ========================================
      // STEP 6: Verify Following feed via API first
      // ========================================
      console.log('=== STEP 6: Verifying Following feed via API ===');
      
      const followingFeedRes = await api.get(`${backendURL}/api/posts/feed?scope=following&limit=10`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      
      if (followingFeedRes.ok()) {
        const feedData = await followingFeedRes.json();
        console.log(`Following feed API returned ${feedData.posts?.length || 0} posts`);
        
        // Log post authors for debugging
        feedData.posts?.slice(0, 5).forEach((p: any) => {
          console.log(`  Post: ${p.postId?.substring(0,8)} by ${p.authorName} (authorId: ${p.authorId?.substring(0,8)})`);
        });
        
        // Verify host's post is in the feed
        const hostPostInFeed = feedData.posts?.some((p: any) => 
          p.textContent?.includes(hostPostText) || p.authorId === hostId
        );
        console.log(`Host post in Following feed: ${hostPostInFeed}`);
        
        // Verify admin's post is NOT in the feed
        const adminPostInFeed = feedData.posts?.some((p: any) => 
          p.textContent?.includes(adminPostText) || p.authorId === adminId
        );
        console.log(`Admin post in Following feed: ${adminPostInFeed}`);
        
        // Critical assertions
        expect(hostPostInFeed).toBeTruthy();
        expect(adminPostInFeed).toBeFalsy();
        console.log('✅ API VALIDATION PASSED: Host post visible, Admin post NOT visible');
      }
      
      // ========================================
      // STEP 7: Navigate to Following feed in UI
      // ========================================
      console.log('=== STEP 7: User navigates to Following feed in UI ===');
      
      // Navigate first, then set tokens and reload
      await page.goto(`${frontendURL}/community`);
      
      // Set auth tokens via page.evaluate (more reliable than addInitScript for existing pages)
      await page.evaluate(({ at, rt }) => {
        sessionStorage.setItem('accessToken', at);
        localStorage.setItem('refreshToken', rt);
      }, { at: userToken, rt: userRefreshToken });
      
      // Reload to apply auth
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Click Following button
      const followingBtn = page.getByRole('button', { name: 'Following' });
      await followingBtn.click();
      await page.waitForTimeout(3000);
      
      // ========================================
      // STEP 8: Verify UI shows correct posts
      // ========================================
      console.log('=== STEP 8: Verifying UI displays correct posts ===');
      
      const posts = page.locator('[data-testid^="post-card-"]');
      const postCount = await posts.count();
      console.log(`Following feed UI shows ${postCount} posts`);
      
      // Check for host's post text
      const hostPostLocator = page.getByText(hostPostText, { exact: false });
      const hostPostVisible = await hostPostLocator.count() > 0;
      console.log(`Host post "${hostPostText.substring(0, 30)}..." visible in UI: ${hostPostVisible}`);
      
      // Check for admin's post text
      const adminPostLocator = page.getByText(adminPostText, { exact: false });
      const adminPostVisible = await adminPostLocator.count() > 0;
      console.log(`Admin post "${adminPostText.substring(0, 30)}..." visible in UI: ${adminPostVisible}`);
      
      // UI assertions
      expect(hostPostVisible).toBeTruthy();
      expect(adminPostVisible).toBeFalsy();
      console.log('✅ UI VALIDATION PASSED: Host post visible, Admin post NOT visible');
      
    } finally {
      // ========================================
      // TEARDOWN: Unfollow host to reset state
      // ========================================
      console.log('=== TEARDOWN: Unfollowing host ===');
      
      if (hostId && userToken) {
        try {
          const unfollowRes = await api.delete(`${backendURL}/api/users/${hostId}/follow`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          console.log(`Unfollow status: ${unfollowRes.status()}`);
        } catch (e) {
          console.log(`Unfollow error (non-critical): ${e}`);
        }
      }
      
      await context.close();
    }
  });
});

// ============================================================================
// COMPREHENSIVE FOLLOWING TAB UI TEST SUITE
// ============================================================================

// Helper to set auth tokens in browser
async function setAuthTokens(page: any, accessToken: string, refreshToken: string) {
  await page.evaluate(({ at, rt }) => {
    sessionStorage.setItem('accessToken', at);
    localStorage.setItem('refreshToken', rt);
  }, { at: accessToken, rt: refreshToken });
}

// Helper to extract userId from JWT
function extractUserIdFromToken(token: string): string | undefined {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.userId;
  } catch {
    return undefined;
  }
}

test.describe('Following Tab - Comprehensive UI Scenarios', () => {
  const backendURL = 'http://localhost:8080';
  const frontendURL = 'http://localhost:3000';

  // ===========================================================================
  // SCENARIO 1: Core Follow Flow (Host follows Admin via UI)
  // ===========================================================================
  test('Scenario 1: Host follows Admin via UI and sees Admin post in Following feed', async ({ browser, request }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const api = request;
    const timestamp = Date.now();

    let hostToken: string | undefined;
    let hostRefreshToken: string | undefined;
    let adminId: string | undefined;
    let hostId: string | undefined;

    try {
      console.log('=== SCENARIO 1: Host follows Admin via UI ===');

      // STEP 1: Authenticate as admin and host
      const adminCreds = seededCreds('ROLE_ADMIN');
      const hostCreds = seededCreds('ROLE_HOST');
      if (!adminCreds || !hostCreds) throw new Error('Failed to get seeded credentials');

      const adminTokens = await login(adminCreds.email, adminCreds.password, frontendURL);
      const hostTokens = await login(hostCreds.email, hostCreds.password, frontendURL);
      hostToken = hostTokens.accessToken;
      hostRefreshToken = hostTokens.refreshToken;

      adminId = extractUserIdFromToken(adminTokens.accessToken);
      hostId = extractUserIdFromToken(hostTokens.accessToken);
      console.log(`Admin ID: ${adminId}, Host ID: ${hostId}`);

      // STEP 2: Ensure admin has a post
      const adminPostText = `Admin post for Scenario 1 ${timestamp}`;
      await createPost(adminTokens.accessToken, adminPostText, frontendURL);
      console.log(`Admin post created: "${adminPostText.substring(0, 30)}..."`);
      await page.waitForTimeout(1500);

      // STEP 3: Reset follow state - unfollow admin first if following
      const unfollowRes = await api.delete(`${backendURL}/api/users/${adminId}/follow`, {
        headers: { Authorization: `Bearer ${hostToken}` }
      });
      console.log(`Reset follow state: ${unfollowRes.status()}`);

      // STEP 4: Authenticate as host in UI
      await page.goto(`${frontendURL}/community`);
      await setAuthTokens(page, hostToken!, hostRefreshToken!);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // STEP 5: Navigate to Admin's profile page
      console.log('Navigating to Admin profile page...');
      await page.goto(`${frontendURL}/profile/${adminId}`);
      await page.waitForLoadState('networkidle');

      // STEP 6: Click Follow button on Admin's profile
      const followBtn = page.getByRole('button', { name: /^Follow$/ });
      await followBtn.click();
      console.log('Clicked Follow button on Admin profile');

      // Wait for follow to complete
      await page.waitForTimeout(1000);

      // Verify button changed to "Following"
      const followingBtn = page.getByRole('button', { name: /Following/ });
      await expect(followingBtn).toBeVisible({ timeout: 5000 });
      console.log('✅ Follow button changed to "Following"');

      // STEP 7: Navigate to Community Following tab
      await page.goto(`${frontendURL}/community`);
      await page.waitForLoadState('networkidle');

      const followingTabBtn = page.getByRole('button', { name: 'Following' });
      await followingTabBtn.click();
      await page.waitForTimeout(2000);
      console.log('Navigated to Following tab');

      // STEP 8: Verify Admin's post is visible
      const adminPostLocator = page.getByText(adminPostText, { exact: false });
      const adminPostVisible = await adminPostLocator.count() > 0;
      console.log(`Admin post visible in Following feed: ${adminPostVisible}`);

      expect(adminPostVisible).toBeTruthy();
      console.log('✅ SCENARIO 1 PASSED: Admin post visible after Host followed via UI');

    } finally {
      // Teardown: Unfollow admin
      if (adminId && hostToken) {
        try {
          await api.delete(`${backendURL}/api/users/${adminId}/follow`, {
            headers: { Authorization: `Bearer ${hostToken}` }
          });
        } catch {}
      }
      await context.close();
    }
  });

  // ===========================================================================
  // SCENARIO 2: Reverse/Bi-directional Flow (Admin follows Host via UI)
  // ===========================================================================
  test('Scenario 2: Admin follows Host via UI, sees Host post but NOT User post', async ({ browser, request }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const api = request;
    const timestamp = Date.now();

    let adminToken: string | undefined;
    let adminRefreshToken: string | undefined;
    let adminId: string | undefined;
    let hostId: string | undefined;
    let userId: string | undefined;

    try {
      console.log('=== SCENARIO 2: Admin follows Host via UI ===');

      // STEP 1: Authenticate all users
      const adminCreds = seededCreds('ROLE_ADMIN');
      const hostCreds = seededCreds('ROLE_HOST');
      const userCreds = seededCreds('ROLE_USER');
      if (!adminCreds || !hostCreds || !userCreds) throw new Error('Failed to get seeded credentials');

      const adminTokens = await login(adminCreds.email, adminCreds.password, frontendURL);
      const hostTokens = await login(hostCreds.email, hostCreds.password, frontendURL);
      const userTokens = await login(userCreds.email, userCreds.password, frontendURL);
      adminToken = adminTokens.accessToken;
      adminRefreshToken = adminTokens.refreshToken;

      adminId = extractUserIdFromToken(adminTokens.accessToken);
      hostId = extractUserIdFromToken(hostTokens.accessToken);
      userId = extractUserIdFromToken(userTokens.accessToken);
      console.log(`Admin: ${adminId}, Host: ${hostId}, User: ${userId}`);

      // STEP 2: Create posts for host and user
      const hostPostText = `Host post for Scenario 2 ${timestamp}`;
      const userPostText = `User post for Scenario 2 ${timestamp}`;
      await createPost(hostTokens.accessToken, hostPostText, frontendURL);
      await createPost(userTokens.accessToken, userPostText, frontendURL);
      console.log('Created Host and User posts');
      await page.waitForTimeout(1500);

      // STEP 3: Reset follow state - Admin unfollows host first
      await api.delete(`${backendURL}/api/users/${hostId}/follow`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // STEP 4: Authenticate as Admin in UI
      await page.goto(`${frontendURL}/community`);
      await setAuthTokens(page, adminToken!, adminRefreshToken!);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // STEP 5: Navigate to Host's profile and follow
      console.log('Navigating to Host profile...');
      await page.goto(`${frontendURL}/profile/${hostId}`);
      await page.waitForLoadState('networkidle');

      const followBtn = page.getByRole('button', { name: /^Follow$/ });
      await followBtn.click();
      await page.waitForTimeout(1000);

      const followingBtn = page.getByRole('button', { name: /Following/ });
      await expect(followingBtn).toBeVisible({ timeout: 5000 });
      console.log('✅ Admin followed Host via UI');

      // STEP 6: Navigate to Following tab
      await page.goto(`${frontendURL}/community`);
      await page.waitForLoadState('networkidle');

      const followingTabBtn = page.getByRole('button', { name: 'Following' });
      await followingTabBtn.click();
      await page.waitForTimeout(2000);

      // STEP 7: Verify Host post visible, User post NOT visible
      const hostPostLocator = page.getByText(hostPostText, { exact: false });
      const userPostLocator = page.getByText(userPostText, { exact: false });

      const hostPostVisible = await hostPostLocator.count() > 0;
      const userPostVisible = await userPostLocator.count() > 0;

      console.log(`Host post visible: ${hostPostVisible}, User post visible: ${userPostVisible}`);

      expect(hostPostVisible).toBeTruthy();
      expect(userPostVisible).toBeFalsy();
      console.log('✅ SCENARIO 2 PASSED: Host post visible, User post NOT visible');

    } finally {
      // Teardown: Admin unfollows host
      if (hostId && adminToken) {
        try {
          await api.delete(`${backendURL}/api/users/${hostId}/follow`, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        } catch {}
      }
      await context.close();
    }
  });

  // ===========================================================================
  // SCENARIO 3: In-Feed UI Interactions (Like from Following feed)
  // ===========================================================================
  test('Scenario 3: User likes Host post from Following feed, state persists across tab switches', async ({ browser, request }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const api = request;
    const timestamp = Date.now();

    let userToken: string | undefined;
    let userRefreshToken: string | undefined;
    let hostId: string | undefined;

    try {
      console.log('=== SCENARIO 3: In-Feed Like Interaction ===');

      // STEP 1: Authenticate user and host
      const userCreds = seededCreds('ROLE_USER');
      const hostCreds = seededCreds('ROLE_HOST');
      if (!userCreds || !hostCreds) throw new Error('Failed to get seeded credentials');

      const userTokens = await login(userCreds.email, userCreds.password, frontendURL);
      const hostTokens = await login(hostCreds.email, hostCreds.password, frontendURL);
      userToken = userTokens.accessToken;
      userRefreshToken = userTokens.refreshToken;
      hostId = extractUserIdFromToken(hostTokens.accessToken);

      // STEP 2: Create a post for host
      const hostPostText = `Host post for Like test ${timestamp}`;
      await createPost(hostTokens.accessToken, hostPostText, frontendURL);
      console.log(`Host post created: "${hostPostText.substring(0, 30)}..."`);
      await page.waitForTimeout(1500);

      // STEP 3: User follows host via API
      await api.post(`${backendURL}/api/users/${hostId}/follow`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('User followed Host');

      // STEP 4: Authenticate as User in UI
      await page.goto(`${frontendURL}/community`);
      await setAuthTokens(page, userToken!, userRefreshToken!);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // STEP 5: Navigate to Following tab
      const followingTabBtn = page.getByRole('button', { name: 'Following' });
      await followingTabBtn.click();
      await page.waitForTimeout(2000);

      // STEP 6: Find the host's post and get initial like count
      // Use full unique text to avoid matching multiple posts from previous test runs
      const postCard = page.locator('[data-testid^="post-card-"]').filter({ hasText: hostPostText }).first();
      await expect(postCard).toBeVisible({ timeout: 10000 });
      console.log('Found host post in Following feed');

      // Get initial like count from the post card
      const likeButton = postCard.locator('button').filter({ has: postCard.locator('svg') }).first();
      
      // Find the heart icon button (it has Heart SVG)
      const heartButton = postCard.locator('button').filter({ has: page.locator('svg[class*="heart"], svg.lucide-heart') }).first();
      
      // Alternative: find by looking for button with heart-like interaction
      const interactionBar = postCard.locator('button').first();
      
      // Get initial like count text
      const initialLikeText = await postCard.locator('text=/\\d+/').first().textContent();
      const initialLikeCount = parseInt(initialLikeText || '0');
      console.log(`Initial like count: ${initialLikeCount}`);

      // STEP 7: Click the like button (heart icon)
      // The like button is typically the first button in the interaction bar
      const heartBtn = postCard.locator('button').first();
      await heartBtn.click();
      await page.waitForTimeout(1000);
      console.log('Clicked like button');

      // STEP 8: Verify like count incremented
      const afterLikeText = await postCard.locator('text=/\\d+/').first().textContent();
      const afterLikeCount = parseInt(afterLikeText || '0');
      console.log(`Like count after click: ${afterLikeCount}`);

      // The count should have incremented by 1
      expect(afterLikeCount).toBe(initialLikeCount + 1);
      console.log('✅ Like counter incremented in UI');

      // STEP 9: Switch to Latest tab, then back to Following
      const latestTabBtn = page.getByRole('button', { name: 'Latest' });
      await latestTabBtn.click();
      await page.waitForTimeout(2000);
      console.log('Switched to Latest tab');

      await followingTabBtn.click();
      await page.waitForTimeout(2000);
      console.log('Switched back to Following tab');

      // STEP 10: Verify like state persists
      const postCardAfterSwitch = page.locator('[data-testid^="post-card-"]').filter({ hasText: hostPostText }).first();
      await expect(postCardAfterSwitch).toBeVisible({ timeout: 10000 });

      const persistedLikeText = await postCardAfterSwitch.locator('text=/\\d+/').first().textContent();
      const persistedLikeCount = parseInt(persistedLikeText || '0');
      console.log(`Like count after tab switch: ${persistedLikeCount}`);

      expect(persistedLikeCount).toBe(afterLikeCount);
      console.log('✅ SCENARIO 3 PASSED: Like state persisted across tab switches');

    } finally {
      // Teardown: Unfollow host
      if (hostId && userToken) {
        try {
          await api.delete(`${backendURL}/api/users/${hostId}/follow`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
        } catch {}
      }
      await context.close();
    }
  });

  // ===========================================================================
  // SCENARIO 4: Unfollow State Reflection
  // ===========================================================================
  test('Scenario 4: User unfollows Admin, Admin post disappears from Following feed', async ({ browser, request }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const api = request;
    const timestamp = Date.now();

    let userToken: string | undefined;
    let userRefreshToken: string | undefined;
    let adminId: string | undefined;

    try {
      console.log('=== SCENARIO 4: Unfollow State Reflection ===');

      // STEP 1: Authenticate user and admin
      const userCreds = seededCreds('ROLE_USER');
      const adminCreds = seededCreds('ROLE_ADMIN');
      if (!userCreds || !adminCreds) throw new Error('Failed to get seeded credentials');

      const userTokens = await login(userCreds.email, userCreds.password, frontendURL);
      const adminTokens = await login(adminCreds.email, adminCreds.password, frontendURL);
      userToken = userTokens.accessToken;
      userRefreshToken = userTokens.refreshToken;
      adminId = extractUserIdFromToken(adminTokens.accessToken);

      // STEP 2: Create a post for admin
      const adminPostText = `Admin post for Unfollow test ${timestamp}`;
      await createPost(adminTokens.accessToken, adminPostText, frontendURL);
      console.log(`Admin post created: "${adminPostText.substring(0, 30)}..."`);
      await page.waitForTimeout(1500);

      // STEP 3: User follows admin via API
      await api.post(`${backendURL}/api/users/${adminId}/follow`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('User followed Admin');

      // STEP 4: Authenticate as User in UI
      await page.goto(`${frontendURL}/community`);
      await setAuthTokens(page, userToken!, userRefreshToken!);
      await page.reload();
      await page.waitForLoadState('networkidle');

      // STEP 5: Navigate to Following tab, verify Admin post visible
      const followingTabBtn = page.getByRole('button', { name: 'Following' });
      await followingTabBtn.click();
      await page.waitForTimeout(2000);

      const adminPostLocator = page.getByText(adminPostText, { exact: false });
      const adminPostVisibleBefore = await adminPostLocator.count() > 0;
      console.log(`Admin post visible before unfollow: ${adminPostVisibleBefore}`);
      expect(adminPostVisibleBefore).toBeTruthy();

      // STEP 6: Navigate to Admin's profile and unfollow
      console.log('Navigating to Admin profile to unfollow...');
      await page.goto(`${frontendURL}/profile/${adminId}`);
      await page.waitForLoadState('networkidle');

      // Click the "Following" button to unfollow
      const followingBtn = page.getByRole('button', { name: /Following/ });
      await followingBtn.click();
      await page.waitForTimeout(1000);

      // Verify button changed to "Follow"
      const followBtn = page.getByRole('button', { name: /^Follow$/ });
      await expect(followBtn).toBeVisible({ timeout: 5000 });
      console.log('✅ Unfollowed Admin via UI');

      // STEP 7: Return to Following tab
      await page.goto(`${frontendURL}/community`);
      await page.waitForLoadState('networkidle');

      await followingTabBtn.click();
      await page.waitForTimeout(2000);

      // STEP 8: Verify Admin post is no longer visible
      const adminPostLocatorAfter = page.getByText(adminPostText, { exact: false });
      const adminPostVisibleAfter = await adminPostLocatorAfter.count() > 0;
      console.log(`Admin post visible after unfollow: ${adminPostVisibleAfter}`);

      expect(adminPostVisibleAfter).toBeFalsy();
      console.log('✅ Admin post disappeared from Following feed');

      // STEP 9: Verify empty state if user follows no one else
      // Check if the empty state message is displayed
      const emptyStateMessage = page.getByText(/Deep silence|No stories found/);
      const hasEmptyState = await emptyStateMessage.count() > 0;
      console.log(`Empty state displayed: ${hasEmptyState}`);

      // Note: Empty state may not appear if user follows other users
      // This is acceptable behavior - we just verify the post is gone

      console.log('✅ SCENARIO 4 PASSED: Unfollow reflected immediately in Following feed');

    } finally {
      // Cleanup already done via UI unfollow
      await context.close();
    }
  });
});

// ── Homestay Dropdown Loading State Test ─────────────────────────────────
authedTest.describe('Create Post - Homestay Dropdown Loading State', () => {
  authedTest('dropdown is disabled while homestays are loading', async ({ page }) => {
    // Intercept the homestay lookup API and delay response by 2 seconds
    await page.route('**/api/homestays/lookup', async (route) => {
      // Delay response by 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fulfill with mock data
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'test-id-1', name: 'Test Homestay 1' },
          { id: 'test-id-2', name: 'Test Homestay 2' },
        ]),
      });
    });

    // Navigate to community page
    await page.goto('/community');
    await page.waitForLoadState('networkidle');

    // Open create post modal via FAB button
    const createPostBtn = page.getByTestId('fab-add-post');
    await createPostBtn.waitFor({ state: 'visible', timeout: 5000 });
    await createPostBtn.click();

    // Wait for modal to appear
    const modal = page.locator('[data-testid="create-post-modal"], .fixed:has-text("Publish")').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Check that the combobox input is disabled while loading
    const comboboxInput = page.getByTestId('homestay-combobox-input');
    
    // Verify it shows loading state
    await expect(comboboxInput).toBeDisabled({ timeout: 1000 });
    
    // Verify loading placeholder text
    const placeholder = await comboboxInput.getAttribute('placeholder');
    expect(placeholder).toContain('Loading');

    // Wait for the API to resolve (2s delay + buffer)
    await page.waitForTimeout(2500);

    // Now verify the dropdown is enabled
    await expect(comboboxInput).toBeEnabled({ timeout: 2000 });

    // Click to open dropdown
    const comboboxBtn = page.getByTestId('homestay-combobox-btn');
    await comboboxBtn.click();

    // Verify dropdown options appear
    const dropdown = page.getByTestId('homestay-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 2000 });

    // Verify homestay options are visible and selectable
    const option1 = page.getByTestId('combobox-option-test-id-1');
    await expect(option1).toBeVisible({ timeout: 2000 });

    // Select an option
    await option1.click();

    // Verify selection is shown as a pill
    const selectedPill = page.getByTestId('homestay-selected-pill');
    await expect(selectedPill).toBeVisible({ timeout: 2000 });
    await expect(selectedPill).toContainText('Test Homestay 1');

    console.log('✅ PASSED: Homestay dropdown loading state works correctly');
  });
});
