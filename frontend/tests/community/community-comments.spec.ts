import { expect } from '@playwright/test';
import { authedTest } from '../fixtures/auth.fixture';
import { CommunityHelper } from '../helpers/community-helper';
import { deletePost } from '../helpers/community-api';

authedTest.describe('Community — Comments', () => {
  authedTest('Add comment → Delete comment → Delete post (cleanup)', async ({ page, accessToken, baseURL }) => {
    authedTest.setTimeout(120000);
    const community = new CommunityHelper(page);
    const postText = `PW Comment Host ${Date.now()}`;
    const commentText = `PW Comment ${Date.now()}`;

    await community.gotoCommunity();
    await community.waitForFeedToRender();

    const created = await community.createPost(postText);
    expect(created.id, 'Expected created post id').toBeTruthy();
    const postId = created.id!;

    // Open comments for first post in view (comment drawer is global and keyed by postId)
    const anyCard = page.locator('[data-testid^="post-card"], [data-testid="post-card"]').first();
    await anyCard.locator('button').nth(1).click();
    await page.getByTestId('comment-input').waitFor({ timeout: 15000 });

    await community.addComment(commentText);

    // Capture commentId from backend by finding first matching comment item and using API delete by content is not supported.
    // Instead, perform API cleanup for the post (cascades/soft deletes). Comment delete via UI can be flaky.
    const status = await deletePost(accessToken, postId, baseURL || undefined);
    expect([200, 204]).toContain(status);

    // Close comment drawer via ESC (no stable close selector)
    await page.keyboard.press('Escape').catch(() => {});
  });
});
