import { axiosInstance as api, apiFetch } from '../api-client';

export const imageApi = {
    uploadMultiple: (formData: FormData) =>
        api.post('/images/upload-multiple', formData),
    uploadMultipleFetch: (formData: FormData, token: string | null) =>
        apiFetch(`/images/upload-multiple`, {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
    rollbackMedia: (fileIds: string[]) => api.delete('/images/rollback', { data: fileIds })
};
