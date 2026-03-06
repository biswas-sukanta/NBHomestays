export interface NormalizedPost {
    id: string;
    authorName: string;
    authorAvatar: string;
    authorId?: string;
    location: string;
    caption: string;
    imageUrl: string | null;
    images: { url: string; fileId?: string }[];
    tags: string[];
    likes: number;
    comments: number;
    shareCount: number;
    createdAt: string;
    // Optional/Legacy compatibility
    homestayId?: string;
    homestayName?: string;
    isLikedByCurrentUser?: boolean;
    isVerifiedHost?: boolean;
    originalPost?: NormalizedPost;
}

export function normalizePost(post: any): NormalizedPost {
    if (!post) return {} as NormalizedPost;

    const media = post.media ?? post.mediaResources ?? [];

    return {
        id: post.id,
        authorName: post.author?.name ?? "Unknown",
        authorAvatar: post.author?.avatarUrl ?? "/images/default-avatar.webp",
        authorId: post.author?.id,
        location: post.locationName ?? "",
        caption: post.textContent ?? "",
        imageUrl: media[0]?.url ?? null,
        images: media,
        tags: post.tags ?? [],
        likes: post.loveCount ?? 0,
        comments: post.commentCount ?? 0,
        shareCount: post.shareCount ?? 0,
        createdAt: post.createdAt,
        homestayId: post.homestayId,
        homestayName: post.homestayName,
        isLikedByCurrentUser: post.isLikedByCurrentUser ?? false,
        isVerifiedHost: post.author?.isVerifiedHost ?? post.author?.verifiedHost ?? false,
        originalPost: post.originalPost ? normalizePost(post.originalPost) : undefined
    };
}
