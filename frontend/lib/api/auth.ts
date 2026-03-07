import { axiosInstance as api } from '../api-client';

export const authApi = {
    login: (credentials: any) => api.post('/auth/authenticate', credentials),
    register: (data: any) => api.post('/auth/register', data),
    refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken })
};
