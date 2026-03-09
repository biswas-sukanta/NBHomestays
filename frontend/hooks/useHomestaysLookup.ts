import { useQuery } from '@tanstack/react-query';
import { homestayApi } from '@/lib/api/homestays';
import { queryKeys } from '@/lib/queryKeys';

export interface HomestayLookup {
    id: string;
    name: string;
    locationName?: string;
}

export function useHomestaysLookup() {
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
