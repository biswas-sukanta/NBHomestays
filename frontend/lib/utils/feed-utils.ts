/**
 * Shared utilities for Community Feed components.
 * Eliminates duplicate logic across card variants.
 */

import type { FeedBlock, PostFeedItem, BlockType } from '@/lib/api/feed';

/**
 * Extracts title and excerpt from post text content.
 * Title: First 8-12 words (or 30% of content)
 * Excerpt: Remaining text, truncated to 200 chars
 */
export function extractTitleAndExcerpt(text: string): { title: string; excerpt: string } {
    if (!text) return { title: '', excerpt: '' };
    
    // Remove leading emojis and hashtags
    let cleaned = text.replace(/^[\s#\u{1F300}-\u{1F9FF}]+/iu, '').trim();
    
    // Get first 8-12 words for title
    const words = cleaned.split(/\s+/);
    const titleWordCount = Math.min(12, Math.max(8, Math.ceil(words.length * 0.3)));
    const title = words.slice(0, titleWordCount).join(' ');
    
    // Rest becomes excerpt
    const excerpt = words.slice(titleWordCount).join(' ').trim();
    
    return { title, excerpt: excerpt.slice(0, 200) };
}

/**
 * Formats relative time from ISO date string.
 */
export function formatRelative(isoDate: string): string {
    if (!isoDate) return '';
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

/**
 * Truncates text to a preview length with ellipsis.
 */
export function truncateText(text: string, maxLength: number = 280): string {
    if (!text || text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
}

/**
 * Editorial feed layout pattern.
 * Applied cyclically to create visual rhythm.
 */
export const FEED_PATTERN = [
    'featured',
    'standard',
    'standard',
    'collage',
    'standard',
    'photo',
    'standard',
] as const;

export type FeedLayoutVariant = typeof FEED_PATTERN[number];

/**
 * Gets the layout variant for a given index in the feed.
 * Falls back to 'standard' if the preferred variant isn't suitable.
 */
export function getFeedVariant(index: number, imageCount: number = 0): FeedLayoutVariant {
    const preferred = FEED_PATTERN[index % FEED_PATTERN.length];
    
    // Collage requires multiple images - fall back to standard
    if (preferred === 'collage' && imageCount <= 1) {
        return 'standard';
    }
    
    return preferred;
}

/**
 * Maps BlockType from backend to frontend FeedLayoutVariant.
 */
export function blockTypeToVariant(blockType: BlockType): FeedLayoutVariant {
    switch (blockType) {
        case 'FEATURED':
            return 'featured';
        case 'COLLAGE':
            return 'collage';
        case 'PHOTO':
            return 'photo';
        case 'HERO':
            return 'featured'; // HERO renders like featured
        case 'PLACEHOLDER':
            return 'standard';
        case 'STANDARD':
        default:
            return 'standard';
    }
}

/**
 * Resolves layout for a feed using blocks with fallback to pattern.
 * 
 * @param posts - List of posts from API
 * @param blocks - Optional blocks from FeedLayoutEngine
 * @returns Layout items with variant and post reference
 */
export interface LayoutItem {
    postId: string;
    variant: FeedLayoutVariant;
    blockType?: BlockType;
    renderHints?: FeedBlock['renderHints'];
    index: number;
}

export function resolveFeedLayout(
    posts: PostFeedItem[], 
    blocks?: FeedBlock[]
): LayoutItem[] {
    // If blocks provided, use them
    if (blocks && blocks.length > 0) {
        // Create post lookup by postId
        const postMap = new Map(posts.map(p => [p.postId, p]));
        
        const items: LayoutItem[] = [];
        
        blocks
            .filter(block => block.blockType !== 'PLACEHOLDER')
            .forEach((block, idx) => {
                const postId = block.postIds[0]; // Usually single post per block
                const post = postMap.get(postId);
                
                // Skip if post not found in map
                if (!post) return;
                
                const imageCount = post.mediaCount ?? post.media?.length ?? 0;
                
                items.push({
                    postId,
                    variant: blockTypeToVariant(block.blockType),
                    blockType: block.blockType,
                    renderHints: block.renderHints,
                    index: idx,
                });
            });
        
        return items;
    }
    
    // Fallback: use pattern-based layout
    return posts.map((post, idx) => {
        const imageCount = post.mediaCount ?? post.media?.length ?? 0;
        return {
            postId: post.postId,
            variant: getFeedVariant(idx, imageCount),
            index: idx,
        };
    });
}

/**
 * Determines if a post can use a specific variant based on its content.
 */
export function canUseVariant(post: { images?: { url: string }[]; imageUrl?: string | null }, variant: FeedLayoutVariant): boolean {
    const imageCount = post.images?.length || (post.imageUrl ? 1 : 0);
    
    switch (variant) {
        case 'collage':
            return imageCount > 1; // Requires multiple images
        case 'photo':
        case 'featured':
        case 'standard':
        default:
            return true; // All posts can use these variants
    }
}

/**
 * Gets the appropriate aspect ratio class based on variant and image count.
 */
export function getAspectClass(variant: FeedLayoutVariant, imageCount: number): string {
    switch (variant) {
        case 'featured':
            return 'aspect-[16/9] max-h-[460px]';
        case 'photo':
            return 'aspect-[4/5]';
        case 'collage':
            if (imageCount === 1) return 'aspect-[4/5] max-h-[420px]';
            if (imageCount === 2) return 'aspect-square max-h-[300px]';
            return 'aspect-[4/5] max-h-[420px]';
        case 'standard':
        default:
            return 'aspect-[4/5] max-h-[420px]';
    }
}

/**
 * Gets aspect ratio class from render hints (backend-driven) or fallback.
 */
export function getAspectClassFromHints(
    variant: FeedLayoutVariant, 
    imageCount: number,
    renderHints?: FeedBlock['renderHints']
): string {
    if (renderHints?.aspectRatio) {
        // Convert "16/9" format to Tailwind class
        const ratio = renderHints.aspectRatio.replace('/', '/');
        const maxHeight = renderHints.maxImageHeight ? `max-h-[${renderHints.maxImageHeight}px]` : '';
        return `aspect-[${ratio}] ${maxHeight}`.trim();
    }
    return getAspectClass(variant, imageCount);
}
