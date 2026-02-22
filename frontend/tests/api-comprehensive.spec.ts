import { test, expect, APIRequestContext } from '@playwright/test';

// ══════════════════════════════════════════════════════════════
// NBHomestays — 100% API Coverage Regression Suite
// Principal SDET: Comprehensive CRUD Lifecycle Chains
// ══════════════════════════════════════════════════════════════

const API_BASE = process.env.API_BASE_URL || 'https://thoughtful-jemie-droidmaniac-8802977f.koyeb.app';

// ── Auth Helper ──────────────────────────────────────────────
async function registerAndLogin(
    request: APIRequestContext,
    role: 'ROLE_USER' | 'ROLE_HOST' | 'ROLE_ADMIN' = 'ROLE_USER',
    emailOverride?: string,
): Promise<{ token: string; email: string }> {
    const email = emailOverride || `api_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@test.com`;
    const password = 'TestPass123!';

    const regRes = await request.post(`${API_BASE}/api/auth/register`, {
        data: { firstname: 'API', lastname: 'Tester', email, password, role },
    });
    await logIfError('POST /api/auth/register', regRes);

    // If registration fails (user already exists), try login directly
    let token: string;
    if (regRes.ok()) {
        const regBody = await regRes.json();
        token = regBody.accessToken;
    } else {
        const loginRes = await request.post(`${API_BASE}/api/auth/authenticate`, {
            data: { email, password },
        });
        await logIfError('POST /api/auth/authenticate (fallback)', loginRes);
        expect(loginRes.ok()).toBeTruthy();
        const loginBody = await loginRes.json();
        token = loginBody.accessToken;
    }

    return { token, email };
}

// ── Error Logger ─────────────────────────────────────────────
async function logIfError(label: string, response: any) {
    if (response.status() >= 400) {
        let body = '';
        try { body = await response.text(); } catch { body = '<unreadable>'; }
        console.error(
            `\n🔴 [${label}] HTTP ${response.status()}\n` +
            `   URL: ${response.url()}\n` +
            `   Body: ${body.substring(0, 2000)}\n`
        );
    }
}

// ── Assertion Helper: expect 2xx ─────────────────────────────
async function expect2xx(label: string, response: any) {
    await logIfError(label, response);
    expect(response.status(), `${label} should be 2xx but was ${response.status()}`).toBeLessThan(300);
}

// ══════════════════════════════════════════════════════════════
// TEST SUITES
// ══════════════════════════════════════════════════════════════

test.describe('Domain 1: Auth & Identity', () => {

    test('POST /api/auth/register → 200', async ({ request }) => {
        const email = `auth_reg_${Date.now()}@test.com`;
        const res = await request.post(`${API_BASE}/api/auth/register`, {
            data: { firstname: 'Test', lastname: 'User', email, password: 'Pass123!', role: 'ROLE_USER' },
        });
        await expect2xx('POST /api/auth/register', res);
        const body = await res.json();
        expect(body.accessToken).toBeTruthy();
        expect(body.refreshToken).toBeTruthy();
    });

    test('POST /api/auth/authenticate → 200', async ({ request }) => {
        const email = `auth_login_${Date.now()}@test.com`;
        // Register first
        await request.post(`${API_BASE}/api/auth/register`, {
            data: { firstname: 'Login', lastname: 'Test', email, password: 'Pass123!', role: 'ROLE_USER' },
        });
        const res = await request.post(`${API_BASE}/api/auth/authenticate`, {
            data: { email, password: 'Pass123!' },
        });
        await expect2xx('POST /api/auth/authenticate', res);
        const body = await res.json();
        expect(body.accessToken).toBeTruthy();
    });

    test('POST /api/auth/login (alias) → 200', async ({ request }) => {
        const email = `auth_alias_${Date.now()}@test.com`;
        await request.post(`${API_BASE}/api/auth/register`, {
            data: { firstname: 'Alias', lastname: 'Test', email, password: 'Pass123!', role: 'ROLE_USER' },
        });
        const res = await request.post(`${API_BASE}/api/auth/login`, {
            data: { email, password: 'Pass123!' },
        });
        await expect2xx('POST /api/auth/login', res);
    });

    test('POST /api/auth/authenticate with wrong password → 401/403 (not 500)', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/auth/authenticate`, {
            data: { email: 'nonexistent@test.com', password: 'wrong' },
        });
        // We just want to ensure it does NOT return 500
        expect(res.status(), 'Bad credentials should NOT 500').toBeLessThan(500);
    });
});


test.describe('Domain 2: Diagnostics', () => {
    test('GET /api/diagnostics → 200 (Redis + S3 Probe)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/diagnostics`);
        await expect2xx('GET /api/diagnostics', res);
        const body = await res.json();
        expect(body).toHaveProperty('redis');
        expect(body).toHaveProperty('supabase_s3');
    });
});


test.describe('Domain 3: Homestays — Full CRUD Lifecycle', () => {
    let hostToken: string;
    let hostEmail: string;
    let createdHomestayId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_HOST');
        hostToken = auth.token;
        hostEmail = auth.email;
    });

    test('GET /api/homestays/search → 200 (Public, Cached)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/search`);
        await expect2xx('GET /api/homestays/search', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('GET /api/homestays/search?q=Darjeeling → 200 (Filtered)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/search?q=Darjeeling`);
        await expect2xx('GET /api/homestays/search?q=Darjeeling', res);
    });

    test('POST /api/homestays → 200 (Create)', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/homestays`, {
            headers: { Authorization: `Bearer ${hostToken}` },
            data: {
                name: `API Test Stay ${Date.now()}`,
                description: 'Created by comprehensive API test suite',
                pricePerNight: 2500,
                latitude: 27.0410,
                longitude: 88.2663,
                amenities: { wifi: true, parking: true, kitchen: false },
                photoUrls: [],
            },
        });
        await expect2xx('POST /api/homestays', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        createdHomestayId = body.id;
    });

    test('GET /api/homestays/{id} → 200 (Read)', async ({ request }) => {
        // Use a search to find any existing homestay if our created one is pending
        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        const homestays = await searchRes.json();
        const targetId = homestays.length > 0 ? homestays[0].id : createdHomestayId;
        if (!targetId) { test.skip(); return; }

        const res = await request.get(`${API_BASE}/api/homestays/${targetId}`);
        await expect2xx('GET /api/homestays/{id}', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
    });

    test('PUT /api/homestays/{id} → 200 (Update)', async ({ request }) => {
        if (!createdHomestayId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/homestays/${createdHomestayId}`, {
            headers: { Authorization: `Bearer ${hostToken}` },
            data: {
                name: `Updated Stay ${Date.now()}`,
                description: 'Updated by API test',
                pricePerNight: 3000,
                latitude: 27.0410,
                longitude: 88.2663,
                amenities: { wifi: true, parking: true, kitchen: true },
                photoUrls: [],
            },
        });
        await expect2xx('PUT /api/homestays/{id}', res);
    });

    test('GET /api/homestays/my-listings → 200 (Owner)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/my-listings`, {
            headers: { Authorization: `Bearer ${hostToken}` },
        });
        await expect2xx('GET /api/homestays/my-listings', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('DELETE /api/homestays/{id} → 200 (Delete)', async ({ request }) => {
        if (!createdHomestayId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/homestays/${createdHomestayId}`, {
            headers: { Authorization: `Bearer ${hostToken}` },
        });
        await expect2xx('DELETE /api/homestays/{id}', res);
    });
});


test.describe('Domain 4: Community Posts — Full CRUD Lifecycle', () => {
    let userToken: string;
    let userEmail: string;
    let createdPostId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;
        userEmail = auth.email;
    });

    test('GET /api/posts → 200 (All Posts, Cached)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts`);
        await expect2xx('GET /api/posts', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('GET /api/posts/search?q= → 200 (Search)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts/search?q=test`);
        await expect2xx('GET /api/posts/search', res);
    });

    test('POST /api/posts → 200 (Create Post)', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: {
                textContent: `API Test Post ${Date.now()}`,
                locationName: 'Darjeeling',
                imageUrls: [],
            },
        });
        await expect2xx('POST /api/posts', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        createdPostId = body.id;
    });

    test('GET /api/posts/{id} → 200 (Read Post)', async ({ request }) => {
        if (!createdPostId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/posts/${createdPostId}`);
        await expect2xx('GET /api/posts/{id}', res);
        const body = await res.json();
        expect(body.id).toBe(createdPostId);
    });

    test('GET /api/posts/my-posts → 200 (User Posts)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts/my-posts`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('GET /api/posts/my-posts', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('PUT /api/posts/{id} → 200 (Update Post)', async ({ request }) => {
        if (!createdPostId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/posts/${createdPostId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: {
                textContent: `Updated by API Test ${Date.now()}`,
                locationName: 'Kalimpong',
                imageUrls: [],
            },
        });
        await expect2xx('PUT /api/posts/{id}', res);
    });

    test('DELETE /api/posts/{id} → 200 (Delete Post)', async ({ request }) => {
        if (!createdPostId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/posts/${createdPostId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('DELETE /api/posts/{id}', res);

        // Verify deletion
        const verifyRes = await request.get(`${API_BASE}/api/posts/${createdPostId}`);
        expect(verifyRes.status()).toBe(404);
    });
});


test.describe('Domain 5: Likes — Toggle Lifecycle', () => {
    let userToken: string;
    let postId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;

        // Create a post to like
        const postRes = await request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${auth.token}` },
            data: { textContent: 'Like test post', locationName: 'Siliguri', imageUrls: [] },
        });
        if (postRes.ok()) {
            const body = await postRes.json();
            postId = body.id;
        }
    });

    test('POST /api/posts/{postId}/like → 200 (Toggle Like ON)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/like`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('POST /api/posts/{postId}/like', res);
        const body = await res.json();
        expect(body).toHaveProperty('liked');
        expect(body).toHaveProperty('count');
    });

    test('GET /api/posts/{postId}/like → 200 (Get Status)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/posts/${postId}/like`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('GET /api/posts/{postId}/like', res);
        const body = await res.json();
        expect(body).toHaveProperty('liked');
    });

    test('POST /api/posts/{postId}/like → 200 (Toggle Like OFF)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/like`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('POST /api/posts/{postId}/like (toggle off)', res);
    });
});


test.describe('Domain 6: Comments — Full CRUD Lifecycle', () => {
    let userToken: string;
    let postId: string;
    let commentId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;

        // Create a post to comment on
        const postRes = await request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${auth.token}` },
            data: { textContent: 'Comment test post', locationName: 'Kurseong', imageUrls: [] },
        });
        if (postRes.ok()) {
            const body = await postRes.json();
            postId = body.id;
        }
    });

    test('GET /api/posts/{postId}/comments → 200 (Paginated)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/posts/${postId}/comments?page=0&size=20`);
        await expect2xx('GET /api/posts/{postId}/comments', res);
    });

    test('POST /api/posts/{postId}/comments → 200 (Add Comment)', async ({ request }) => {
        if (!postId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/comments`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { body: `API Test Comment ${Date.now()}` },
        });
        await expect2xx('POST /api/posts/{postId}/comments', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        commentId = body.id;
    });

    test('POST /api/posts/{postId}/comments/{parentId}/replies → 200 (Reply)', async ({ request }) => {
        if (!postId || !commentId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/posts/${postId}/comments/${commentId}/replies`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { body: `API Test Reply ${Date.now()}` },
        });
        await expect2xx('POST /replies', res);
    });

    test('DELETE /api/comments/{commentId} → 204 (Delete)', async ({ request }) => {
        if (!commentId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/comments/${commentId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('DELETE /api/comments/{commentId}', res);
    });
});


test.describe('Domain 7: Homestay Q&A — Full CRUD Lifecycle', () => {
    let userToken: string;
    let homestayId: string;
    let questionId: string;
    let answerId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;

        // Find an existing homestay to ask questions about
        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const homestays = await searchRes.json();
            if (homestays.length > 0) {
                homestayId = homestays[0].id;
            }
        }
    });

    test('GET /api/homestays/{id}/questions → 200 (Cached)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/homestays/${homestayId}/questions`);
        await expect2xx('GET /api/homestays/{id}/questions', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('POST /api/homestays/{id}/questions → 200 (Ask Question)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/homestays/${homestayId}/questions`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { text: `API Test Question ${Date.now()}` },
        });
        await expect2xx('POST /api/homestays/{id}/questions', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        questionId = body.id;
    });

    test('PUT /api/questions/{id} → 200 (Update Question)', async ({ request }) => {
        if (!questionId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/questions/${questionId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { text: `Updated Question ${Date.now()}` },
        });
        await expect2xx('PUT /api/questions/{id}', res);
    });

    test('POST /api/questions/{id}/answers → 200 (Answer)', async ({ request }) => {
        if (!questionId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/questions/${questionId}/answers`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { text: `API Test Answer ${Date.now()}` },
        });
        await expect2xx('POST /api/questions/{id}/answers', res);
        const body = await res.json();
        expect(body.id).toBeTruthy();
        answerId = body.id;
    });

    test('PUT /api/answers/{id} → 200 (Update Answer)', async ({ request }) => {
        if (!answerId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/answers/${answerId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { text: `Updated Answer ${Date.now()}` },
        });
        await expect2xx('PUT /api/answers/{id}', res);
    });

    test('DELETE /api/answers/{id} → 200 (Delete Answer)', async ({ request }) => {
        if (!answerId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/answers/${answerId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('DELETE /api/answers/{id}', res);
    });

    test('DELETE /api/questions/{id} → 200 (Delete Question)', async ({ request }) => {
        if (!questionId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/questions/${questionId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('DELETE /api/questions/{id}', res);
    });
});


test.describe('Domain 8: Reviews', () => {
    let userToken: string;
    let homestayId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;

        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const homestays = await searchRes.json();
            if (homestays.length > 0) homestayId = homestays[0].id;
        }
    });

    test('GET /api/reviews/homestay/{homestayId} → 200 (Cached)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/reviews/homestay/${homestayId}`);
        await expect2xx('GET /api/reviews/homestay/{id}', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('POST /api/reviews → 200 (Add Review)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/reviews`, {
            headers: { Authorization: `Bearer ${userToken}` },
            data: {
                homestayId,
                rating: 5,
                text: `API Test Review ${Date.now()}`,
                photoUrls: [],
            },
        });
        await expect2xx('POST /api/reviews', res);
    });
});


test.describe('Domain 9: Trip Board — Save/Unsave Lifecycle', () => {
    let userToken: string;
    let homestayId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_USER');
        userToken = auth.token;

        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const homestays = await searchRes.json();
            if (homestays.length > 0) homestayId = homestays[0].id;
        }
    });

    test('GET /api/saves → 200 (Saved IDs)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/saves`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('GET /api/saves', res);
        const body = await res.json();
        expect(Array.isArray(body)).toBeTruthy();
    });

    test('POST /api/saves/{homestayId} → 200 (Toggle Save ON)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/saves/${homestayId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('POST /api/saves/{homestayId}', res);
        const body = await res.json();
        expect(body).toHaveProperty('saved');
    });

    test('GET /api/saves/{homestayId} → 200 (Check)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.get(`${API_BASE}/api/saves/${homestayId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('GET /api/saves/{homestayId}', res);
        const body = await res.json();
        expect(body).toHaveProperty('saved');
    });

    test('GET /api/saves/homestays → 200 (Full Objects)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/saves/homestays`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('GET /api/saves/homestays', res);
    });

    test('POST /api/saves/{homestayId} → 200 (Toggle Save OFF)', async ({ request }) => {
        if (!homestayId) { test.skip(); return; }
        const res = await request.post(`${API_BASE}/api/saves/${homestayId}`, {
            headers: { Authorization: `Bearer ${userToken}` },
        });
        await expect2xx('POST /api/saves/{homestayId} (toggle off)', res);
    });
});


test.describe('Domain 10: Admin Operations', () => {
    let adminToken: string;
    let testPostId: string;
    let testHomestayId: string;

    test.beforeAll(async ({ request }) => {
        const auth = await registerAndLogin(request, 'ROLE_ADMIN');
        adminToken = auth.token;

        // Create a post for admin-delete test
        const postRes = await request.post(`${API_BASE}/api/posts`, {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { textContent: 'Admin delete test', locationName: 'Admin Town', imageUrls: [] },
        });
        if (postRes.ok()) {
            const body = await postRes.json();
            testPostId = body.id;
        }

        // Find a homestay for feature-toggle test
        const searchRes = await request.get(`${API_BASE}/api/homestays/search`);
        if (searchRes.ok()) {
            const homestays = await searchRes.json();
            if (homestays.length > 0) testHomestayId = homestays[0].id;
        }
    });

    test('GET /api/admin/hello → 200', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/admin/hello`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        await expect2xx('GET /api/admin/hello', res);
    });

    test('GET /api/admin/stats → 200 (Cached)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        await expect2xx('GET /api/admin/stats', res);
        const body = await res.json();
        expect(body).toHaveProperty('totalUsers');
        expect(body).toHaveProperty('totalPosts');
        expect(body).toHaveProperty('totalHomestays');
    });

    test('GET /api/homestays/all → 200 (Admin)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/all`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        await expect2xx('GET /api/homestays/all', res);
    });

    test('GET /api/homestays/pending → 200 (Admin)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/pending`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        await expect2xx('GET /api/homestays/pending', res);
    });

    test('PUT /api/admin/homestays/{id}/feature → 200 (Toggle Featured)', async ({ request }) => {
        if (!testHomestayId) { test.skip(); return; }
        const res = await request.put(`${API_BASE}/api/admin/homestays/${testHomestayId}/feature`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        await expect2xx('PUT /api/admin/homestays/{id}/feature', res);
        const body = await res.json();
        expect(body).toHaveProperty('featured');

        // Toggle back
        await request.put(`${API_BASE}/api/admin/homestays/${testHomestayId}/feature`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
    });

    test('DELETE /api/admin/posts/{id} → 200 (Force Delete)', async ({ request }) => {
        if (!testPostId) { test.skip(); return; }
        const res = await request.delete(`${API_BASE}/api/admin/posts/${testPostId}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        await expect2xx('DELETE /api/admin/posts/{id}', res);
    });

    test('Admin endpoints reject non-admin users → 403 (not 500)', async ({ request }) => {
        // Register a normal user
        const userAuth = await registerAndLogin(request, 'ROLE_USER');
        const res = await request.get(`${API_BASE}/api/admin/stats`, {
            headers: { Authorization: `Bearer ${userAuth.token}` },
        });
        expect(res.status(), 'Non-admin should get 403, not 500').toBe(403);
    });
});


test.describe('Domain 11: Security Edge Cases — No 500s on Unauthenticated', () => {

    test('POST /api/posts without token → 401/403 (not 500)', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/posts`, {
            data: { textContent: 'Unauthorized', locationName: 'Nowhere', imageUrls: [] },
        });
        expect(res.status(), 'Unauthenticated POST should not 500').toBeLessThan(500);
    });

    test('POST /api/homestays without token → 401/403 (not 500)', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/homestays`, {
            data: { name: 'Unauthorized', description: 'test', pricePerNight: 100 },
        });
        expect(res.status()).toBeLessThan(500);
    });

    test('POST /api/reviews without token → 401/403 (not 500)', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/reviews`, {
            data: { homestayId: '00000000-0000-0000-0000-000000000000', rating: 5, text: 'test' },
        });
        expect(res.status()).toBeLessThan(500);
    });

    test('DELETE /api/admin/posts/nonexistent → 401/403/404 (not 500)', async ({ request }) => {
        const res = await request.delete(`${API_BASE}/api/admin/posts/00000000-0000-0000-0000-000000000000`);
        expect(res.status()).toBeLessThan(500);
    });

    test('GET /api/homestays/nonexistent-uuid → 404 (not 500)', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/00000000-0000-0000-0000-000000000000`);
        expect(res.status()).toBeLessThan(500);
    });
});
