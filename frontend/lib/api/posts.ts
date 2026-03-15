import { axiosInstance as api, apiFetch } from '../api-client';

/**
 * Helper to ensure payload is FormData for multipart endpoints.
 * If payload is already FormData, returns as-is.
 * If payload has files property or is an object, wraps in FormData.
 */
function ensureFormData(payload: any): FormData | any {
    if (payload instanceof FormData) {
        return payload;
    }
    // If payload has files or looks like it needs multipart, convert to FormData
    if (payload && typeof payload === 'object' && (payload.files || payload instanceof Blob)) {
        const formData = new FormData();
        Object.keys(payload).forEach(key => {
            const value = payload[key];
            if (Array.isArray(value)) {
                value.forEach(v => formData.append(key, v));
            } else {
                formData.append(key, value);
            }
        });
        return formData;
    }
    return payload;
}

export const postApi = {
    // Feed and query
    getFeed: (params: string) => api.get(`/posts/feed?${params}`),
    getMyPosts: () => api.get('/posts/my-posts'),
    getById: (id: string) => api.get(`/posts/${id}`),

    // Commands - defensive: ensure FormData for multipart endpoints
    create: (data: any) => api.post('/posts', ensureFormData(data)),
    update: (id: string, data: any) => api.put(`/posts/${id}`, ensureFormData(data)),
    delete: (id: string) => api.delete(`/posts/${id}`),
    like: (id: string) => api.post(`/posts/${id}/like`),
    unlike: (id: string) => api.delete(`/posts/${id}/like`),
    share: (id: string) => api.post(`/posts/${id}/share`),
    
    // Helpful vote (Phase 3 - Elevation Engine)
    markHelpful: (id: string) => api.post(`/posts/${id}/helpful`),

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
        }),

    // Rollback: Delete uploaded media files when post creation fails
    rollbackMedia: (fileIds: string[]) => api.delete('/images/rollback', { data: fileIds })
};
