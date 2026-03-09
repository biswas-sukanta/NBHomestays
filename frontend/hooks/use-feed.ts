import { useInfiniteQuery, useQueryClient, useQuery } from '@tanstack/react-query';
import { getFeed, feedKeys, FeedParams, FeedResponse, PostFeedItem } from '@/lib/api/feed';

interface UseFeedOptions {
  tag?: string;
  limit?: number;
  enabled?: boolean;
}

/**
 * React Query hook for cursor-paginated feed.
 * Uses infinite query with cursor-based pagination.
 */
export function useFeed(options: UseFeedOptions = {}) {
  const { tag, limit = 12, enabled = true } = options;
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: feedKeys.list({ tag, limit }),
    queryFn: ({ pageParam }) => getFeed({ tag, cursor: pageParam, limit }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage: FeedResponse) => lastPage.nextCursor ?? undefined,
    enabled,
    staleTime: 10_000, // 10 seconds
    gcTime: 60_000, // 1 minute
  });

  // Prefetch next page at 70% scroll threshold
  const prefetchNextPage = async () => {
    const pages = query.data?.pages ?? [];
    if (pages.length === 0) return;
    
    const lastPage = pages[pages.length - 1];
    if (!lastPage.nextCursor) return;
    
    // Check if already prefetched
    const cachedData = queryClient.getQueryData(feedKeys.list({ tag, limit }));
    if (cachedData && (cachedData as any).pages?.length > pages.length) {
      return; // Already prefetched
    }
    
    await queryClient.prefetchInfiniteQuery({
      queryKey: feedKeys.list({ tag, limit }),
      queryFn: ({ pageParam }) => getFeed({ tag, cursor: pageParam, limit }),
      initialPageParam: lastPage.nextCursor,
    });
  };

  return {
    ...query,
    prefetchNextPage,
  };
}

/**
 * Optimistic update helpers for feed mutations.
 */
export function useFeedMutations() {
  const queryClient = useQueryClient();

  /**
   * Optimistically add a new post to the feed.
   */
  const addPostOptimistic = (newPost: PostFeedItem, tag?: string) => {
    queryClient.setQueryData(
      feedKeys.list({ tag, limit: 12 }),
      (old: { pages: FeedResponse[]; pageParams: (string | undefined)[] } | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map((page, idx) => 
            idx === 0 
              ? { ...page, posts: [newPost, ...page.posts] }
              : page
          ),
        };
      }
    );
  };

  /**
   * Optimistically remove a post from the feed.
   */
  const removePostOptimistic = (postId: string, tag?: string) => {
    queryClient.setQueryData(
      feedKeys.list({ tag, limit: 12 }),
      (old: { pages: FeedResponse[]; pageParams: (string | undefined)[] } | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.filter(p => p.postId !== postId),
          })),
        };
      }
    );
  };

  /**
   * Optimistically toggle like status.
   */
  const toggleLikeOptimistic = (postId: string, tag?: string) => {
    queryClient.setQueryData(
      feedKeys.list({ tag, limit: 12 }),
      (old: { pages: FeedResponse[]; pageParams: (string | undefined)[] } | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.map(p => 
              p.postId === postId
                ? {
                    ...p,
                    isLikedByCurrentUser: !p.isLikedByCurrentUser,
                    likeCount: p.isLikedByCurrentUser ? p.likeCount - 1 : p.likeCount + 1,
                  }
                : p
            ),
          })),
        };
      }
    );
  };

  /**
   * Optimistically increment share count.
   */
  const incrementShareOptimistic = (postId: string, tag?: string) => {
    queryClient.setQueryData(
      feedKeys.list({ tag, limit: 12 }),
      (old: { pages: FeedResponse[]; pageParams: (string | undefined)[] } | undefined) => {
        if (!old) return old;
        
        return {
          ...old,
          pages: old.pages.map(page => ({
            ...page,
            posts: page.posts.map(p => 
              p.postId === postId
                ? { ...p, shareCount: p.shareCount + 1 }
                : p
            ),
          })),
        };
      }
    );
  };

  /**
   * Rollback optimistic update on error.
   */
  const rollback = (tag?: string) => {
    queryClient.invalidateQueries({ queryKey: feedKeys.list({ tag, limit: 12 }) });
  };

  return {
    addPostOptimistic,
    removePostOptimistic,
    toggleLikeOptimistic,
    incrementShareOptimistic,
    rollback,
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: feedKeys.all }),
  };
}
