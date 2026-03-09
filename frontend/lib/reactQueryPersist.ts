import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import type { QueryClient } from '@tanstack/react-query';

/**
 * React Query cache persistence to localStorage.
 * - maxAge: 6 hours — cache entries older than this are discarded on restore
 * - Community queries are NEVER persisted to ensure real-time feed data
 * - buster: '' — change this string to invalidate all cached data on deploy
 */
export function setupQueryPersistence(queryClient: QueryClient) {
  if (typeof window === 'undefined') return;

  const persister = createSyncStoragePersister({
    key: 'REACT_QUERY_OFFLINE_CACHE',
    storage: window.localStorage,
    // Serialize only the query key and data (not metadata)
    serialize: (data) => JSON.stringify(data),
    deserialize: (str) => JSON.parse(str),
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 6, // 6 hours
    buster: '', // Change to invalidate all cache on breaking changes
    dehydrateOptions: {
      shouldDehydrateQuery: (query) => {
        const key = query.queryKey;

        // Do NOT persist community queries — users must always see fresh feed data
        if (Array.isArray(key) && key.some(k => typeof k === 'string' && k === 'community')) {
          return false;
        }

        return true;
      },
    },
  });
}
