import axios from 'axios';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/refresh' && originalRequest.url !== '/api/auth/login') {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                // Use a clean axios instance to avert interceptor loops
                const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/refresh`, { refreshToken });
                const newAccessToken = res.data.accessToken;

                if (typeof window !== 'undefined') {
                    localStorage.setItem('token', newAccessToken);
                    // The backend might also rotate the refresh token, store if passed
                    if (res.data.refreshToken) {
                        localStorage.setItem('refreshToken', res.data.refreshToken);
                    }
                }

                api.defaults.headers.common['Authorization'] = 'Bearer ' + newAccessToken;
                originalRequest.headers['Authorization'] = 'Bearer ' + newAccessToken;

                processQueue(null, newAccessToken);
                return api(originalRequest);
            } catch (err) {
                processQueue(err, null);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    window.location.href = '/login';
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;
