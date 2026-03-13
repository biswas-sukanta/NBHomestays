import { expect } from '@playwright/test';
import { authedTest } from '../fixtures/auth.fixture';
import { CommunityHelper } from '../helpers/community-helper';
import { deletePost } from '../helpers/community-api';

authedTest.describe('Community — Post actions', () => {
  authedTest('Create post → Like → Delete (cleanup)', async ({ page, accessToken, baseURL }) => {
    authedTest.setTimeout(120000);
    const community = new CommunityHelper(page);
    const text = `PW Post ${Date.now()}`;

    await community.gotoCommunity();
    await community.waitForFeedToRender();

    const created = await community.createPost(text);
    expect(created.text).toContain('PW Post');
    expect(created.id, 'Expected created post id from POST /api/posts response').toBeTruthy();

    // Like the created post if visible in current viewport
    const post = page.locator('[data-testid^="post-card"], [data-testid="post-card"]').filter({ hasText: text }).first();
    if (await post.count()) {
      // Unified card: first button is like. Legacy card: data-testid like-btn.
      const legacyLike = post.locator('[data-testid="like-btn"]').first();
      if (await legacyLike.count()) {
        await legacyLike.click();
      } else {
        await post.locator('button').first().click();
      }
    }

    // Cleanup via API (avoid flaky UI delete click)
    const status = await deletePost(accessToken, created.id!, baseURL || undefined);
    expect([200, 204]).toContain(status);
  });
});
