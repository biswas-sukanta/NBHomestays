import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, authHeaders, sleep } from './helpers/api-client';
import { registerAndLogin } from './helpers/auth-helper';

test.describe.serial('Domain 4: Homestay Q&A — Full CRUD Lifecycle', () => {
    let userToken: string;
    let homestayId: string;
    let questionId: string;
    let answerId: string;

    test.afterEach(async () => { await sleep(); });

    test('setup — register user + find homestay', async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;
        expect(userToken).toBeTruthy();

        await sleep();
        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const list = await searchRes.json();
            if (list.length > 0) homestayId = list[0].id;
        }
        expect(homestayId).toBeTruthy();
    });

    test('GET /api/homestays/{id}/questions → 200 (cached)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/homestays/${homestayId}/questions`);
        await assertOk('GET /questions', res);
        expect(Array.isArray(await res.json())).toBeTruthy();
    });

    test('POST /api/homestays/{id}/questions → ask', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/homestays/${homestayId}/questions`, {
            headers: { ...authHeaders(userToken), 'Content-Type': 'application/json' },
            data: { text: `Question ${Date.now()}` },
        });
        await assertOk('POST /questions', res);
        questionId = (await res.json()).id;
        expect(questionId).toBeTruthy();
    });

    test('PUT /api/questions/{id} → update', async ({ request }) => {
        if (!questionId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/questions/${questionId}`, {
            headers: { ...authHeaders(userToken), 'Content-Type': 'application/json' },
            data: { text: `Updated ${Date.now()}` },
        });
        await assertOk('PUT /questions', res);
    });

    test('POST /api/questions/{id}/answers → answer', async ({ request }) => {
        if (!questionId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/questions/${questionId}/answers`, {
            headers: { ...authHeaders(userToken), 'Content-Type': 'application/json' },
            data: { text: `Answer ${Date.now()}` },
        });
        await assertOk('POST /answers', res);
        answerId = (await res.json()).id;
        expect(answerId).toBeTruthy();
    });

    test('PUT /api/answers/{id} → update answer', async ({ request }) => {
        if (!answerId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/answers/${answerId}`, {
            headers: { ...authHeaders(userToken), 'Content-Type': 'application/json' },
            data: { text: `Updated answer ${Date.now()}` },
        });
        await assertOk('PUT /answers', res);
    });

    test('DELETE /api/answers/{id} → delete', async ({ request }) => {
        if (!answerId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/answers/${answerId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('DELETE /answers', res);
    });

    test('DELETE /api/questions/{id} → delete', async ({ request }) => {
        if (!questionId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/questions/${questionId}`, {
            headers: authHeaders(userToken),
        });
        await assertOk('DELETE /questions', res);
    });

    test('CACHE-HIT: GET /questions twice → no crash', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const r1 = await request.get(`${API_BASE}/api/homestays/${homestayId}/questions`);
        await assertOk('GET /questions (1st)', r1);
        await sleep();
        const r2 = await request.get(`${API_BASE}/api/homestays/${homestayId}/questions`);
        await assertOk('GET /questions (2nd/hit)', r2);
    });
});
