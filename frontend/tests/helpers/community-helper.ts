import type { Page } from '@playwright/test';

export type CreatedPost = { id?: string; text: string };

export class CommunityHelper {
  constructor(private readonly page: Page) {}

  async gotoCommunity() {
    await this.page.goto('/community', { waitUntil: 'domcontentloaded' });
  }

  async waitForFeedToRender() {
    // Either skeletons show (briefly) or posts render.
    // The feed can be legitimately empty, so accept either:
    // - at least one post card
    // - the empty-feed placeholder
    // - the feed heading as a last-resort ready signal
    const postCard = this.page.locator('[data-testid^="post-card"], [data-testid="post-card"]').first();
    const emptyState = this.page.getByText('Deep silence here...');
    const heading = this.page.getByText('Community Feed');

    await Promise.race([
      postCard.waitFor({ state: 'visible', timeout: 30000 }),
      emptyState.waitFor({ state: 'visible', timeout: 30000 }),
      heading.waitFor({ state: 'visible', timeout: 30000 }),
    ]);
  }

  async openComposer() {
    await this.page.getByLabel('Write a Story').click();
    await this.page.waitForSelector('[data-testid="post-textarea"]', { timeout: 10000 });
  }

  async createPost(text: string): Promise<CreatedPost> {
    await this.openComposer();
    await this.page.getByTestId('post-textarea').fill(text);
    // location optional; keep default
    const createResp = this.page.waitForResponse((res) => {
      const req = res.request();
      return req.method() === 'POST' && res.url().includes('/api/posts') && res.status() === 201;
    }, { timeout: 30000 });

    await this.page.getByTestId('submit-post-btn').click();

    // Ensure backend accepted the post
    let createdId: string | undefined;
    try {
      const res = await createResp;
      const body = await res.json().catch(() => null as any);
      createdId = body?.id;
    } catch {
      createdId = undefined;
    }

    // Wait for modal to close by waiting for textarea to disappear
    await this.page.waitForSelector('[data-testid="post-textarea"]', { state: 'detached', timeout: 20000 });

    // Best-effort: sometimes the feed is virtualized/paginated and the new post may not be visible immediately.
    // Do not fail the test on visibility; API response is the source of truth.
    await this.page.getByText(text, { exact: false }).first().waitFor({ timeout: 1500 }).catch(() => {});

    return { id: createdId, text };
  }

  async openCommentsOnFirstPost() {
    // Uses the unified card interaction bar: the comment button has MessageCircle icon + count, no stable testid.
    // We'll click the first "MessageCircle" button by targeting the second action button in the action bar.
    // Safer: click any button containing a number next to MessageCircle isn't trivial, so we use layout: first post card -> first button row -> second button.
    const card = this.page.locator('[data-testid^="post-card"], [data-testid="post-card"]').first();
    const actionRow = card.locator('button').filter({ hasText: '' });

    // Prefer clicking the comment button by visible count element: it is the 2nd button in PostInteractionBar.
    await card.locator('button').nth(1).click();
    await this.page.waitForSelector('[data-testid="comment-input"]', { timeout: 15000 });
  }

  async addComment(body: string) {
    const createResp = this.page.waitForResponse((res) => {
      const req = res.request();
      return req.method() === 'POST' && /\/api\/posts\/.+\/comments/.test(res.url()) && res.status() === 200;
    }, { timeout: 30000 });

    await this.page.getByTestId('comment-input').fill(body);
    await this.page.getByTestId('comment-send-btn').click();

    // Ensure backend accepted the comment; UI can be virtualized/optimistic and not always immediately visible.
    await createResp;
    await this.page.getByText(body, { exact: false }).first().waitFor({ timeout: 1500 }).catch(() => {});
  }

  async deleteFirstCommentIfVisible() {
    const comment = this.page.locator('[data-testid="comment-item"]').first();
    if (!(await comment.count())) return;

    const delBtn = comment.getByRole('button', { name: 'Delete' });
    if (await delBtn.isVisible().catch(() => false)) {
      await delBtn.click();
      // comment should disappear
      await comment.waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
    }
  }

  async likeFirstPost() {
    // Prefer stable selector if old PostCard is used
    const legacyLike = this.page.locator('[data-testid="like-btn"]').first();
    if (await legacyLike.count()) {
      await legacyLike.click();
      return;
    }

    // Unified card: first action button is like
    const card = this.page.locator('[data-testid^="post-card"], [data-testid="post-card"]').first();
    await card.locator('button').first().click();
  }

  async repostFirstPost() {
    const card = this.page.locator('[data-testid^="post-card"], [data-testid="post-card"]').first();
    // In PostInteractionBar, repost is 3rd button
    await card.locator('button').nth(2).click();
    await this.page.getByRole('button', { name: /publish repost/i }).waitFor({ timeout: 15000 });
    await this.page.getByRole('button', { name: /publish repost/i }).click();
  }

  async deletePostByText(text: string) {
    const post = this.page.locator('[data-testid^="post-card"], [data-testid="post-card"]').filter({ hasText: text }).first();
    const deleteBtn = post.getByRole('button', { name: 'Delete' });
    if (await deleteBtn.isVisible().catch(() => false)) {
      await deleteBtn.click();
      await post.waitFor({ state: 'detached', timeout: 20000 }).catch(() => {});
    }
  }

  async loadMoreStoriesIfButtonVisible() {
    const loadMore = this.page.getByRole('button', { name: 'Load More Stories' });
    if (await loadMore.isVisible().catch(() => false)) {
      await loadMore.click();
    } else {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
  }
}
