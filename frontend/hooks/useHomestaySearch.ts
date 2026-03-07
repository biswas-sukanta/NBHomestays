import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

export interface HomestayLookup {
    id: string;
    name: string;
    locationName?: string;
}

/**
 * Unified hook for fetching homestays to be used in post tagging/selectors.
 * Caches results for 1 hour to reduce redundant API calls.
 */
export function useHomestaySearch() {
    return useQuery<HomestayLookup[]>({
        queryKey: ['homestays-lookup'],
        queryFn: async () => {
            const { data } = await api.get('/homestays/lookup');
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
