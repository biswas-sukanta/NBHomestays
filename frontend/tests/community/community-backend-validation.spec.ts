import { test, expect } from '@playwright/test';
import {
  registerEphemeral,
  refreshAccessToken,
  getFeed,
  createPost,
  likePost,
  sharePost,
  addComment,
  repost,
  deletePost,
} from '../helpers/community-api';

test.describe('Community — Backend validation (proxy)', () => {
  test('Core endpoints respond successfully (create/like/comment/share/repost/delete)', async ({ baseURL }) => {
    test.setTimeout(120000);
    const user = await registerEphemeral('ROLE_USER', baseURL || undefined);

    expect(await getFeed(baseURL || undefined)).toBe(200);

    const created = await createPost(user.tokens.accessToken, `PW API Post ${Date.now()}`, baseURL || undefined);
    expect(created.status).toBe(201);
    expect(created.postId).toBeTruthy();

    const postId = created.postId!;

    expect(await likePost(user.tokens.accessToken, postId, baseURL || undefined)).toBe(200);
    expect(await addComment(user.tokens.accessToken, postId, `PW API Comment ${Date.now()}`, baseURL || undefined)).toMatchObject({ status: 200 });
    expect(await sharePost(postId, baseURL || undefined)).toBe(200);

    const rep = await repost(user.tokens.accessToken, postId, baseURL || undefined);
    expect(rep.status).toBe(200);

    // cleanup
    if (rep.postId) {
      expect(await deletePost(user.tokens.accessToken, rep.postId, baseURL || undefined)).toBe(200);
    }
    expect(await deletePost(user.tokens.accessToken, postId, baseURL || undefined)).toBe(200);
  });

  test('Refresh token works', async ({ baseURL }) => {
    test.setTimeout(60000);
    const user = await registerEphemeral('ROLE_USER', baseURL || undefined);
    const status = await refreshAccessToken(user.tokens.refreshToken, baseURL || undefined);
    expect(status).toBe(200);
  });
});
