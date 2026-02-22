import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, authHeaders } from './helpers/api-client';
import { registerAndLogin } from './helpers/auth-helper';

test.describe('Domain 5: Reviews', () => {
    let userToken: string;
    let homestayId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;

        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const list = await searchRes.json();
            if (list.length > 0) homestayId = list[0].id;
        }
    });

    test('GET /api/reviews/homestay/{id} → 200 (cached)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/reviews/homestay/${homestayId}`);
        await assertOk('GET /reviews', res);
        expect(Array.isArray(await res.json())).toBeTruthy();
    });

    test('POST /api/reviews → add review', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/reviews`, {
            headers: authHeaders(userToken),
            data: { homestayId, rating: 5, text: `Review ${Date.now()}`, photoUrls: [] },
        });
        await assertOk('POST /api/reviews', res);
    });

    test('CACHE-HIT: GET /reviews twice → no crash', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const r1 = await request.get(`${API_BASE}/api/reviews/homestay/${homestayId}`);
        await assertOk('GET /reviews (1st)', r1);
        const r2 = await request.get(`${API_BASE}/api/reviews/homestay/${homestayId}`);
        await assertOk('GET /reviews (2nd/hit)', r2);
    });
});
