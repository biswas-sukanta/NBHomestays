import { APIRequestContext } from '@playwright/test';

/**
 * Central API configuration for the NBHomestays regression suite.
 * Reads from environment variable or falls back to the production Koyeb URL.
 */
export const API_BASE =
    process.env.API_BASE_URL ||
    'https://thoughtful-jemie-droidmaniac-8802977f.koyeb.app';

/**
 * Logs any response with status >= 400, printing the full Spring Boot
 * stack trace so the engineer can diagnose the root cause immediately.
 */
export async function logIfError(label: string, res: { status: () => number; url: () => string; text: () => Promise<string> }) {
    if (res.status() >= 400) {
        let body = '';
        try { body = await res.text(); } catch { body = '<unreadable>'; }
        console.error(
            `\n🔴 [${label}] HTTP ${res.status()}\n` +
            `   URL: ${res.url()}\n` +
            `   Body: ${body.substring(0, 3000)}\n`
        );
    }
}

/**
 * Asserts that the response is 2xx. If not, logs the full error body first
 * so the jest output contains the Spring Boot stacktrace.
 */
export async function assertOk(label: string, res: { status: () => number; url: () => string; text: () => Promise<string> }) {
    await logIfError(label, res);
    if (res.status() >= 300) {
        throw new Error(`${label} expected 2xx but got ${res.status()} — ${res.url()}`);
    }
}

/** Shortcut to build auth headers */
export function authHeaders(token: string): Record<string, string> {
    return { Authorization: `Bearer ${token}` };
}
