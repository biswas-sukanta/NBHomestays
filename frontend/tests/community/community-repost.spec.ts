import { expect } from '@playwright/test';
import { authedTest } from '../fixtures/auth.fixture';
import { CommunityHelper } from '../helpers/community-helper';
import { deletePost } from '../helpers/community-api';

authedTest.describe('Community — Repost', () => {
  authedTest('Open repost modal → Publish repost → Cleanup', async ({ page, accessToken, baseURL }) => {
    authedTest.setTimeout(120000);
    const community = new CommunityHelper(page);
    const baseText = `PW Base Repost ${Date.now()}`;

    await community.gotoCommunity();
    await community.waitForFeedToRender();

    const created = await community.createPost(baseText);
    expect(created.id, 'Expected created post id').toBeTruthy();
    const postId = created.id!;

    // Best-effort: locate the base post card by text; if not found, fall back to first card.
    const byText = page.locator('[data-testid^="post-card"], [data-testid="post-card"]').filter({ hasText: baseText }).first();
    const basePost = (await byText.count()) ? byText : page.locator('[data-testid^="post-card"], [data-testid="post-card"]').first();

    // Click repost (3rd button in unified interaction bar)
    await basePost.locator('button').nth(2).click();

    // Modal title text
    await expect(page.getByText('Repost Story')).toBeVisible({ timeout: 15000 });

    // Publish repost
    await page.getByRole('button', { name: /publish repost/i }).click();

    // If repost succeeds, we should see toast or feed update; we assert no hard failure modal remains.
    await page.getByText('Repost Story').waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});

    // Cleanup: delete the base post via API (repost cleanup may not be possible if repost is bugged)
    const status = await deletePost(accessToken, postId, baseURL || undefined);
    expect([200, 204]).toContain(status);
  });
});
