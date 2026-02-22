import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, authHeaders } from './helpers/api-client';
import { registerAndLogin } from './helpers/auth-helper';

test.describe('Domain 3: Community — Posts + Likes + Comments Lifecycle', () => {
    let userToken: string;
    let postId: string;
    let commentId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;
    });

    // ── Posts CRUD ─────────────────────────────────────────────

    test('GET /api/posts → 200 (cached: postsList)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts`);
        await assertOk('GET /api/posts', res);
        expect(Array.isArray(await res.json())).toBeTruthy();
    });

    test('GET /api/posts/search?q=test → 200', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts/search?q=test`);
        await assertOk('GET /api/posts/search', res);
    });

    test('POST /api/posts → create', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/posts`, {
            headers: authHeaders(userToken),
            data: { textContent: `Regression Post ${Date.now()}`, locationName: 'Darjeeling', imageUrls: [] },
        });
        await assertOk('POST /api/posts', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        postId = body.id;
    });

    test('GET /api/posts/{id} → read (cached: postDetail)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/posts/${postId}`);
        await assertOk('GET /api/posts/{id}', res);
        expect((await res.json()).id).toBe(postId);
    });

    test('GET /api/posts/my-posts → user posts', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts/my-posts`, {
            headers: authHeaders(userToken),
        });
        await assertOk('GET /api/posts/my-posts', res);
    });

    test('PUT /api/posts/{id} → update', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/posts/${postId}`, {
            headers: authHeaders(userToken),
            data: { textContent: `Updated ${Date.now()}`, locationName: 'Kalimpong', imageUrls: [] },
        });
        await assertOk('PUT /api/posts/{id}', res);
    });

    // ── Likes ─────────────────────────────────────────────────

    test('POST /api/posts/{id}/like → toggle ON', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/like`, {
            headers: authHeaders(userToken),
        });
        await assertOk('POST /api/posts/{id}/like', res);
        const body = await res.json();
        expect(body).toHaveProperty('liked');
        expect(body).toHaveProperty('count');
    });

    test('GET /api/posts/{id}/like → status', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/posts/${postId}/like`, {
            headers: authHeaders(userToken),
        });
        await assertOk('GET /api/posts/{id}/like', res);
    });

    test('POST /api/posts/{id}/like → toggle OFF', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/like`, {
            headers: authHeaders(userToken),
        });
        await assertOk('POST /api/posts/{id}/like (off)', res);
    });

    // ── Comments ──────────────────────────────────────────────

    test('GET /api/posts/{id}/comments → paginated (cached: postComments)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/posts/${postId}/comments?page=0&size=20`);
        await assertOk('GET /api/posts/{id}/comments', res);
    });

    test('POST /api/posts/{id}/comments → add comment', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/comments`, {
            headers: authHeaders(userToken),
            data: { body: `Test comment ${Date.now()}` },
        });
        await assertOk('POST /api/posts/{id}/comments', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        commentId = body.id;
    });

    test('POST /api/posts/{id}/comments/{parentId}/replies → reply', async ({ request }) => {
        if (!postId || !commentId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/comments/${commentId}/replies`, {
            headers: authHeaders(userToken),
            data: { body: `Reply ${Date.now()}` },
        });
        await assertOk('POST /replies', res);
    });

    test('CACHE-HIT: GET /comments twice → no PageImpl deserialization crash', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const r1 = await request.get(`${API_BASE}/api/posts/${postId}/comments?page=0&size=20`);
        await assertOk('GET /comments (1st/miss)', r1);

        const r2 = await request.get(`${API_BASE}/api/posts/${postId}/comments?page=0&size=20`);
        await assertOk('GET /comments (2nd/hit)', r2);
    });

    test('DELETE /api/comments/{id} → delete comment', async ({ request }) => {
        if (!commentId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/comments/${commentId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('DELETE /api/comments/{id}', res);
    });

    // ── Post cleanup ──────────────────────────────────────────

    test('DELETE /api/posts/{id} → delete post + verify 404', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/posts/${postId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('DELETE /api/posts/{id}', res);

        const verify = await request.get(`${API_BASE}/api/posts/${postId}`);
        expect(verify.status()).toBe(404);
    });

    // ── Cache-hit regression ──────────────────────────────────
    test('CACHE-HIT: GET /api/posts twice → no deserialization crash', async ({ request }) => {
        const r1 = await request.get(`${API_BASE}/api/posts`);
        await assertOk('GET /api/posts (1st/miss)', r1);

        const r2 = await request.get(`${API_BASE}/api/posts`);
        await assertOk('GET /api/posts (2nd/hit)', r2);
    });
});
