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

const TAG_ICONS: Record<string, React.ReactNode> = {
    'Hidden Gem': <CheckCircle2 className="w-3 h-3" />,
    'Top Pick': <TrendingUp className="w-3 h-3" />,
    'Mountain Bliss': <MapPin className="w-3 h-3" />,
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

// ── Image Collage Renderer ────────────────────────────────────────────────────
function ImageCollage({ 
    images, 
    imageCount, 
    aspectClass, 
    onImageClick 
}: { 
    images: MediaVariant[]; 
    imageCount: number; 
    aspectClass: string;
    onImageClick: (idx: number) => void;
}) {
    if (imageCount === 0) return null;

    return (
        <div className={cn("relative w-full overflow-hidden bg-neutral-100 rounded-lg", aspectClass)}>
            {imageCount === 1 && (
                <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-lg group" onClick={() => onImageClick(0)}>
                    <OptimizedImage 
                        src={images[0]?.url || ''} 
                        alt="Post image" 
                        width={900} 
                        small={images[0]?.small}
                        medium={images[0]?.medium}
                        large={images[0]?.large}
                        className="w-full h-full transition-transform duration-300 group-hover:scale-105" 
                    />
                </div>
            )}
            {imageCount === 2 && (
                <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                    {images.slice(0, 2).map((img, idx) => (
                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden group" onClick={() => onImageClick(idx)}>
                            <OptimizedImage 
                                src={img.url} 
                                alt={`Post image ${idx + 1}`} 
                                width={450}
                                small={img.small}
                                medium={img.medium}
                                large={img.large}
                                className="w-full h-full transition-transform duration-300 group-hover:scale-105" 
                            />
                        </div>
                    ))}
                </div>
            )}
            {imageCount === 3 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
                    <div className="col-span-2 row-span-1 cursor-pointer overflow-hidden group" onClick={() => onImageClick(0)}>
                        <OptimizedImage 
                            src={images[0]?.url} 
                            alt="Post image 1" 
                            width={900}
                            small={images[0]?.small}
                            medium={images[0]?.medium}
                            large={images[0]?.large}
                            className="w-full h-full transition-transform duration-300 group-hover:scale-105" 
                        />
                    </div>
                    <div className="cursor-pointer overflow-hidden group" onClick={() => onImageClick(1)}>
                        <OptimizedImage 
                            src={images[1]?.url} 
                            alt="Post image 2" 
                            width={450}
                            small={images[1]?.small}
                            medium={images[1]?.medium}
                            large={images[1]?.large}
                            className="w-full h-full transition-transform duration-300 group-hover:scale-105" 
                        />
                    </div>
                    <div className="cursor-pointer overflow-hidden group" onClick={() => onImageClick(2)}>
                        <OptimizedImage 
                            src={images[2]?.url} 
                            alt="Post image 3" 
                            width={450}
                            small={images[2]?.small}
                            medium={images[2]?.medium}
                            large={images[2]?.large}
                            className="w-full h-full transition-transform duration-300 group-hover:scale-105" 
                        />
                    </div>
                </div>
            )}
            {imageCount >= 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-0.5 w-full h-full">
                    {images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden group" onClick={() => onImageClick(idx)}>
                            <OptimizedImage 
                                src={img.url} 
                                alt={`Post image ${idx + 1}`} 
                                width={450}
                                small={img.small}
                                medium={img.medium}
                                large={img.large}
                                className="w-full h-full transition-transform duration-300 group-hover:scale-105" 
                            />
                            {idx === 3 && imageCount > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">+{imageCount - 4}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
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
        'relative bg-white overflow-hidden transition-all duration-200 isolate',
        isQuoted ? "mt-3 rounded-xl ring-1 ring-neutral-200" : "rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)]",
        !isQuoted && 'hover:-translate-y-[2px]'
    );

    return (
        <>
            <motion.article
                data-testid={isQuoted ? "quoted-post-card" : `post-card-${effectiveVariant}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                {...(!isQuoted ? { whileHover: { y: -2 } } : {})}
                className={articleClassName}
            >
                {/* Image Block with Overlay for Featured variant */}
                {imageCount > 0 && (
                    <div className="relative z-10 w-full overflow-hidden">
                        {isOverlay ? (
                            <div className={cn("relative w-full cursor-pointer group overflow-hidden", aspectClass)} onClick={() => setLightboxIndex(0)}>
                                <OptimizedImage 
                                    src={images[0]?.url || ''} 
                                    alt={post.location || 'Post image'} 
                                    width={900}
                                    small={images[0]?.small}
                                    medium={images[0]?.medium}
                                    large={images[0]?.large}
                                    className="w-full h-full transition-transform duration-500 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                                
                                {/* Small Feature Badge - top corner */}
                                <div className="absolute top-4 left-4">
                                    <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wider text-neutral-900">
                                        Featured
                                    </span>
                                </div>
                                
                                {/* Overlay Content - bottom */}
                                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                                    {post.location && (
                                        <div className="flex items-center gap-1.5 text-white/80 text-xs mb-2">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{post.location}</span>
                                        </div>
                                    )}
                                    <h3 className="text-xl sm:text-2xl font-bold font-heading leading-tight tracking-tight line-clamp-2">
                                        {title}
                                    </h3>
                                </div>
                            </div>
                        ) : (
                            <div className="p-3">
                                <ImageCollage 
                                    images={images} 
                                    imageCount={isCollage ? imageCount : 1} 
                                    aspectClass={aspectClass}
                                    onImageClick={(idx) => setLightboxIndex(idx)}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Content Block - Standard hierarchy: TAGS → TITLE → EXCERPT → AUTHOR META */}
                {!isOverlay && (
                    <div className="relative z-20 p-4 bg-white">
                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {(post.tags ?? []).slice(0, 3).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-600 text-[10px] font-semibold uppercase tracking-wide rounded-full px-2.5 py-0.5">
                                    {TAG_ICONS[tag]}{tag}
                                </span>
                            ))}
                        </div>

                        {/* Title */}
                        <h3 className="text-lg sm:text-xl font-bold font-heading text-neutral-900 leading-snug tracking-tight mb-1.5 line-clamp-2">
                            {title || post.caption?.slice(0, 80)}
                        </h3>

                        {/* Excerpt */}
                        {(excerpt || post.caption) && (
                            <div className="text-sm text-neutral-500 leading-relaxed mb-3">
                                <span className={expanded ? '' : 'line-clamp-2'}>
                                    {excerpt || post.caption}
                                </span>
                                {hasLongContent && (
                                    <button onClick={() => setExpanded(!expanded)} className="ml-1 text-xs font-semibold text-neutral-700 hover:text-neutral-900 transition-colors">
                                        {expanded ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Author Meta Row */}
                        <div className="flex items-center gap-2.5 pt-2.5 border-t border-neutral-100">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                                {authorAvatar ? (
                                    <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                                ) : initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-neutral-900 truncate">{authorName}</p>
                                <p className="text-[11px] text-neutral-400">{formatRelative(post.createdAt)}</p>
                            </div>
                            {post.location && (
                                <div className="flex items-center gap-1 text-neutral-400 text-[11px]">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate max-w-[80px] sm:max-w-[120px]">{post.location}</span>
                                </div>
                            )}
                            {canModify && onDelete && (
                                <div className="flex items-center gap-1.5 ml-auto">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                                        className="text-[11px] font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                                        className="text-[11px] font-medium text-red-400 hover:text-red-500 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
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
                        className={isOverlay ? "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent py-4 px-6" : undefined}
                    />
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
