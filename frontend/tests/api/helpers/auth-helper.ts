import { APIRequestContext } from '@playwright/test';
import { API_BASE, logIfError } from './api-client';

export interface AuthResult {
    token: string;
    email: string;
}

/**
 * Registers a brand-new user and returns the JWT token.
 * If registration fails (e.g. user exists), falls back to login.
 * Each call generates a unique email to avoid collisions.
 */
export async function registerAndLogin(
    request: APIRequestContext,
    role: 'ROLE_USER' | 'ROLE_HOST' | 'ROLE_ADMIN' = 'ROLE_USER',
    emailOverride?: string,
): Promise<AuthResult> {
    const email = emailOverride ||
        `api_${role.replace('ROLE_', '').toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`;
    const password = 'TestPass123!';

    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/json' };

    const regRes = await request.post(`${API_BASE}/api/auth/register`, {
        headers,
        data: { firstname: 'API', lastname: 'Tester', email, password, role },
    });
    await logIfError('auth/register', regRes);

    if (regRes.ok()) {
        const body = await regRes.json();
        return { token: body.accessToken, email };
    }

    // Fallback: login with existing credentials
    const loginRes = await request.post(`${API_BASE}/api/auth/authenticate`, {
        headers,
        data: { email, password },
    });
    await logIfError('auth/authenticate (fallback)', loginRes);

    if (!loginRes.ok()) {
        throw new Error(`Auth failed for ${email}: HTTP ${loginRes.status()}`);
    }

    const body = await loginRes.json();
    return { token: body.accessToken, email };
}
