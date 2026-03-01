import { test, expect } from '@playwright/test';
import { ApiClient, API_BASE, defaultHeaders } from './helpers/api-client';
import { AuthHelper } from './helpers/auth-helper';

test.describe.serial('Domain: Homestay Lifecycle & Discovery', () => {
    let hostToken: string;
    let homestayId: string;

    test.beforeAll(async ({ request }) => {
        hostToken = await AuthHelper.getAuthToken(request, 'ROLE_HOST');
    });

    test('Step 1: Create Homestay → Success', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/homestays`, {
            headers: defaultHeaders(hostToken),
            data: {
                name: `Regression Stay ${Date.now()}`,
                description: 'Permanent regression suite stay',
                pricePerNight: 5000,
                latitude: 27.03,
                longitude: 88.26,
                amenities: { wifi: true, parking: true },
                media: []
            }
        });
        await ApiClient.assertResponse('Create Homestay', res);
        const body = await res.json();
        homestayId = body.id;
        expect(homestayId).toBeTruthy();
    });

    test('Step 2: Search Homestays (Cache Miss & Hibernate Proxy Serial Verify) → Success', async ({ request }) => {
        // This triggers HomestayService.searchHomestays which returns objects with 'owner' (lazy)
        const res1 = await request.get(`${API_BASE}/api/homestays/search?q=Reg`, {
            headers: defaultHeaders()
        });
        await ApiClient.assertResponse('Search Homestays (Miss)', res1);

        await ApiClient.throttle(2000);

        // Second call for cache hit — trigger Hibernate6Module lazy handling
        const res2 = await request.get(`${API_BASE}/api/homestays/search?q=Reg`, {
            headers: defaultHeaders()
        });
        await ApiClient.assertResponse('Search Homestays (Hit)', res2);
        const body = await res2.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThan(0);
    });

    test('Step 3: Update Homestay → Success', async ({ request }) => {
        const res = await request.put(`${API_BASE}/api/homestays/${homestayId}`, {
            headers: defaultHeaders(hostToken),
            data: {
                name: 'Updated Regression Stay',
                description: 'Updated description',
                pricePerNight: 5500,
                amenities: { wifi: true },
                media: []
            }
        });
        await ApiClient.assertResponse('Update Homestay', res);
    });

    test('Step 4: Owner Listings → Success', async ({ request }) => {
        const res = await request.get(`${API_BASE}/api/homestays/my-listings`, {
            headers: defaultHeaders(hostToken)
        });
        await ApiClient.assertResponse('My Listings', res);
        const body = await res.json();
        expect(body.some((h: any) => h.id === homestayId)).toBeTruthy();
    });

    test('Step 5: Delete Homestay (Cleanup) → Success', async ({ request }) => {
        const res = await request.delete(`${API_BASE}/api/homestays/${homestayId}`, {
            headers: defaultHeaders(hostToken)
        });
        await ApiClient.assertResponse('Delete Homestay', res);
    });
});

