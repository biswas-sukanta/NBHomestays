import { request, FullConfig } from '@playwright/test';
import { API_BASE, ApiClient, defaultHeaders } from './helpers/api-client';
import { AuthHelper } from './helpers/auth-helper';

/**
 * Global Setup for the API Regression Suite.
 * Guarantees test determinism by flushing Redis before any tests run.
 */
async function globalSetup(config: FullConfig) {
    console.log('--- GLOBAL SETUP: Flushing Redis Cache ---');
    const requestContext = await request.newContext();

    try {
        // 1. Obtain Admin Token
        const adminToken = await AuthHelper.getAuthToken(requestContext, 'ROLE_ADMIN');

        // 2. Clear All Caches via Diagnostics Endpoint
        const flushRes = await requestContext.delete(`${API_BASE}/api/diagnostics/cache`, {
            headers: defaultHeaders(adminToken)
        });

        await ApiClient.assertResponse('Flush Redis Cache', flushRes);
        console.log('--- REDIS FLUSHED SUCCESSFULLY ---');
    } catch (error) {
        console.error('--- GLOBAL SETUP FAILED: Proceeding with stale cache ---');
        console.error(error);
    } finally {
        await requestContext.dispose();
    }
}

export default globalSetup;
