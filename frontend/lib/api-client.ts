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
 */
export async function apiFetch(path: string, options: RequestInit = {}) {
    // Strip leading slash to ensure clean merge
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;

    // In server components, we might need the absolute URL if NEXT_PUBLIC_API_URL is set
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    return fetch(`${baseUrl}/api/${cleanPath}`, options);
}
