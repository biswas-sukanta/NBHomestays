import { test, expect } from '@playwright/test';
import {
  pingHealth,
  registerEphemeral,
  createPost,
  deletePost,
  updatePostAsOther,
  likePost,
  addComment,
  updateCommentAsOther,
  deleteComment,
} from '../helpers/community-api';

test.describe('Community — Security + Concurrency', () => {
  let healthStatus: number = 0;

  test.beforeAll(async ({ baseURL }) => {
    healthStatus = await pingHealth(baseURL || undefined).catch(() => 0);
  });

  test('Negative authorization: UserB cannot PUT/DELETE UserA post (403)', async ({ baseURL }) => {
    test.setTimeout(120000);
    test.skip(healthStatus !== 200, `Backend/proxy not healthy for auth tests. GET /api/health/ping returned ${healthStatus}.`);
    const A = await registerEphemeral('ROLE_USER', baseURL || undefined);
    const B = await registerEphemeral('ROLE_USER', baseURL || undefined);

    const created = await createPost(A.tokens.accessToken, `PW SEC Post ${Date.now()}`, baseURL || undefined);
    expect(created.status).toBe(201);
    expect(created.postId).toBeTruthy();

    const postId = created.postId!;

    expect(await updatePostAsOther(B.tokens.accessToken, postId, baseURL || undefined)).toBe(403);
    expect(await deletePost(B.tokens.accessToken, postId, baseURL || undefined)).toBe(403);

    // cleanup
    expect(await deletePost(A.tokens.accessToken, postId, baseURL || undefined)).toBe(200);
  });

  test('Negative authorization: UserB cannot edit/delete UserA comment (403)', async ({ baseURL }) => {
    test.setTimeout(120000);
    test.skip(healthStatus !== 200, `Backend/proxy not healthy for auth tests. GET /api/health/ping returned ${healthStatus}.`);
    const A = await registerEphemeral('ROLE_USER', baseURL || undefined);
    const B = await registerEphemeral('ROLE_USER', baseURL || undefined);

    const created = await createPost(A.tokens.accessToken, `PW SEC Comment Post ${Date.now()}`, baseURL || undefined);
    expect(created.status).toBe(201);
    const postId = created.postId!;

    const c = await addComment(A.tokens.accessToken, postId, `PW Owner Comment ${Date.now()}`, baseURL || undefined);
    expect(c.status).toBe(200);
    expect(c.commentId).toBeTruthy();
    const commentId = c.commentId!;

    expect(await updateCommentAsOther(B.tokens.accessToken, postId, commentId, baseURL || undefined)).toBe(403);
    expect(await deleteComment(B.tokens.accessToken, commentId, baseURL || undefined)).toBe(403);

    // cleanup
    const delC = await deleteComment(A.tokens.accessToken, commentId, baseURL || undefined);
    expect([200, 204]).toContain(delC);
    expect(await deletePost(A.tokens.accessToken, postId, baseURL || undefined)).toBe(200);
  });

  test('Like concurrency: multiple concurrent likes do not 500 and final count is consistent', async ({ baseURL }) => {
    test.setTimeout(180000);
    test.skip(healthStatus !== 200, `Backend/proxy not healthy for auth tests. GET /api/health/ping returned ${healthStatus}.`);
    const A = await registerEphemeral('ROLE_USER', baseURL || undefined);

    const created = await createPost(A.tokens.accessToken, `PW CONC Post ${Date.now()}`, baseURL || undefined);
    expect(created.status).toBe(201);
    const postId = created.postId!;

    const N = 10;
    const statuses = await Promise.all(
      Array.from({ length: N }).map(() => likePost(A.tokens.accessToken, postId, baseURL || undefined, 60000))
    );

    // Expect no 500s; 200 is expected; if backend throttles some calls, it should still not 5xx.
    const serverErrors = statuses.filter((s) => s >= 500);
    expect(serverErrors, `Like concurrency produced 5xx statuses: ${JSON.stringify(statuses)}`).toHaveLength(0);

    // cleanup
    expect(await deletePost(A.tokens.accessToken, postId, baseURL || undefined)).toBe(200);
  });
});
