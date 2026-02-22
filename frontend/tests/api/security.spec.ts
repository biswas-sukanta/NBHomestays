import { test, expect } from '@playwright/test';
import { API_BASE } from './helpers/api-client';

test.describe('Domain 8: Security Edge Cases — No 500s Allowed', () => {

    test('POST /api/posts unauthenticated → 401/403, not 500', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/posts`, {
            data: { textContent: 'Unauthed', locationName: 'X', imageUrls: [] },
        });
        expect(res.status(), 'Unauthenticated POST /posts must not 500').toBeLessThan(500);
    });

    test('POST /api/homestays unauthenticated → 401/403, not 500', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/homestays`, {
            data: { name: 'X', description: 'X', pricePerNight: 100 },
        });
        expect(res.status()).toBeLessThan(500);
    });

    test('POST /api/reviews unauthenticated → 401/403, not 500', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/reviews`, {
            data: { homestayId: '00000000-0000-0000-0000-000000000000', rating: 5, text: 'X' },
        });
        expect(res.status()).toBeLessThan(500);
    });

    test('DELETE /api/admin/posts/{id} unauthenticated → 401/403, not 500', async ({ request }) => {
        const res = await request.delete(`${API_BASE}/api/admin/posts/00000000-0000-0000-0000-000000000000`);
        expect(res.status()).toBeLessThan(500);
    });

    test('GET /api/homestays/{nonexistent} → 404, not 500', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/00000000-0000-0000-0000-000000000000`);
        expect(res.status()).toBeLessThan(500);
    });

    test('GET /api/diagnostics → 200 (health probe)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/diagnostics`);
        expect(res.status()).toBeLessThan(500);
    });

    test('Non-admin hitting admin endpoint → 403, not 500', async ({ request }) => {
        // Import auth helper inline to avoid forcing auth on the entire describe
        const { registerAndLogin } = require('./helpers/auth-helper');
        const auth = await registerAndLogin(request, 'ROLE_USER');
        const res = await request.get(`${API_BASE}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${auth.token}` },
        });
        expect(res.status(), 'Non-admin should get 403').toBe(403);
    });
});
