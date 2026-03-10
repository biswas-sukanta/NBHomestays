import { axiosInstance as api } from '../api-client';

/**
 * Helper to ensure payload is FormData for multipart endpoints.
 * If payload is already FormData, returns as-is.
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

export const homestayApi = {
    // Queries
    getById: (id: string) => api.get(`/homestays/${id}`),
    getLookup: () => api.get('/homestays/lookup'),
    search: (params: string) => api.get(`/homestays/search?${params}`),
    getMyListings: () => api.get('/homestays/my-listings'),
    getPending: () => api.get('/homestays/pending'),

    // Commands - defensive: ensure FormData for multipart endpoints
    create: (data: any) => api.post('/homestays', ensureFormData(data)),
    update: (id: string, data: any) => api.put(`/homestays/${id}`, ensureFormData(data)),
    delete: (id: string) => api.delete(`/homestays/${id}`),
    approve: (id: string, data?: any) => api.put(`/homestays/${id}/approve`, data),
    reject: (id: string, data?: any) => api.put(`/homestays/${id}/reject`, data),

    // Q&A
    getQuestions: (id: string) => api.get(`/homestays/${id}/questions`),
    askQuestion: (id: string, text: string) => api.post(`/homestays/${id}/questions`, { text }),
    updateQuestion: (questionId: string, text: string) => api.put(`/questions/${questionId}`, { text }),
    deleteQuestion: (questionId: string) => api.delete(`/questions/${questionId}`),

    answerQuestion: (questionId: string, text: string) => api.post(`/questions/${questionId}/answers`, { text }),
    updateAnswer: (answerId: string, text: string) => api.put(`/answers/${answerId}`, { text }),
    deleteAnswer: (answerId: string) => api.delete(`/answers/${answerId}`)
};
