import { axiosInstance as api } from '../api-client';

export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    deletePost: (id: string) => api.delete(`/admin/posts/${id}`),
    featureHomestay: (id: string) => api.put(`/admin/homestays/${id}/feature`),
    deleteHomestaysLimit: (limit: number) => api.delete(`/admin/homestays?limit=${limit}`),
    deleteAllHomestays: () => api.delete('/admin/homestays/all'),
    seedHomestays: (count: number) => api.post(`/admin/homestays/seed?count=${count}`)
};
