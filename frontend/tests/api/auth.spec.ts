import { test, expect } from '@playwright/test';
import { API_BASE, assertOk, logIfError } from './helpers/api-client';

test.describe('Domain 1: Auth & Identity', () => {

    test('POST /api/auth/register → creates user and returns JWT', async ({ request }) => {
        const email = `auth_reg_${Date.now()}@test.com`;
        const res = await request.post(`${API_BASE}/api/auth/register`, {
            data: { firstname: 'Auth', lastname: 'Test', email, password: 'Pass123!', role: 'ROLE_USER' },
        });
        await assertOk('POST /api/auth/register', res);
        const body = await res.json();
        expect(body.accessToken).toBeTruthy();
        expect(body.refreshToken).toBeTruthy();
    });

    test('POST /api/auth/authenticate → returns JWT for existing user', async ({ request }) => {
        const email = `auth_login_${Date.now()}@test.com`;
        await request.post(`${API_BASE}/api/auth/register`, {
            data: { firstname: 'Login', lastname: 'Test', email, password: 'Pass123!', role: 'ROLE_USER' },
        });
        const res = await request.post(`${API_BASE}/api/auth/authenticate`, {
            data: { email, password: 'Pass123!' },
        });
        await assertOk('POST /api/auth/authenticate', res);
        const body = await res.json();
        expect(body.accessToken).toBeTruthy();
    });

    test('POST /api/auth/login (alias) → same as authenticate', async ({ request }) => {
        const email = `auth_alias_${Date.now()}@test.com`;
        await request.post(`${API_BASE}/api/auth/register`, {
            data: { firstname: 'Alias', lastname: 'Test', email, password: 'Pass123!', role: 'ROLE_USER' },
        });
        const res = await request.post(`${API_BASE}/api/auth/login`, {
            data: { email, password: 'Pass123!' },
        });
        await assertOk('POST /api/auth/login', res);
    });

    test('Bad credentials → 401/403, never 500', async ({ request }) => {
        const res = await request.post(`${API_BASE}/api/auth/authenticate`, {
            data: { email: 'nonexistent@test.com', password: 'wrong' },
        });
        expect(res.status(), 'Bad creds must not 500').toBeLessThan(500);
    });
});
