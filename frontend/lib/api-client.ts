/**
 * Production-Grade API Client with Silent Token Refresh
 * 
 * Features:
 * - Memory-only access token storage (AI-safe)
 * - Automatic token refresh on 401
 * - Request queuing during refresh
 * - Public endpoint support (no auth required)
 * 
 * Architecture inspired by Airbnb/Stripe auth patterns.
 */
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Configuration } from '@/src/lib/api/configuration';
import { HomestayControllerApi } from '@/src/lib/api/clients/homestay-controller-api';
import { getAccessToken, setAccessToken, getRefreshToken, clearTokens } from './auth/tokenStore';

const API_BASE = '/api';

// ── Public Endpoints (no auth required) ─────────────────────────────────────
const PUBLIC_ENDPOINTS = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/authenticate',
    '/api/auth/refresh',
    '/api/destinations',
    '/api/states',
    '/api/homestays',
    '/api/posts',
    '/api/health',
    '/actuator',
];

function isPublicEndpoint(url: string | undefined): boolean {
    if (!url) return false;
    return PUBLIC_ENDPOINTS.some(endpoint => url.startsWith(endpoint));
}

// ── Refresh Token Management ────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: Error) => void }> = [];

function processQueue(token: string, error: Error | null) {
    failedQueue.forEach(promise => {
        if (error) {
            promise.reject(error);
        } else {
            promise.resolve(token);
        }
    });
    failedQueue = [];
}

async function refreshAccessToken(): Promise<string | null> {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
        clearTokens();
        return null;
    }

    try {
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setAccessToken(accessToken);
        if (newRefreshToken) {
            // Store new refresh token if provided
            localStorage.setItem('refreshToken', newRefreshToken);
        }
        return accessToken;
    } catch (error) {
        clearTokens();
        // Redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return null;
    }
}

// ── Axios Instance with Interceptors ────────────────────────────────────────
export const axiosInstance = axios.create({ baseURL: API_BASE });

// Request interceptor: Attach token if present and not public endpoint
axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    // Skip auth for public endpoints
    if (isPublicEndpoint(config.url)) {
        return config;
    }

    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: Handle 401 with silent refresh
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip if not 401 or already retried
        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Skip refresh for public endpoints
        if (isPublicEndpoint(originalRequest.url)) {
            return Promise.reject(error);
        }

        // If already refreshing, queue this request
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return axiosInstance(originalRequest);
            }).catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const newToken = await refreshAccessToken();
            if (newToken) {
                processQueue(newToken, null);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            }
        } catch (refreshError) {
            processQueue('', refreshError as Error);
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }

        return Promise.reject(error);
    }
);

const configuration = new Configuration({ basePath: API_BASE });

/** Typed Homestay API client — replaces all manual `api.get('/homestays/...')` calls */
export const homestayApi = new HomestayControllerApi(configuration, API_BASE, axiosInstance);

/** 
 * Safe fetch wrapper that automatically applies the /api prefix.
 * Use this for all native fetch() calls instead of hardcoding API URLs.
 * Defensive: normalizes paths that accidentally include /api prefix.
 * 
 * NOTE: For authenticated requests, prefer axiosInstance which handles
 * token refresh automatically. Use apiFetch only for public endpoints
 * or when axios is not suitable (e.g., file uploads with progress).
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
    // Normalize: strip leading slash
    let clean = path.startsWith('/') ? path.slice(1) : path;
    // Defensive: strip accidental 'api/' prefix to prevent double /api/api
    if (clean.startsWith('api/')) {
        clean = clean.slice(4);
    }

    // In server components, we might need the absolute URL if NEXT_PUBLIC_API_URL is set
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    
    // Attach auth header if token exists and not public endpoint
    const token = getAccessToken();
    const isPublic = isPublicEndpoint(`/api/${clean}`);
    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string>),
    };
    
    if (token && !isPublic && !headers.Authorization) {
        headers.Authorization = `Bearer ${token}`;
    }
    
    return fetch(`${baseUrl}/api/${clean}`, {
        ...options,
        headers,
    });
}

/**
 * Authenticated fetch wrapper with automatic token refresh.
 * Use this for authenticated native fetch calls.
 * Returns null and redirects to login if refresh fails.
 */
export async function authFetch(path: string, options: RequestInit = {}): Promise<Response | null> {
    const token = getAccessToken();
    if (!token) {
        const newToken = await refreshAccessToken();
        if (!newToken) return null;
    }
    
    return apiFetch(path, options);
}
