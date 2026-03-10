/**
 * Configured API client singletons.
 * Uses the generated OpenAPI client with JWT auth interceptor.
 */
import axios from 'axios';
import { Configuration } from '@/src/lib/api/configuration';
import { HomestayControllerApi } from '@/src/lib/api/clients/homestay-controller-api';

const API_BASE = '/api';

// Axios instance with JWT interceptor
export const axiosInstance = axios.create({ baseURL: API_BASE });
axiosInstance.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const configuration = new Configuration({ basePath: API_BASE });

/** Typed Homestay API client — replaces all manual `api.get('/homestays/...')` calls */
export const homestayApi = new HomestayControllerApi(configuration, API_BASE, axiosInstance);

/** 
 * Safe fetch wrapper that automatically applies the /api prefix.
 * Use this for all native fetch() calls instead of hardcoding API URLs.
 * Defensive: normalizes paths that accidentally include /api prefix.
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
    return fetch(`${baseUrl}/api/${clean}`, options);
}
