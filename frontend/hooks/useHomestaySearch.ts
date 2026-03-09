import { useQuery } from '@tanstack/react-query';
import { homestayApi } from '@/lib/api/homestays';
import { queryKeys } from '@/lib/queryKeys';

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
        queryKey: queryKeys.homestays.lookup,
        queryFn: async () => {
            const { data } = await homestayApi.getLookup();
            return data;
        },
        staleTime: 1000 * 60 * 60, // 1 hour
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
    });
}
