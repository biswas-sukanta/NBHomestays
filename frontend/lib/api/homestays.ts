import { axiosInstance as api } from '../api-client';

export const homestayApi = {
    // Queries
    getById: (id: string) => api.get(`/homestays/${id}`),
    getLookup: () => api.get('/homestays/lookup'),
    search: (params: string) => api.get(`/homestays/search?${params}`),
    getMyListings: () => api.get('/homestays/my-listings'),
    getPending: () => api.get('/homestays/pending'),

    // Commands
    create: (data: any) => api.post('/homestays', data),
    update: (id: string, data: any) => api.put(`/homestays/${id}`, data),
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
