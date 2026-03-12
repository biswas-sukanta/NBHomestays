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
        <div className={cn("relative w-full overflow-hidden bg-neutral-100 rounded-xl", aspectClass)}>
            {imageCount === 1 && (
                <div className="relative w-full h-full cursor-pointer overflow-hidden rounded-xl" onClick={() => onImageClick(0)}>
                    <OptimizedImage 
                        src={images[0]?.url || ''} 
                        alt="Post image" 
                        width={900} 
                        small={images[0]?.small}
                        medium={images[0]?.medium}
                        large={images[0]?.large}
                        className="w-full h-full" 
                    />
                </div>
            )}
            {imageCount === 2 && (
                <div className="grid grid-cols-2 gap-2 w-full h-full">
                    {images.slice(0, 2).map((img, idx) => (
                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden rounded-xl aspect-square" onClick={() => onImageClick(idx)}>
                            <OptimizedImage 
                                src={img.url} 
                                alt={`Post image ${idx + 1}`} 
                                width={450}
                                small={img.small}
                                medium={img.medium}
                                large={img.large}
                                className="w-full h-full" 
                            />
                        </div>
                    ))}
                </div>
            )}
            {imageCount === 3 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
                    <div className="col-span-2 row-span-1 cursor-pointer overflow-hidden rounded-xl" onClick={() => onImageClick(0)}>
                        <OptimizedImage 
                            src={images[0]?.url} 
                            alt="Post image 1" 
                            width={900}
                            small={images[0]?.small}
                            medium={images[0]?.medium}
                            large={images[0]?.large}
                            className="w-full h-full" 
                        />
                    </div>
                    <div className="cursor-pointer overflow-hidden rounded-xl aspect-square" onClick={() => onImageClick(1)}>
                        <OptimizedImage 
                            src={images[1]?.url} 
                            alt="Post image 2" 
                            width={450}
                            small={images[1]?.small}
                            medium={images[1]?.medium}
                            large={images[1]?.large}
                            className="w-full h-full" 
                        />
                    </div>
                    <div className="cursor-pointer overflow-hidden rounded-xl aspect-square" onClick={() => onImageClick(2)}>
                        <OptimizedImage 
                            src={images[2]?.url} 
                            alt="Post image 3" 
                            width={450}
                            small={images[2]?.small}
                            medium={images[2]?.medium}
                            large={images[2]?.large}
                            className="w-full h-full" 
                        />
                    </div>
                </div>
            )}
            {imageCount >= 4 && (
                <div className="grid grid-cols-2 grid-rows-2 gap-2 w-full h-full">
                    {images.slice(0, 4).map((img, idx) => (
                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden rounded-xl aspect-square" onClick={() => onImageClick(idx)}>
                            <OptimizedImage 
                                src={img.url} 
                                alt={`Post image ${idx + 1}`} 
                                width={450}
                                small={img.small}
                                medium={img.medium}
                                large={img.large}
                                className="w-full h-full" 
                            />
                            {idx === 3 && imageCount > 4 && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                                    <span className="text-white font-bold text-xl">+{imageCount - 4}</span>
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
    const aspectClass = getAspectClass(variant, imageCount);

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
    const isFeatured = variant === 'featured';
    const isPhoto = variant === 'photo';
    const isCollage = variant === 'collage';
    const isOverlay = isFeatured || isPhoto;

    const articleClassName = cn(
        'relative bg-white overflow-hidden transition-transform duration-180 isolate',
        isQuoted ? "mt-3 rounded-2xl ring-1 ring-neutral-200" : "rounded-2xl border border-neutral-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
        !isQuoted && 'hover:-translate-y-[2px]'
    );

    return (
        <>
            <motion.article
                data-testid={isQuoted ? "quoted-post-card" : `post-card-${variant}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                {...(!isQuoted ? { whileHover: { y: -2 } } : {})}
                className={articleClassName}
            >
                {/* Image Block with Overlay for Featured/Photo variants */}
                {imageCount > 0 && (
                    <div className="relative z-10 w-full overflow-hidden">
                        {isOverlay ? (
                            <div className="relative w-full aspect-[4/5] cursor-pointer group overflow-hidden" onClick={() => setLightboxIndex(0)}>
                                <OptimizedImage 
                                    src={images[0]?.url || ''} 
                                    alt={post.location || 'Post image'} 
                                    width={900}
                                    small={images[0]?.small}
                                    medium={images[0]?.medium}
                                    large={images[0]?.large}
                                    className="w-full h-full transition-transform duration-700 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                                
                                {/* Overlay Content */}
                                <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-[10px] font-bold uppercase tracking-widest">
                                            {isFeatured ? 'Featured Story' : 'Photo Story'}
                                        </span>
                                        {imageCount > 1 && (
                                            <span className="text-white/70 text-xs font-medium">{imageCount} photos</span>
                                        )}
                                    </div>
                                    <h3 className="text-2xl sm:text-3xl font-bold font-heading leading-tight tracking-tight mb-2 line-clamp-2">
                                        {title}
                                    </h3>
                                    {post.location && (
                                        <div className="flex items-center gap-1.5 text-white/70 text-sm">
                                            <MapPin className="w-4 h-4" />
                                            <span>{post.location}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="p-4">
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

                {/* Content Block - Not shown for overlay variants */}
                {!isOverlay && (
                    <div className="relative z-20 p-4 lg:p-5 bg-white">
                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="inline-flex items-center bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                                {isQuoted ? 'Repost' : isCollage ? 'Collage' : 'Story'}
                            </span>
                            {(post.tags ?? []).slice(0, 2).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                                    {TAG_ICONS[tag]}{tag}
                                </span>
                            ))}
                        </div>

                        {/* Headline */}
                        <h3 className="text-xl sm:text-2xl font-bold font-heading text-neutral-900 leading-tight tracking-tight mb-2 line-clamp-2">
                            {title || post.caption?.slice(0, 100)}
                        </h3>

                        {/* Excerpt with Read more */}
                        <div className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-3">
                            <span className={expanded ? '' : 'line-clamp-3'}>
                                {excerpt || post.caption}
                            </span>
                            {hasLongContent && (
                                <button onClick={() => setExpanded(!expanded)} className="ml-1 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                                    {expanded ? 'Show less' : 'Read more'}
                                </button>
                            )}
                        </div>

                        {/* Meta Row */}
                        <div className="flex items-center gap-3 pt-3 border-t border-neutral-100">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden shrink-0">
                                {authorAvatar ? (
                                    <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" />
                                ) : initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-neutral-900 truncate">{authorName}</p>
                                <p className="text-xs text-neutral-500">{formatRelative(post.createdAt)}</p>
                            </div>
                            {post.location && (
                                <div className="flex items-center gap-1 text-neutral-500 text-xs">
                                    <MapPin className="w-3.5 h-3.5" />
                                    <span className="truncate max-w-[100px] sm:max-w-[150px]">{post.location}</span>
                                </div>
                            )}
                            {canModify && onDelete && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                                        className="text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                                        className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
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
                    <div className="px-4 lg:px-5 pb-4 bg-white">
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
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
