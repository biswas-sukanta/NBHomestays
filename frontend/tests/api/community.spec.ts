import { test, expect } from '@playwright/test';
import { ApiClient, API_BASE, defaultHeaders } from './helpers/api-client';
import { AuthHelper } from './helpers/auth-helper';

test.describe.serial('Domain: Community Feed & Interaction', () => {
    let client: ApiClient;
    let userToken: string;
    let postId: string;

    test.beforeAll(async ({ request }) => {
        client = new ApiClient(request);
        userToken = await AuthHelper.getAuthToken(request, 'ROLE_USER');
    });

    test('Step 1: Create Post → Success', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/posts`, {
            headers: defaultHeaders(userToken),
            data: {
                textContent: `Regression Suite Post ${Date.now()}`,
                locationName: 'Test Location',
                imageUrls: []
            }
        });
        await ApiClient.assertResponse('Create Post', res);
        const body = await res.json();
        postId = body.id;
        expect(postId).toBeTruthy();
    });

    test('Step 2: Fetch Post (Cache Miss) → Success', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts/${postId}`, {
            headers: defaultHeaders()
        });
        await ApiClient.assertResponse('Fetch Post (Miss)', res);
        const body = await res.json();
        expect(body.id).toBe(postId);
    });

    test('Step 3: Add Comment → Success', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/posts/${postId}/comments`, {
            headers: defaultHeaders(userToken),
            data: { body: 'This is a regression test comment' }
        });
        await ApiClient.assertResponse('Add Comment', res);
    });

    test('Step 4: Fetch Paginated Comments (Cache Hit & PageImpl Fix Verify) → Success', async ({ request }) => {
        // First call to populate cache
        const res1 = await request.get(`${API_BASE}/api/posts/${postId}/comments?page=0&size=20`, {
            headers: defaultHeaders()
        });
        await ApiClient.assertResponse('Fetch Comments (Miss)', res1);

        await ApiClient.throttle(2000); // Small gap

        // Second call for cache hit — trigger PageImpl deserialization
        const res2 = await request.get(`${API_BASE}/api/posts/${postId}/comments?page=0&size=20`, {
            headers: defaultHeaders()
        });
        await ApiClient.assertResponse('Fetch Comments (Hit)', res2);
        const body = await res2.json();
        expect(body.content).toBeTruthy();
        expect(Array.isArray(body.content)).toBeTruthy();
    });

    test('Step 5: Delete Post → Success', async ({ request }) => {
        const res = await request.delete(`${API_BASE}/api/posts/${postId}`, {
            headers: defaultHeaders(userToken)
        });
        await ApiClient.assertResponse('Delete Post', res);
    });

    test('Step 6: Verify Persistence Cleanup → 404', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/posts/${postId}`, {
            headers: defaultHeaders()
        });
        expect(res.status()).toBe(404);
    });
});
