import { resolveAvatarUrl } from '@/lib/avatar'

export interface MediaVariant {
    id: string;
    fileId?: string;
    url: string;
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
}

export interface NormalizedPost {
    id: string;
    authorName: string;
    authorAvatar: string;
    authorId?: string;
    location: string;
    caption: string;
    imageUrl: string | null;
    images: MediaVariant[];
    tags: string[];
    likes: number;
    comments: number;
    shareCount: number;
    createdAt: string;
    postType?: string;
    isEditorial?: boolean;
    isFeatured?: boolean;
    isPinned?: boolean;
    isTrending?: boolean;
    viewCount?: number;
    trendingScore?: number;
    editorialScore?: number;
    // Optional/Legacy compatibility
    destinationId?: string;
    homestayId?: string;
    homestayName?: string;
    isLikedByCurrentUser?: boolean;
    isVerifiedHost?: boolean;
    originalPost?: NormalizedPost;
    // Elevation Engine fields
    helpfulCount?: number;
    lastComputedXp?: number;
}

export function normalizePost(post: any): NormalizedPost {
    if (!post) return {} as NormalizedPost;

    const authorId = post.authorId ?? post.author?.id
    const authorName = post.authorName ?? post.author?.name ?? "Unknown"
    const authorAvatar = resolveAvatarUrl(authorId, post.authorAvatarUrl ?? post.author?.avatarUrl, authorName)

    // Handle both cursor API format (PostFeedDto) and legacy format
    const media = (post.media ?? post.mediaResources ?? []).map((m: any) => ({
        id: m.id || m.postId || '',
        fileId: m.fileId,
        url: m.originalUrl ?? m.url ?? '',
        thumbnail: m.thumbnail,
        small: m.small,
        medium: m.medium,
        large: m.large,
    }));

    return {
        id: post.postId ?? post.id,
        authorName,
        authorAvatar,
        authorId,
        location: post.homestayName ?? post.locationName ?? "",
        caption: post.textContent ?? "",
        imageUrl: media[0]?.url ?? null,
        images: media,
        tags: post.tags ?? [],
        likes: post.likeCount ?? post.loveCount ?? 0,
        comments: post.commentCount ?? 0,
        shareCount: post.shareCount ?? 0,
        createdAt: post.createdAt,
        postType: post.postType,
        isEditorial: post.isEditorial ?? false,
        isFeatured: post.isFeatured ?? false,
        isPinned: post.isPinned ?? false,
        isTrending: post.isTrending ?? false,
        viewCount: post.viewCount ?? 0,
        trendingScore: post.trendingScore ?? 0,
        editorialScore: post.editorialScore ?? 0,
        destinationId: post.destinationId,
        homestayId: post.homestayId,
        homestayName: post.homestayName,
        isLikedByCurrentUser: post.isLikedByCurrentUser ?? false,
        isVerifiedHost: post.authorVerifiedHost ?? post.author?.isVerifiedHost ?? post.author?.verifiedHost ?? false,
        originalPost: post.originalPost ? normalizePost(post.originalPost) : undefined,
        // Elevation Engine fields
        helpfulCount: post.helpfulCount ?? 0,
        lastComputedXp: post.lastComputedXp ?? 0,
    };
}
