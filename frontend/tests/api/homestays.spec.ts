import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, authHeaders } from './helpers/api-client';
import { registerAndLogin } from './helpers/auth-helper';

test.describe('Domain 2: Homestays — Full CRUD Lifecycle', () => {
    let hostToken: string;
    let createdId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_HOST');
        hostToken = auth.token;
    });

    test('GET /api/homestays/search → 200 (public, cached)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/search`);
        await assertOk('GET /api/homestays/search', res);
        expect(Array.isArray(await res.json())).toBeTruthy();
    });

    test('GET /api/homestays/search?q=Darjeeling → filtered results', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/search?q=Darjeeling`);
        await assertOk('GET /api/homestays/search?q=', res);
    });

    test('POST /api/homestays → create', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/homestays`, {
            headers: authHeaders(hostToken),
            data: {
                name: `API Test Stay ${Date.now()}`,
                description: 'Created by the regression suite',
                pricePerNight: 2500,
                latitude: 27.04,
                longitude: 88.26,
                amenities: { wifi: true },
                photoUrls: [],
            },
        });
        await assertOk('POST /api/homestays', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        createdId = body.id;
    });

    test('GET /api/homestays/{id} → read (cached)', async ({ request }) => {
        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        const list = await searchRes.json();
        const targetId = list.length > 0 ? list[0].id : createdId;
        if (!targetId) { test.skip(); return; }

        const res = await request.get(`${API_BASE}/api/homestays/${targetId}`);
        await assertOk('GET /api/homestays/{id}', res);
    });

    test('PUT /api/homestays/{id} → update', async ({ request }) => {
        if (!createdId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/homestays/${createdId}`, {
            headers: authHeaders(hostToken),
            data: { name: `Updated ${Date.now()}`, description: 'Updated', pricePerNight: 3000, amenities: {}, photoUrls: [] },
        });
        await assertOk('PUT /api/homestays/{id}', res);
    });

    test('GET /api/homestays/my-listings → owner listings', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/my-listings`, {
            headers: authHeaders(hostToken),
        });
        await assertOk('GET /api/homestays/my-listings', res);
    });

    test('DELETE /api/homestays/{id} → delete', async ({ request }) => {
        if (!createdId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/homestays/${createdId}`, {
            headers: authHeaders(hostToken),
        });
        await assertOk('DELETE /api/homestays/{id}', res);
    });

    test('GET /api/homestays/nonexistent → 404, not 500', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/00000000-0000-0000-0000-000000000000`);
        expect(res.status(), 'Nonexistent homestay must not 500').toBeLessThan(500);
    });

    // ── Cache-hit regression (the big one) ────────────────────
    test('CACHE-HIT: GET /api/homestays/search called twice → no deserialization crash', async ({ request }) => {
        const res1 = await request.get(`${API_BASE}/api/homestays/search`);
        await assertOk('GET /api/homestays/search (1st/miss)', res1);

        const res2 = await request.get(`${API_BASE}/api/homestays/search`);
        await assertOk('GET /api/homestays/search (2nd/hit)', res2);
    });
});
