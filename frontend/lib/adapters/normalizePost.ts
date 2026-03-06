export interface NormalizedPost {
    id: string;
    author: string;
    avatar: string;
    location: string;
    caption: string;
    imageUrl: string | null;
    tags: string[];
    likes: number;
    comments: number;
    createdAt: string;
    // Optional fields for extended functionality
    authorAvatar?: string | null;
    authorId?: string | null;
    title?: string;
    views?: number;
    isLikedByCurrentUser?: boolean;
    shareCount?: number;
    homestayId?: string;
    homestayName?: string;
    originalPost?: any;
    isVerifiedHost?: boolean;
}

export function normalizePost(post: any): NormalizedPost {
    if (!post) return {} as NormalizedPost;

    return {
        id: post.id,
        author: post.author?.name ?? "Unknown",
        avatar: post.author?.avatarUrl ?? "/images/default-avatar.webp",
        location: post.locationName ?? "",
        caption: post.textContent ?? "",
        imageUrl: post.media?.[0]?.url ?? post.mediaResources?.[0]?.url ?? null,
        tags: post.tags ?? [],
        likes: post.loveCount ?? 0,
        comments: post.commentCount ?? 0,
        createdAt: post.createdAt,
        // Carry over other fields if present
        authorAvatar: post.author?.avatarUrl ?? "/images/default-avatar.webp",
        authorId: post.author?.id,
        title: post.title ?? post.locationName ?? "",
        isLikedByCurrentUser: post.isLikedByCurrentUser ?? false,
        homestayId: post.homestayId,
        homestayName: post.homestayName,
        isVerifiedHost: post.author?.isVerifiedHost ?? post.author?.verifiedHost ?? false,
        originalPost: post.originalPost ? normalizePost(post.originalPost) : undefined
    };
}
