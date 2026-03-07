import { axiosInstance as api } from '../api-client';

export const userApi = {
    updateProfile: (data: any) => api.put('/users/profile', data),
    getProfile: (userId: string) => api.get(`/users/${userId}/profile`)
};
