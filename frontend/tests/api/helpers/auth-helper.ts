import { APIRequestContext, expect } from '@playwright/test';
import { API_BASE, ApiClient, defaultHeaders } from './api-client';

/** Permanent Regression Suite — Auth & Token Management */
export class AuthHelper {
    private static tokens: Map<string, string> = new Map();

    /** 
     * Registers and logins a unique user for a specific role.
     * Retries for Koyeb resilience. 
     */
    static async getAuthToken(request: APIRequestContext, role: 'ROLE_USER' | 'ROLE_HOST' | 'ROLE_ADMIN' = 'ROLE_USER'): Promise<string> {
        const email = `reg_suite_${role.toLowerCase()}_${Date.now()}@test.com`;
        const password = 'Password123!';

        // 1. Register
        const regRes = await request.post(`${API_BASE}/api/auth/register`, {
            headers: defaultHeaders(),
            data: { firstname: 'Reg', lastname: 'Suite', email, password, role }
        });

        // 2. Handle potential 404/Cold-start
        if (regRes.status() === 404) {
            console.warn('Koyeb 404 detected in register, retrying in 10s...');
            await ApiClient.throttle(10000);
            return this.getAuthToken(request, role);
        }

        await ApiClient.assertResponse(`Register ${role}`, regRes);
        const body = await regRes.json();
        const token = body.accessToken;

        // 3. Login alias test (Step 1 requirement)
        const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
            headers: defaultHeaders(),
            data: { email, password }
        });
        await ApiClient.assertResponse(`Login ${role}`, loginRes);

        return token;
    }
}
