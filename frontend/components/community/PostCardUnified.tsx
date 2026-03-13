'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { TrendingUp } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { PostInteractionBar } from './PostInteractionBar';
import { CommunityPost, QuotePost } from './types';
import type { MediaVariant } from '@/lib/adapters/normalizePost';
import { RepostModal } from './RepostModal';
import { extractTitleAndExcerpt, formatRelative, truncateText, FeedLayoutVariant, getAspectClass } from '@/lib/utils/feed-utils';

const TAG_ICONS: Record<string, string> = {
    'Hidden Gem': '🏔',
    'Top Pick': '⭐',
    'Mountain Bliss': '🏔',
    'Question': '❓',
    'Review': '⭐',
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface PostCardProps {
    post: CommunityPost;
    /** Layout variant for card presentation */
    variant?: FeedLayoutVariant;
    /** Existing update callback for when data actually changes (passed to composer) */
    onUpdate?: (p: CommunityPost) => void;
    onDelete?: (id: string) => void;
    /** Trigger for opening the edit modal from the parent */
    onEdit?: (p: CommunityPost) => void;
    /** Passed from feed page for owner comparison */
    currentUser?: any;
    /** Callback to open composer in "Repost" mode */
    onRepost?: (quote: QuotePost) => void;
    /** Is this post being rendered as a quoted repost inside another post? */
    isQuoted?: boolean;
    /** Callback to open the global comment drawer */
    onOpenComments?: (postId: string) => void;
    /** Callback to instantly sync global state when a repost is created */
    onNewPost?: (p: CommunityPost) => void;
}

// ── Image Grid Renderer ────────────────────────────────────────────────────
function ImageGrid({ 
    images, 
    imageCount, 
    onImageClick 
}: { 
    images: MediaVariant[]; 
    imageCount: number; 
    onImageClick: (idx: number) => void;
}) {
    if (imageCount === 0) return null;

    // 1 image → single image with 4:3 aspect ratio
    if (imageCount === 1) {
        return (
            <div className="relative w-full rounded-[16px] overflow-hidden cursor-pointer group aspect-[4/3]" onClick={() => onImageClick(0)}>
                <OptimizedImage 
                    src={images[0]?.url || ''} 
                    alt="Post image" 
                    width={900} 
                    small={images[0]?.small}
                    medium={images[0]?.medium}
                    large={images[0]?.large}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
            </div>
        );
    }

    // 2 images → 2 column grid, gap-1.5 (6px)
    if (imageCount === 2) {
        return (
            <div className="grid grid-cols-2 gap-1.5 rounded-[16px] overflow-hidden">
                {images.slice(0, 2).map((img, idx) => (
                    <div key={idx} className="relative aspect-square cursor-pointer overflow-hidden group" onClick={() => onImageClick(idx)}>
                        <OptimizedImage 
                            src={img.url} 
                            alt={`Post image ${idx + 1}`} 
                            width={450}
                            small={img.small}
                            medium={img.medium}
                            large={img.large}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                        />
                    </div>
                ))}
            </div>
        );
    }

    // 3 images → 1 large + 2 stacked, gap-1.5 (6px)
    if (imageCount === 3) {
        return (
            <div className="grid grid-cols-2 grid-rows-2 gap-1.5 rounded-[16px] overflow-hidden h-[300px]">
                <div className="col-span-1 row-span-2 cursor-pointer overflow-hidden group" onClick={() => onImageClick(0)}>
                    <OptimizedImage 
                        src={images[0]?.url} 
                        alt="Post image 1" 
                        width={600}
                        small={images[0]?.small}
                        medium={images[0]?.medium}
                        large={images[0]?.large}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
                <div className="cursor-pointer overflow-hidden group" onClick={() => onImageClick(1)}>
                    <OptimizedImage 
                        src={images[1]?.url} 
                        alt="Post image 2" 
                        width={300}
                        small={images[1]?.small}
                        medium={images[1]?.medium}
                        large={images[1]?.large}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
                <div className="cursor-pointer overflow-hidden group" onClick={() => onImageClick(2)}>
                    <OptimizedImage 
                        src={images[2]?.url} 
                        alt="Post image 3" 
                        width={300}
                        small={images[2]?.small}
                        medium={images[2]?.medium}
                        large={images[2]?.large}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
            </div>
        );
    }

    // 4+ images → 2x2 grid with overlay count for 5+, gap-1.5 (6px)
    return (
        <div className="grid grid-cols-2 gap-1.5 rounded-[16px] overflow-hidden">
            {images.slice(0, 4).map((img, idx) => (
                <div key={idx} className="relative aspect-square cursor-pointer overflow-hidden group" onClick={() => onImageClick(idx)}>
                    <OptimizedImage 
                        src={img.url} 
                        alt={`Post image ${idx + 1}`} 
                        width={450}
                        small={img.small}
                        medium={img.medium}
                        large={img.large}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    />
                    {idx === 3 && imageCount > 4 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-bold text-xl">+{imageCount - 4}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── PostCardUnified ──────────────────────────────────────────────────────────────────
export function PostCardUnified({ 
    post, 
    variant = 'standard', 
    onUpdate, 
    onDelete, 
    onEdit, 
    currentUser, 
    onRepost, 
    isQuoted = false, 
    onOpenComments, 
    onNewPost 
}: PostCardProps) {
    const authorName = post.authorName || 'Explorer';
    const authorAvatar = post.authorAvatar;
    const initials = authorName?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'NB';

    const isOwner = String(currentUser?.id) === String(post.authorId);
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ROLE_ADMIN';
    const canModify = isOwner || isAdmin;

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [internalRepostQuote, setInternalRepostQuote] = useState<QuotePost | null>(null);

    const images = post.images || (post.imageUrl ? [{ url: post.imageUrl }] : []);
    const imageCount = images.length;
    
    // Fallback: featured/hero without media should use standard variant
    const effectiveVariant = (variant === 'featured' && imageCount === 0) ? 'standard' : variant;
    const aspectClass = getAspectClass(effectiveVariant, imageCount);

    const { title, excerpt } = useMemo(() => extractTitleAndExcerpt(post.caption || ''), [post.caption]);
    const previewText = truncateText(post.caption || '', 280);
    const [expanded, setExpanded] = useState(false);
    const hasLongContent = (post.caption?.length || 0) > 280;

    const handleRepost = () => {
        const quote: QuotePost = { id: post.id, authorName, textContent: post.caption || '' };
        if (onRepost) {
            onRepost(quote);
        } else {
            setInternalRepostQuote(quote);
        }
    };

    const handleInternalRepostSuccess = (newPost?: CommunityPost) => {
        setInternalRepostQuote(null);
        if (newPost && onNewPost) {
            onNewPost(newPost);
        }
    };

    // Variant-specific rendering
    const isFeatured = effectiveVariant === 'featured';
    const isCollage = effectiveVariant === 'collage';
    const isOverlay = isFeatured; // Only featured uses overlay

    const articleClassName = cn(
        'relative bg-white overflow-hidden transition-all duration-300 isolate',
        isQuoted ? "mt-3 rounded-[22px] ring-1 ring-neutral-200" : "rounded-[22px] border border-[#e8e8e8] shadow-[0_1px_2px_rgba(0,0,0,0.02)]",
        !isQuoted && 'hover:-translate-y-0.5'
    );

    return (
        <>
            <motion.article
                data-testid={isQuoted ? "quoted-post-card" : `post-card-${effectiveVariant}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className={articleClassName}
            >
                {/* Content Block - Text-first balanced layout */}
                {!isOverlay && (
                    <div className="relative z-20 p-[26px] bg-white">
                        {/* Author Header Row - Avatar + Name + Role Badge */}
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0 ring-2 ring-white shadow-sm">
                                {authorAvatar ? (
                                    <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                                ) : initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-[15px] font-semibold text-neutral-900 truncate">{authorName}</p>
                                    {post.isVerifiedHost && (
                                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full">Host</span>
                                    )}
                                </div>
                            </div>
                            {canModify && onDelete && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                                        className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                                        className="text-xs font-medium text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* Location + Time Row */}
                        <div className="flex items-center gap-2 text-xs text-neutral-400 mb-4">
                            {post.location && (
                                <span className="flex items-center gap-1 truncate max-w-[180px]">
                                    <span>📍</span>
                                    <span className="font-medium text-neutral-600">{post.location}</span>
                                </span>
                            )}
                            {post.location && <span className="text-neutral-300">·</span>}
                            <span>{formatRelative(post.createdAt)}</span>
                        </div>

                        {/* Post Text - Balanced with images, 4-line clamp */}
                        {post.caption && (
                            <div className="text-[15px] text-neutral-800 leading-relaxed">
                                <span className={expanded ? '' : 'line-clamp-4'}>
                                    {post.caption}
                                </span>
                                {hasLongContent && (
                                    <button onClick={() => setExpanded(!expanded)} className="ml-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                                        {expanded ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Image Grid - Gallery container with subtle background */}
                {imageCount > 0 && !isOverlay && (
                    <>
                        {/* Section Divider */}
                        <div className="h-px bg-[rgba(0,0,0,0.04)] mx-[26px]" />
                        <div className="p-[6px] mx-[26px] my-4 bg-neutral-50/50 rounded-[18px]">
                            <ImageGrid
                                images={images}
                                imageCount={imageCount}
                                onImageClick={(idx) => setLightboxIndex(idx)}
                            />
                        </div>
                        {/* Tags Row - Below images */}
                        {(post.tags ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-2 px-[26px] pb-4">
                                {(post.tags ?? []).slice(0, 3).map(tag => (
                                    <span key={tag} className="inline-flex items-center gap-1.5 bg-neutral-100/80 text-neutral-700 text-[11px] font-medium rounded-full px-3 py-1">
                                        <span>{TAG_ICONS[tag] || '🏷'}</span>
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Featured overlay image */}
                {isOverlay && imageCount > 0 && (
                    <div className="relative z-10 w-full overflow-hidden">
                        <div className={cn("relative w-full cursor-pointer group overflow-hidden", aspectClass)} onClick={() => setLightboxIndex(0)}>
                            <OptimizedImage
                                src={images[0]?.url || ''}
                                alt={post.location || 'Post image'}
                                width={900}
                                small={images[0]?.small}
                                medium={images[0]?.medium}
                                large={images[0]?.large}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                            <div className="absolute top-4 left-4">
                                <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-neutral-900">
                                    Featured
                                </span>
                            </div>
                            <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                {post.location && (
                                    <div className="flex items-center gap-1.5 text-white/80 text-xs mb-2">
                                        <span>📍</span>
                                        <span>{post.location}</span>
                                    </div>
                                )}
                                <h3 className="text-xl sm:text-2xl font-bold font-heading leading-tight tracking-tight line-clamp-2">
                                    {title}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quoted Repost */}
                {post.originalPost && !isOverlay && (
                    <div className="px-4 pb-4 bg-white">
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden">
                            <PostCardUnified post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                        </div>
                    </div>
                )}

                {/* Interaction Bar - Unified for all variants */}
                {!isQuoted && (
                    <>
                        {/* Section Divider */}
                        <div className="h-px bg-[rgba(0,0,0,0.04)] mx-[26px]" />
                        <PostInteractionBar
                            postId={post.id}
                            likes={post.likes || 0}
                            comments={post.comments || 0}
                            shareCount={post.shareCount || 0}
                            isLiked={post.isLikedByCurrentUser || false}
                            onOpenComments={() => onOpenComments?.(post.id)}
                            onRepost={handleRepost}
                            onLikeToggle={(newCount, newLiked) => onUpdate?.({ ...post, likes: newCount, isLikedByCurrentUser: newLiked })}
                            variant={isOverlay ? 'overlay' : 'default'}
                            className={isOverlay ? "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-4 px-6" : "px-[26px] py-4"}
                        />
                    </>
                )}
            </motion.article>

            {lightboxIndex !== null && imageCount > 0 && (
                <ImageLightbox images={images.map(img => img.url)} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}

            <AnimatePresence>
                {internalRepostQuote && (
                    <RepostModal quote={internalRepostQuote} onSuccess={handleInternalRepostSuccess} onCancel={() => setInternalRepostQuote(null)} />
                )}
            </AnimatePresence>
        </>
    );
}

// Export as PostCard for drop-in replacement
export default PostCardUnified;
