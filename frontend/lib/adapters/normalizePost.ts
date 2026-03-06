export interface NormalizedPost {
    id: string;
    author: string;
    authorAvatar: string | null;
    authorId: string | null;
    title: string;
    caption: string;
    location: string;
    imageUrl: string;
    likes: number;
    comments: number;
    views: number;
    tags: string[];
    createdAt: string;
    isLikedByCurrentUser?: boolean;
    shareCount?: number;
    homestayId?: string;
    homestayName?: string;
    originalPost?: any;
    isVerifiedHost?: boolean;
}

export function normalizePost(post: any): NormalizedPost {
    let imageUrl = '/_static/community/post_placeholder.webp';
    if (post.media && post.media.length > 0 && post.media[0].url) {
        imageUrl = post.media[0].url;
    } else if (post.media_resources && post.media_resources.length > 0 && post.media_resources[0].url) {
        imageUrl = post.media_resources[0].url;
    }

    return {
        id: post.id || '',
        author: post.author?.name || 'Unknown User',
        authorAvatar: post.author?.avatarUrl || null,
        authorId: post.author?.id || null,
        title: post.title || post.locationName || '',
        caption: post.textContent || '',
        location: post.locationName || '',
        imageUrl,
        likes: post.loveCount || post.likes || 0,
        comments: post.commentCount || post.comments || 0,
        views: post.views || 0,
        tags: post.tags || [],
        createdAt: post.createdAt || new Date().toISOString(),
        isLikedByCurrentUser: post.isLikedByCurrentUser || false,
        shareCount: post.shareCount || 0,
        homestayId: post.homestayId,
        homestayName: post.homestayName,
        originalPost: post.originalPost ? normalizePost(post.originalPost) : undefined,
        isVerifiedHost: post.author?.isVerifiedHost || post.author?.verifiedHost || false,
    };
}
