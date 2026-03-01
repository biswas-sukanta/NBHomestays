'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';

/**
 * Silent Prefetcher — loads the ENTIRE /search page state into React Query
 * cache in the background, so the Explore page renders instantly.
 *
 * All 5 independent queries fire simultaneously via Promise.all() to
 * eliminate network waterfalls. Fires once after a 2-second delay to
 * avoid competing with the current page's initial render.
 *
 * Query keys EXACTLY match the hooks in search/page.tsx and
 * destination-discovery.tsx for guaranteed cache hits.
 */
export const usePrefetchSearch = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const prefetchData = async () => {
            // ── Fire ALL independent requests at the exact same millisecond ──
            await Promise.all([
                // 1. Destination Discovery row
                queryClient.prefetchQuery({
                    queryKey: ['destinations'],
                    queryFn: () => api.get('/api/destinations').then(res => res.data),
                }),

                // 2. Trending Now swimlane
                queryClient.prefetchQuery({
                    queryKey: ['swimlane', 'Trending Now'],
                    queryFn: () => api.get('/api/homestays/search?tag=' + encodeURIComponent('Trending Now') + '&page=0&size=6').then(res => res.data.content || []),
                }),

                // 3. Explore Offbeat swimlane
                queryClient.prefetchQuery({
                    queryKey: ['swimlane', 'Explore Offbeat'],
                    queryFn: () => api.get('/api/homestays/search?tag=' + encodeURIComponent('Explore Offbeat') + '&page=0&size=6').then(res => res.data.content || []),
                }),

                // 4. Featured Escapes swimlane
                queryClient.prefetchQuery({
                    queryKey: ['swimlane', 'featured'],
                    queryFn: () => api.get('/api/homestays/search?isFeatured=true&page=0&size=8').then(res => res.data.content || []),
                }),

                // 5. All Homestays first page (seeds infinite scroll)
                queryClient.prefetchInfiniteQuery({
                    queryKey: ['allHomestays'],
                    queryFn: () => api.get('/api/homestays/search?page=0&size=12').then(res => res.data),
                    initialPageParam: 0,
                }),
            ]);
        };

        // Delay prefetch so it doesn't compete with the current page's render
        const timeoutId = setTimeout(prefetchData, 2000);
        return () => clearTimeout(timeoutId);
    }, [queryClient]);
};
