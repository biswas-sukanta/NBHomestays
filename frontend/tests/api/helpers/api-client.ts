import { test, expect, APIRequestContext, APIResponse } from '@playwright/test';

export const API_BASE = process.env.API_BASE_URL || 'http://localhost:8080';

/** Permanent Regression Suite — Central API Client Wrapper */
export class ApiClient {
    constructor(private request: APIRequestContext) { }

    /** Assert response is ok, otherwise log raw Java stack trace for Step 2 requirements. */
    static async assertResponse(label: string, response: APIResponse) {
        if (!response.ok()) {
            const body = await response.text();
            console.error(`[FAILURE] ${label} → HTTP ${response.status()}`);
            console.error(`[RAW STACK TRACE]:\n${body}`);
            throw new Error(`${label} failed with status ${response.status()}`);
        }
    }

    /** Throttle helper for Koyeb free-tier stability. */
    static async throttle(ms: number = 5000) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }
}

/** Standard headers for JSON API requests. */
export const defaultHeaders = (token?: string) => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
});
