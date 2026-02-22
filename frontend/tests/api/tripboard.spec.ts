import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, authHeaders } from './helpers/api-client';
import { registerAndLogin } from './helpers/auth-helper';

test.describe('Domain 6: Trip Board — Save/Unsave Lifecycle', () => {
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

    test('GET /api/saves → saved IDs', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/saves`, {
            headers: authHeaders(userToken),
        });
        await assertOk('GET /api/saves', res);
        expect(Array.isArray(await res.json())).toBeTruthy();
    });

    test('POST /api/saves/{id} → toggle save ON', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/saves/${homestayId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('POST /api/saves/{id}', res);
        expect(await res.json()).toHaveProperty('saved');
    });

    test('GET /api/saves/{id} → check saved', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/saves/${homestayId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('GET /api/saves/{id}', res);
    });

    test('GET /api/saves/homestays → full objects (Hibernate proxy risk)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/saves/homestays`, {
            headers: authHeaders(userToken),
        });
        await assertOk('GET /api/saves/homestays', res);
    });

    test('POST /api/saves/{id} → toggle save OFF', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/saves/${homestayId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('POST /api/saves/{id} (off)', res);
    });
});
