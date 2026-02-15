/**
 * Configured API client singletons.
 * Uses the generated OpenAPI client with JWT auth interceptor.
 */
import axios from 'axios';
import { Configuration } from '@/src/lib/api/configuration';
import { HomestayControllerApi } from '@/src/lib/api/clients/homestay-controller-api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Axios instance with JWT interceptor
const axiosInstance = axios.create({ baseURL: API_BASE });
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
