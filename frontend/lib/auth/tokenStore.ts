/**
 * AI-Safe Token Storage
 * 
 * Access tokens are stored in memory ONLY - never in localStorage.
 * This prevents expired tokens from persisting across sessions.
 * 
 * Refresh tokens are stored in localStorage as a fallback for
 * page refresh scenarios (backend returns them in response body).
 * 
 * Security rationale:
 * - Memory storage: Cleared on tab close/browser refresh
 * - No XSS exposure via localStorage.getItem('token')
 * - Silent refresh handles token expiration automatically
 */

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Store access token in memory (NOT localStorage) */
export function setAccessToken(token: string | null): void {
    accessToken = token;
    // Sync to sessionStorage for page refresh recovery (short-lived)
    if (typeof window !== 'undefined') {
        if (token) {
            sessionStorage.setItem('accessToken', token);
        } else {
            sessionStorage.removeItem('accessToken');
        }
    }
}

/** Get access token from memory */
export function getAccessToken(): string | null {
    // Fallback: restore from sessionStorage on fresh page load
    if (!accessToken && typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('accessToken');
        if (stored) {
            accessToken = stored;
        }
    }
    return accessToken;
}

/** Store refresh token (can use localStorage - long-lived) */
export function setRefreshToken(token: string | null): void {
    refreshToken = token;
    if (typeof window !== 'undefined') {
        if (token) {
            localStorage.setItem('refreshToken', token);
        } else {
            localStorage.removeItem('refreshToken');
        }
    }
}

/** Get refresh token */
export function getRefreshToken(): string | null {
    if (!refreshToken && typeof window !== 'undefined') {
        refreshToken = localStorage.getItem('refreshToken');
    }
    return refreshToken;
}

/** Clear all tokens (logout) */
export function clearTokens(): void {
    accessToken = null;
    refreshToken = null;
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        sessionStorage.removeItem('accessToken');
    }
}

/** Check if user has valid tokens */
export function hasTokens(): boolean {
    return getAccessToken() !== null || getRefreshToken() !== null;
}
