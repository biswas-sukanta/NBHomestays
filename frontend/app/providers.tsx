import type { ReactNode } from 'react';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { destinationApi } from '@/lib/api/destinations';

// Client component wrapper that provides QueryClient + persistence
import QueryProvider from '@/components/query-provider';

export default async function Providers({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();

  // Prefetch static data with 24h staleTime (won't refetch on client mount)
  await queryClient.prefetchQuery({
    queryKey: queryKeys.states,
    queryFn: () => destinationApi.getStates().then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24,
  });

  await queryClient.prefetchQuery({
    queryKey: queryKeys.destinations.all,
    queryFn: () => destinationApi.getDestinations().then((res) => res.data),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const dehydratedState = dehydrate(queryClient);

  // QueryProvider wraps with QueryClientProvider, then HydrationBoundary hydrates
  return (
    <QueryProvider>
      <HydrationBoundary state={dehydratedState}>
        {children}
      </HydrationBoundary>
    </QueryProvider>
  );
}
