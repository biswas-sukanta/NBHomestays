'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Share2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CommunityPost, QuotePost } from './types';
import type { MediaVariant } from '@/lib/adapters/normalizePost';
import { RepostModal } from './RepostModal';
import { extractTitleAndExcerpt, formatRelative, truncateText, FeedLayoutVariant, getAspectClass } from '@/lib/utils/feed-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const COLORS = {
    card: '#FDFBF7',           // Warm premium cream
    primary: '#1A1A1A',        // Deep charcoal
    muted: '#6B7280',          // Sophisticated grey
    accent: '#2D5A4A',         // Deep forest green (brand)
    gold: '#D4A574',           // Gold/copper accent
    goldHover: '#C49660',      // Gold hover state
};

// ── Category Tag Configuration (Backend-Driven) ───────────────────────────────
const CATEGORY_CONFIG: Record<string, { icon: string; color: string }> = {
    'Question': { icon: '❓', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'Trip Report': { icon: '📝', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Review': { icon: '⭐', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    'Alert': { icon: '⚠️', color: 'bg-red-50 text-red-700 border-red-200' },
    'Hidden Gem': { icon: '✨', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'Offbeat': { icon: '🏔️', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'Transport': { icon: '🚗', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

// ── Props ─────────────────────────────────────────────────────────────────────
interface PostCardProps {
    post: CommunityPost;
    variant?: FeedLayoutVariant;
    onUpdate?: (p: CommunityPost) => void;
    onDelete?: (id: string) => void;
    onEdit?: (p: CommunityPost) => void;
    currentUser?: any;
    onRepost?: (quote: QuotePost) => void;
    isQuoted?: boolean;
    onOpenComments?: (postId: string) => void;
    onNewPost?: (p: CommunityPost) => void;
}

// ── Editorial Image Grid (Structured Layout) ────────────────────────────────────────
function EditorialImageGrid({ 
    images, 
    onImageClick 
}: { 
    images: MediaVariant[]; 
    onImageClick: (idx: number) => void;
}) {
    const imageCount = images.length;
    
    if (imageCount === 0) return null;
    
    // 1 image: Large horizontal
    if (imageCount === 1) {
        return (
            <div 
                className="relative w-full aspect-[16/10] cursor-pointer group overflow-hidden rounded-lg"
                onClick={() => onImageClick(0)}
            >
                <OptimizedImage
                    src={images[0]?.url || ''}
                    alt="Post image"
                    width={900}
                    small={images[0]?.small}
                    medium={images[0]?.medium}
                    large={images[0]?.large}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
            </div>
        );
    }
    
    // 2 images: Side by side
    if (imageCount === 2) {
        return (
            <div className="grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden">
                {images.slice(0, 2).map((img, idx) => (
                    <div
                        key={idx}
                        className="relative aspect-[4/3] cursor-pointer group overflow-hidden"
                        onClick={() => onImageClick(idx)}
                    >
                        <OptimizedImage
                            src={img.url}
                            alt={`Image ${idx + 1}`}
                            width={450}
                            small={img.small}
                            medium={img.medium}
                            large={img.large}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                    </div>
                ))}
            </div>
        );
    }
    
    // 3 images: 1 large + 2 small stacked
    if (imageCount === 3) {
        return (
            <div className="grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden h-[280px]">
                <div
                    className="col-span-1 row-span-2 cursor-pointer group overflow-hidden"
                    onClick={() => onImageClick(0)}
                >
                    <OptimizedImage
                        src={images[0]?.url || ''}
                        alt="Image 1"
                        width={600}
                        small={images[0]?.small}
                        medium={images[0]?.medium}
                        large={images[0]?.large}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                </div>
                {images.slice(1, 3).map((img, idx) => (
                    <div
                        key={idx + 1}
                        className="cursor-pointer group overflow-hidden"
                        onClick={() => onImageClick(idx + 1)}
                    >
                        <OptimizedImage
                            src={img.url}
                            alt={`Image ${idx + 2}`}
                            width={300}
                            small={img.small}
                            medium={img.medium}
                            large={img.large}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                    </div>
                ))}
            </div>
        );
    }
    
    // 4+ images: 2x2 grid with +X more overlay
    return (
        <div className="grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden">
            {images.slice(0, 4).map((img, idx) => (
                <div
                    key={idx}
                    className="relative aspect-square cursor-pointer group overflow-hidden"
                    onClick={() => onImageClick(idx)}
                >
                    <OptimizedImage
                        src={img.url}
                        alt={`Image ${idx + 1}`}
                        width={400}
                        small={img.small}
                        medium={img.medium}
                        large={img.large}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                    {/* +X More Images overlay on last image */}
                    {idx === 3 && imageCount > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <span className="text-white font-semibold text-lg flex items-center gap-1">
                                <Plus className="w-5 h-5" />
                                {imageCount - 4} More
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

// ── Text-Only Premium Quote Card ────────────────────────────────────────────
function TextOnlyCard({ 
    title, 
    body, 
    authorName,
    authorAvatar,
    initials,
    timestamp,
    tags
}: { 
    title: string; 
    body: string;
    authorName: string;
    authorAvatar?: string;
    initials: string;
    timestamp: string;
    tags?: string[];
}) {
    return (
        <div className="relative bg-gradient-to-br from-[#FDFBF7] to-[#F5F3EE] p-8 min-h-[320px] flex flex-col justify-center">
            {/* User info combined at top */}
            <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-9 h-9 ring-2 ring-white/80 shadow-sm">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1A1A1A]">{authorName}</span>
                    <span className="text-xs text-[#6B7280]">· {timestamp}</span>
                </div>
            </div>
            
            {/* Title as classic serif quote - center-aligned */}
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1A1A] text-center leading-snug mb-4 italic">
                "{title}"
            </h3>
            
            {/* Body text - full text with editorial feel */}
            <p className="text-sm text-[#6B7280] text-center leading-relaxed max-w-md mx-auto whitespace-pre-wrap">
                {body}
            </p>
            
            {/* Category Tags for text-only */}
            {tags && tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {tags.slice(0, 3).map(tag => {
                        const config = CATEGORY_CONFIG[tag] || { icon: '🏷', color: 'bg-neutral-50 text-neutral-700 border-neutral-200' };
                        return (
                            <span
                                key={tag}
                                className={cn(
                                    "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border",
                                    config.color
                                )}
                            >
                                <span>{config.icon}</span>
                                {tag}
                            </span>
                        );
                    })}
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
        'relative overflow-hidden transition-all duration-300 isolate bg-[#FDFBF7]',
        isQuoted ? "mt-3 rounded-[20px] ring-1 ring-neutral-200" : "rounded-[20px] border-none shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)]",
        !isQuoted && 'hover:-translate-y-1'
    );

    return (
        <>
            <motion.article
                data-testid={isQuoted ? "quoted-post-card" : `post-card-${effectiveVariant}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className={articleClassName}
            >
                {/* STEP 4: Curation Signals - Backend-Driven Pills */}
                {!isOverlay && (
                    <div className="flex items-center gap-2 px-6 pt-5">
                        {/* FEATURED Pill - Only when backend-driven */}
                        {(post as any).isFeatured && (
                            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-[#D4A574] to-[#C49660] text-white rounded-full shadow-sm">
                                Featured
                            </span>
                        )}
                        {/* EDITORIAL Pill - Only when backend-driven */}
                        {(post as any).isEditorial && (
                            <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#2D5A4A] text-[#FDFBF7] rounded-full">
                                Editorial
                            </span>
                        )}
                    </div>
                )}

                {/* STEP 3: Multi-Image Editorial Grid OR Text-Only Premium */}
                {!isOverlay && (
                    <>
                        {imageCount > 0 ? (
                            <div className="px-6 pt-3 pb-4">
                                <EditorialImageGrid
                                    images={images}
                                    onImageClick={(idx) => setLightboxIndex(idx)}
                                />
                            </div>
                        ) : (
                            /* STEP 3: Super-Premium Text-Only Card */
                            <TextOnlyCard
                                title={title || post.caption?.slice(0, 50) || 'Untitled'}
                                body={post.caption || ''}
                                authorName={authorName}
                                authorAvatar={authorAvatar}
                                initials={initials}
                                timestamp={formatRelative(post.createdAt)}
                                tags={post.tags}
                            />
                        )}
                    </>
                )}

                {/* Category Tags - Below title/quote */}
                {!isOverlay && imageCount > 0 && (post.tags ?? []).length > 0 && (
                    <div className="flex flex-wrap gap-2 px-6 pb-3">
                        {(post.tags ?? []).slice(0, 3).map(tag => {
                            const config = CATEGORY_CONFIG[tag] || { icon: '🏷', color: 'bg-neutral-50 text-neutral-700 border-neutral-200' };
                            return (
                                <span
                                    key={tag}
                                    className={cn(
                                        "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border",
                                        config.color
                                    )}
                                >
                                    <span>{config.icon}</span>
                                    {tag}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* User Metadata Byline */}
                {!isOverlay && imageCount > 0 && (
                    <div className="px-6 pt-2 pb-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-9 h-9 ring-2 ring-white shadow-sm">
                                <AvatarImage src={authorAvatar} alt={authorName} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-[#1A1A1A]">{authorName}</span>
                                {post.isVerifiedHost && (
                                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full">
                                        Host
                                    </span>
                                )}
                                <span className="text-xs text-[#6B7280]">· {formatRelative(post.createdAt)}</span>
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
                    </div>
                )}

                {/* Editorial Content Teaser with Fading Read More */}
                {!isOverlay && imageCount > 0 && post.caption && (
                    <div className="px-6 pb-4">
                        <h3 className="font-serif text-xl font-bold text-[#1A1A1A] leading-tight mb-2">
                            {title}
                        </h3>
                        <div className="relative">
                            <p className={cn(
                                "text-sm text-[#6B7280] leading-relaxed",
                                !expanded && "line-clamp-3"
                            )}>
                                {post.caption}
                            </p>
                            {/* Dynamic fading 'read more' effect */}
                            {hasLongContent && !expanded && (
                                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#FDFBF7] to-transparent pointer-events-none" />
                            )}
                        </div>
                        {hasLongContent && (
                            <button 
                                onClick={() => setExpanded(!expanded)}
                                className="mt-2 text-sm font-medium text-[#D4A574] hover:text-[#C49660] transition-colors"
                            >
                                {expanded ? 'Show less' : 'Read more'}
                            </button>
                        )}
                    </div>
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
                                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                            <div className="absolute top-4 left-4">
                                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
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
                                <h3 className="text-xl sm:text-2xl font-bold font-serif leading-tight tracking-tight line-clamp-2">
                                    {title}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quoted Repost */}
                {post.originalPost && !isOverlay && (
                    <div className="px-4 pb-4 bg-[#FDFBF7]">
                        <div className="rounded-lg border border-neutral-200 bg-neutral-50 overflow-hidden">
                            <PostCardUnified post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                        </div>
                    </div>
                )}

                {/* STEP 5: Social Interaction Bar - Grouped Layout */}
                {!isQuoted && (
                    <div className={cn(
                        "border-t border-gray-100 px-6 py-4",
                        isOverlay && "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent border-t-0"
                    )}>
                        <div className="flex items-center justify-between">
                            {/* Left Group: Like, Comment, Repost */}
                            <div className="flex items-center gap-5">
                                {/* Like Button - Active state uses forest green */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onUpdate?.({ ...post, likes: (post.likes || 0) + (post.isLikedByCurrentUser ? -1 : 1), isLikedByCurrentUser: !post.isLikedByCurrentUser }); }}
                                    className={cn(
                                        "flex items-center gap-1.5 transition-all duration-200 group",
                                        post.isLikedByCurrentUser 
                                            ? "text-[#2D5A4A]" 
                                            : isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-[#D4A574]"
                                    )}
                                >
                                    <motion.div
                                        whileTap={{ scale: 1.3 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <Heart 
                                            className={cn("w-[18px] h-[18px] transition-all duration-200", post.isLikedByCurrentUser && "fill-current scale-110")} 
                                            strokeWidth={1.5} 
                                        />
                                    </motion.div>
                                    <span className="text-xs font-medium">Like {post.likes || 0}</span>
                                </button>

                                {/* Comment Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onOpenComments?.(post.id); }}
                                    className={cn(
                                        "flex items-center gap-1.5 transition-all duration-200 group",
                                        isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-[#D4A574]"
                                    )}
                                >
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                    >
                                        <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                    </motion.div>
                                    <span className="text-xs font-medium">Comment {post.comments || 0}</span>
                                </button>

                                {/* Repost Button - Platform intent */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRepost(); }}
                                    className={cn(
                                        "flex items-center gap-1.5 transition-all duration-200 group",
                                        isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-[#D4A574]"
                                    )}
                                >
                                    <motion.div
                                        whileHover={{ rotate: 180 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Repeat2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                    </motion.div>
                                    <span className="text-xs font-medium">Repost {post.shareCount || 0}</span>
                                </button>
                            </div>

                            {/* Right: External Share */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const shareData = {
                                        title: title || 'Check out this post',
                                        url: window.location.href
                                    };
                                    if (navigator.share) {
                                        navigator.share(shareData);
                                    } else {
                                        navigator.clipboard.writeText(window.location.href);
                                    }
                                }}
                                className={cn(
                                    "flex items-center gap-1.5 transition-all duration-200 group",
                                    isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-[#D4A574]"
                                )}
                            >
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Share2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                </motion.div>
                                <span className="text-xs font-medium">Share (External)</span>
                            </button>
                        </div>
                    </div>
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
