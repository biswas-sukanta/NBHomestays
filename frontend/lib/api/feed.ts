import { apiFetch } from '../api-client';

export interface MediaVariant {
  id: string;
  fileId: string;
  originalUrl: string;
  thumbnail: string;
  small: string;
  medium: string;
  large: string;
}

export interface PostFeedItem {
  postId: string;
  textContent: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  authorRole: string;
  authorVerifiedHost: boolean;
  isLikedByCurrentUser: boolean;
  commentCount: number;
  likeCount: number;
  shareCount: number;
  homestayId?: string;
  homestayName?: string;
  tags: string[];
  media: MediaVariant[];
  isRepost: boolean;
  originalPostId?: string;
  originalAuthorName?: string;
  originalContentPreview?: string;
}

export interface FeedResponse {
  posts: PostFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface FeedParams {
  tag?: string;
  cursor?: string;
  limit?: number;
}

/**
 * Optimized cursor-paginated feed API.
 * Uses native fetch for streaming and better performance.
 */
export async function getFeed(params: FeedParams = {}): Promise<FeedResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.tag) {
    searchParams.append('tag', params.tag);
  }
  if (params.cursor) {
    searchParams.append('cursor', params.cursor);
  }
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const queryString = searchParams.toString();
  // Use path without /api prefix - apiFetch will add it
  const path = `/posts/feed${queryString ? `?${queryString}` : ''}`;

  const response = await apiFetch(path);
  
  if (!response.ok) {
    throw new Error(`Feed API error: ${response.status}`);
  }

  return response.json();
}

/**
 * React Query keys for feed caching.
 */
export const feedKeys = {
  all: ['feed'] as const,
  lists: () => [...feedKeys.all, 'list'] as const,
  list: (params: FeedParams) => [...feedKeys.lists(), params] as const,
};
