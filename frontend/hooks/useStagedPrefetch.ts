'use client';

import { useEffect } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { homestayApi } from '@/lib/api/homestays';
import { postApi } from '@/lib/api/posts';

export function useStagedPrefetch(queryClient: QueryClient) {
  useEffect(() => {
    let cancelled = false;

    function run() {
      async function prefetch() {
        try {
          // Stage 2 — Explore
          await queryClient.prefetchQuery({
            queryKey: queryKeys.homestays.swimlane('Trending Now'),
            queryFn: async () => {
              const res = await homestayApi.search(`tag=${encodeURIComponent('Trending Now')}&page=0&size=6`);
              return res.data.content || [];
            },
            staleTime: 1000 * 60 * 30,
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.homestays.swimlane('Explore Offbeat'),
            queryFn: async () => {
              const res = await homestayApi.search(`tag=${encodeURIComponent('Explore Offbeat')}&page=0&size=6`);
              return res.data.content || [];
            },
            staleTime: 1000 * 60 * 30,
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.homestays.featured,
            queryFn: async () => {
              const res = await homestayApi.search('isFeatured=true&page=0&size=8');
              return res.data.content || [];
            },
            staleTime: 1000 * 60 * 30,
          });

          await queryClient.prefetchInfiniteQuery({
            queryKey: queryKeys.homestays.all,
            queryFn: async ({ pageParam = 0 }) => {
              const res = await homestayApi.search(`page=${pageParam}&size=12`);
              return res.data;
            },
            initialPageParam: 0,
            staleTime: 1000 * 60 * 30,
          });

          // Stage 3 — Community
          await queryClient.prefetchInfiniteQuery({
            queryKey: queryKeys.community.feed(),
            queryFn: async ({ pageParam = 0 }) => {
              const { data } = await postApi.getFeed(`page=${pageParam}&size=12&sort=createdAt,desc`);
              return data;
            },
            initialPageParam: 0,
            staleTime: 10000, // 10 seconds — community must be fresh
          });

          await queryClient.prefetchQuery({
            queryKey: queryKeys.community.trending(),
            queryFn: async () => {
              const { data } = await postApi.getFeed('page=0&size=3&sort=loveCount,desc');
              return data;
            },
            staleTime: 10000, // 10 seconds — trending must be fresh
          });
        } catch {
          // Swallow errors: prefetch must never break UX.
        }
      }

      if (!cancelled) {
        prefetch();
      }
    }

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(run);
    } else {
      setTimeout(run, 200);
    }

    return () => {
      cancelled = true;
    };
  }, [queryClient]);
}
