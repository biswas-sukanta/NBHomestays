'use client';

import React, { useRef, useCallback, memo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PostFeedItem, FeedResponse } from '@/lib/api/feed';
import { ResponsiveImage, MediaGallery } from '@/components/ui/responsive-image';
import { cn } from '@/lib/utils';

interface VirtualizedFeedListProps {
  pages: FeedResponse[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  prefetchNextPage?: () => void;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  onPostClick?: (postId: string) => void;
}

/**
 * Virtualized feed list using @tanstack/react-virtual.
 * Only renders visible posts for optimal performance.
 * Includes prefetch at 70% scroll threshold.
 */
export function VirtualizedFeedList({
  pages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  prefetchNextPage,
  onLike,
  onComment,
  onShare,
  onAuthorClick,
  onPostClick,
}: VirtualizedFeedListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Flatten all posts from pages
  const allPosts = pages.flatMap(page => page.posts);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allPosts.length + 1 : allPosts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Estimated post height
    overscan: 3, // Render 3 extra posts above/below viewport
  });

  // Prefetch at 70% scroll threshold
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !prefetchNextPage) return;
    
    const handleScroll = () => {
      const scrollElement = parentRef.current;
      if (!scrollElement) return;
      
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      // Prefetch when scroll reaches 70%
      if (scrollPercentage >= 0.7) {
        prefetchNextPage();
      }
    };
    
    const scrollElement = parentRef.current;
    scrollElement?.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement?.removeEventListener('scroll', handleScroll);
    };
  }, [hasNextPage, isFetchingNextPage, prefetchNextPage]);

  // Infinite scroll trigger
  const lastItemRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      
      const virtualItems = rowVirtualizer.getVirtualItems();
      const lastItem = virtualItems[virtualItems.length - 1];
      
      if (lastItem && lastItem.index >= allPosts.length - 1 && hasNextPage) {
        fetchNextPage();
      }
    },
    [isFetchingNextPage, allPosts.length, hasNextPage, fetchNextPage, rowVirtualizer]
  );

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const isLoaderRow = virtualRow.index > allPosts.length - 1;
          const post = allPosts[virtualRow.index];

          return (
            <div
              key={virtualRow.key}
              ref={virtualRow.index === allPosts.length - 1 ? lastItemRef : undefined}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {isLoaderRow ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-pulse text-muted-foreground">
                    Loading more posts...
                  </div>
                </div>
              ) : post ? (
                <FeedPostCard
                  post={post}
                  onLike={onLike}
                  onComment={onComment}
                  onShare={onShare}
                  onAuthorClick={onAuthorClick}
                  onPostClick={onPostClick}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface FeedPostCardProps {
  post: PostFeedItem;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onShare?: (postId: string) => void;
  onAuthorClick?: (authorId: string) => void;
  onPostClick?: (postId: string) => void;
}

/**
 * Memoized post card for virtualized list.
 */
const FeedPostCard = memo(function FeedPostCard({
  post,
  onLike,
  onComment,
  onShare,
  onAuthorClick,
  onPostClick,
}: FeedPostCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <article className="bg-card border-b border-border p-4">
      {/* Repost indicator */}
      {post.isRepost && post.originalAuthorName && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-5m15.357 5H15" />
          </svg>
          <span>Reposted from {post.originalAuthorName}</span>
        </div>
      )}

      {/* Author header */}
      <header className="flex items-center gap-3 mb-3">
        <button
          onClick={() => onAuthorClick?.(post.authorId)}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          {post.authorAvatarUrl ? (
            <img
              src={post.authorAvatarUrl}
              alt={post.authorName}
              className="w-10 h-10 rounded-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              {post.authorName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{post.authorName}</span>
              {post.authorVerifiedHost && (
                <span className="text-blue-500 text-xs">✓ Verified Host</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{formatDate(post.createdAt)}</span>
          </div>
        </button>
      </header>

      {/* Content */}
      <div
        className="cursor-pointer"
        onClick={() => onPostClick?.(post.postId)}
      >
        {post.textContent && (
          <p className="text-sm mb-3 whitespace-pre-wrap line-clamp-6">
            {post.textContent}
          </p>
        )}

        {/* Original content preview for reposts */}
        {post.isRepost && post.originalContentPreview && (
          <div className="border-l-2 border-muted pl-3 mb-3 text-sm text-muted-foreground italic">
            "{post.originalContentPreview}"
          </div>
        )}

        {/* Media gallery */}
        {post.media && post.media.length > 0 && (
          <MediaGallery media={post.media} className="mb-3 rounded-lg overflow-hidden" />
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Homestay link */}
        {post.homestayId && post.homestayName && (
          <div className="text-sm text-primary mb-3">
            📍 {post.homestayName}
          </div>
        )}
      </div>

      {/* Actions */}
      <footer className="flex items-center gap-6 pt-2">
        <button
          onClick={() => onLike?.(post.postId)}
          className={cn(
            'flex items-center gap-1 text-sm transition-colors',
            post.isLikedByCurrentUser ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
          )}
        >
          <svg
            className="w-5 h-5"
            fill={post.isLikedByCurrentUser ? 'currentColor' : 'none'}
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{post.likeCount}</span>
        </button>

        <button
          onClick={() => onComment?.(post.postId)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{post.commentCount}</span>
        </button>

        <button
          onClick={() => onShare?.(post.postId)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>{post.shareCount}</span>
        </button>
      </footer>
    </article>
  );
});
