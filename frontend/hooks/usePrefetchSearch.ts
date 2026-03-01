'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import api from '@/lib/api';

/**
 * Silent Prefetcher — loads critical /search page data into React Query cache
 * in the background, so the Explore page renders instantly when navigated to.
 *
 * Fires once after a 2-second delay to avoid blocking the initial page render.
 * Uses the EXACT same queryKey arrays as the search page hooks.
 */
export const usePrefetchSearch = () => {
    const queryClient = useQueryClient();

    useEffect(() => {
        const prefetchData = async () => {
            // 1. Destinations (matches DestinationDiscovery component)
            await queryClient.prefetchQuery({
                queryKey: ['destinations'],
                queryFn: () => api.get('/api/destinations').then(res => res.data),
            });

            // 2. Trending Now swimlane
            await queryClient.prefetchQuery({
                queryKey: ['swimlane', 'Trending Now'],
                queryFn: () => api.get('/api/homestays/search?tag=' + encodeURIComponent('Trending Now') + '&page=0&size=6').then(res => res.data.content || []),
            });

            // 3. Explore Offbeat swimlane
            await queryClient.prefetchQuery({
                queryKey: ['swimlane', 'Explore Offbeat'],
                queryFn: () => api.get('/api/homestays/search?tag=' + encodeURIComponent('Explore Offbeat') + '&page=0&size=6').then(res => res.data.content || []),
            });

            // 4. Featured Escapes swimlane
            await queryClient.prefetchQuery({
                queryKey: ['swimlane', 'featured'],
                queryFn: () => api.get('/api/homestays/search?isFeatured=true&page=0&size=8').then(res => res.data.content || []),
            });

            // 5. All Homestays first page (seeds the infinite scroll)
            await queryClient.prefetchInfiniteQuery({
                queryKey: ['allHomestays'],
                queryFn: () => api.get('/api/homestays/search?page=0&size=12').then(res => res.data),
                initialPageParam: 0,
            });
        };

        // Delay prefetch so it doesn't compete with the current page's render
        const timeoutId = setTimeout(prefetchData, 2000);
        return () => clearTimeout(timeoutId);
    }, [queryClient]);
};
