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

export interface ImageDim {
  mediaId: string;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
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
  // Layout metadata (from FeedLayoutEngine)
  mediaCount?: number;
  textLength?: number;
  imageDimensions?: ImageDim[];
  postCategory?: string;
  postPriority?: number;
}

export type BlockType = 'FEATURED' | 'STANDARD' | 'COLLAGE' | 'PHOTO' | 'HERO' | 'PLACEHOLDER';

export interface RenderHints {
  aspectRatio: string;
  maxImageHeight: number | null;
  showExcerpt: boolean | null;
  layoutMode: string | null;
}

export interface FeedBlock {
  blockId: string;
  blockType: BlockType;
  blockPosition: number;
  blockPriority: number;
  postIds: string[];
  renderHints: RenderHints;
}

export interface FeedResponse {
  posts: PostFeedItem[];
  nextCursor: string | null;
  hasMore: boolean;
  // Optional layout blocks (when layout=true)
  blocks?: FeedBlock[];
}

export interface FeedParams {
  tag?: string;
  cursor?: string;
  limit?: number;
  layout?: boolean;
}

/**
 * Optimized cursor-paginated feed API.
 * Uses native fetch for streaming and better performance.
 * 
 * @param params.layout - Whether to generate layout blocks (default true)
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
  // Default to layout=true for backward compatibility with new clients
  if (params.layout !== false) {
    searchParams.append('layout', 'true');
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
