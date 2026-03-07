import { axiosInstance as api, apiFetch } from '../api-client';

export const postApi = {
    // Feed and query
    getFeed: (params: string) => api.get(`/posts?${params}`),
    getMyPosts: () => api.get('/posts/my-posts'),
    getById: (id: string) => api.get(`/posts/${id}`),

    // Commands
    create: (data: any) => api.post('/posts', data),
    update: (id: string, data: any) => api.put(`/posts/${id}`, data),
    delete: (id: string) => api.delete(`/posts/${id}`),
    like: (id: string) => api.post(`/posts/${id}/like`),
    unlike: (id: string) => api.delete(`/posts/${id}/like`),
    share: (id: string) => api.post(`/posts/${id}/share`),

    // Comments via native fetch (since they upload images and use advanced stream logic)
    getCommentsFetch: (postId: string, page = 0, size = 20) =>
        apiFetch(`/posts/${postId}/comments?page=${page}&size=${size}`).then(res => res.json()),

    createCommentFetch: (postId: string, data: any, token: string | null) =>
        apiFetch(`/posts/${postId}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(data)
        }),

    updateCommentFetch: (postId: string, commentId: string, data: any, token: string | null) =>
        apiFetch(`/posts/${postId}/comments/${commentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(data)
        }),

    deleteCommentFetch: (commentId: string, token: string | null) =>
        apiFetch(`/comments/${commentId}`, {
            method: 'DELETE',
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),

    replyToCommentFetch: (postId: string, commentId: string, data: any, token: string | null) =>
        apiFetch(`/posts/${postId}/comments/${commentId}/replies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(data)
        })
};
