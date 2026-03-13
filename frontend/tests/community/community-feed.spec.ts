import { expect } from '@playwright/test';
import { authedTest } from '../fixtures/auth.fixture';
import { CommunityHelper } from '../helpers/community-helper';

authedTest.describe('Community — Feed', () => {
  authedTest('Community page loads and renders feed (no console errors)', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    const community = new CommunityHelper(page);
    await community.gotoCommunity();

    // Skeleton may or may not appear depending on cache; if it appears, it should not be permanent.
    const maybeSkeleton = page.locator('.animate-pulse').first();
    await maybeSkeleton.waitFor({ timeout: 1500 }).catch(() => {});

    await community.waitForFeedToRender();

    expect(errors, 'Console errors detected on /community').toEqual([]);
  });

  authedTest('Infinite scroll / load more does not break', async ({ page }) => {
    const community = new CommunityHelper(page);
    await community.gotoCommunity();
    await community.waitForFeedToRender();

    const initialCount = await page.locator('[data-testid^="post-card"], [data-testid="post-card"]').count();

    await community.loadMoreStoriesIfButtonVisible();
    await page.waitForTimeout(1500);

    const afterCount = await page.locator('[data-testid^="post-card"], [data-testid="post-card"]').count();

    expect(afterCount, 'Expected post count to stay same or increase after pagination action').toBeGreaterThanOrEqual(initialCount);
  });
});
