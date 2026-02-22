import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, authHeaders, sleep } from './helpers/api-client';
import { registerAndLogin } from './helpers/auth-helper';

test.describe.serial('Domain 7: Admin Operations', () => {
    let adminToken: string;
    let testPostId: string;
    let testHomestayId: string;

    test.afterEach(async () => { await sleep(); });

    test('setup — register admin + create test data', async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_ADMIN');
        adminToken = auth.token;
        expect(adminToken).toBeTruthy();

        // Create a post for delete test
        await sleep();
        const postRes = await request.post(`${API_BASE}/api/posts`, {
            headers: { ...authHeaders(adminToken), 'Content-Type': 'application/json' },
            data: { textContent: 'Admin delete test', locationName: 'Admin', imageUrls: [] },
        });
        if (postRes.ok()) testPostId = (await postRes.json()).id;

        // Find a homestay for feature toggle
        await sleep();
        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const list = await searchRes.json();
            if (list.length > 0) testHomestayId = list[0].id;
        }
    });

    test('GET /api/admin/hello → 200', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/admin/hello`, {
            headers: authHeaders(adminToken),
        });
        await assertOk('GET /admin/hello', res);
    });

    test('GET /api/admin/stats → 200 (cached)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/admin/stats`, {
            headers: authHeaders(adminToken),
        });
        await assertOk('GET /admin/stats', res);
        const body = await res.json();
        expect(body).toHaveProperty('totalUsers');
        expect(body).toHaveProperty('totalPosts');
        expect(body).toHaveProperty('totalHomestays');
    });

    test('GET /api/homestays/all → admin', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/all`, {
            headers: authHeaders(adminToken),
        });
        await assertOk('GET /homestays/all', res);
    });

    test('GET /api/homestays/pending → admin', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/pending`, {
            headers: authHeaders(adminToken),
        });
        await assertOk('GET /homestays/pending', res);
    });

    test('PUT /api/admin/homestays/{id}/feature → toggle', async ({ request }) => {
        if (!testHomestayId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/admin/homestays/${testHomestayId}/feature`, {
            headers: authHeaders(adminToken),
        });
        await assertOk('PUT /feature', res);
        expect(await res.json()).toHaveProperty('featured');

        // Toggle back
        await sleep();
        await request.put(`${API_BASE}/api/admin/homestays/${testHomestayId}/feature`, {
            headers: authHeaders(adminToken),
        });
    });

    test('DELETE /api/admin/posts/{id} → force delete', async ({ request }) => {
        if (!testPostId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/admin/posts/${testPostId}`, {
            headers: authHeaders(adminToken),
        });
        await assertOk('DELETE /admin/posts', res);
    });

    test('CACHE-HIT: GET /admin/stats twice → no crash', async ({ request }) => {
        const r1 = await request.get(`${API_BASE}/api/admin/stats`, { headers: authHeaders(adminToken) });
        await assertOk('GET /stats (1st)', r1);
        await sleep();
        const r2 = await request.get(`${API_BASE}/api/admin/stats`, { headers: authHeaders(adminToken) });
        await assertOk('GET /stats (2nd/hit)', r2);
    });
});
