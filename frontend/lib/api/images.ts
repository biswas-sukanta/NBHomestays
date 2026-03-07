import { apiFetch } from '../api-client';

export const imageApi = {
    uploadMultipleFetch: (formData: FormData, token: string | null) =>
        apiFetch(`/images/upload-multiple`, {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
};
