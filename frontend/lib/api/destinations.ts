import { axiosInstance as api } from '../api-client';

export const destinationApi = {
    getStates: () => api.get('/states'),
    getState: (slug: string) => api.get(`/states/${slug}`),
    getStateDestinations: (slug: string) => api.get(`/states/${slug}/destinations`),
    getDestinations: () => api.get('/destinations'),
    getDestination: (slug: string) => api.get(`/destinations/${slug}`),
    getDestinationHomestays: (slug: string, params: string) => api.get(`/destinations/${slug}/homestays?${params}`)
};
