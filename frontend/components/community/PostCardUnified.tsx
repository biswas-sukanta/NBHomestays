'use client';

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CommunityPost, QuotePost } from './types';
import type { MediaVariant } from '@/lib/adapters/normalizePost';
import { RepostModal } from './RepostModal';
import { extractTitleAndExcerpt, formatRelative, truncateText, FeedLayoutVariant, getAspectClass } from '@/lib/utils/feed-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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

// ── Editorial Image Carousel ────────────────────────────────────────────────────
function EditorialCarousel({ 
    images, 
    onImageClick 
}: { 
    images: MediaVariant[]; 
    onImageClick: (idx: number) => void;
}) {
    const [activeIndex, setActiveIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const imageCount = images.length;

    const scrollTo = (idx: number) => {
        if (!scrollRef.current) return;
        const newIndex = Math.max(0, Math.min(idx, imageCount - 1));
        scrollRef.current.scrollTo({
            left: newIndex * scrollRef.current.offsetWidth,
            behavior: 'smooth'
        });
        setActiveIndex(newIndex);
    };

    const handleScroll = () => {
        if (!scrollRef.current) return;
        const idx = Math.round(scrollRef.current.scrollLeft / scrollRef.current.offsetWidth);
        setActiveIndex(idx);
    };

    return (
        <div className="relative">
            {/* Horizontal snap carousel */}
            <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {images.map((img, idx) => (
                    <div 
                        key={idx}
                        className="relative w-full flex-shrink-0 snap-start aspect-[4/5] cursor-pointer group"
                        onClick={() => onImageClick(idx)}
                    >
                        <OptimizedImage
                            src={img.url}
                            alt={`Image ${idx + 1}`}
                            width={800}
                            small={img.small}
                            medium={img.medium}
                            large={img.large}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                ))}
            </div>

            {/* Navigation arrows for multi-image */}
            {imageCount > 1 && (
                <>
                    {activeIndex > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); scrollTo(activeIndex - 1); }}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
                        </button>
                    )}
                    {activeIndex < imageCount - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); scrollTo(activeIndex + 1); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors"
                        >
                            <ChevronRight className="w-4 h-4 text-neutral-700" strokeWidth={1.5} />
                        </button>
                    )}

                    {/* Minimalist dot indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.slice(0, 5).map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                    idx === activeIndex ? "bg-white w-4" : "bg-white/50"
                                )}
                            />
                        ))}
                        {imageCount > 5 && (
                            <span className="text-white/70 text-[10px] ml-1">+{imageCount - 5}</span>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

// ── Quote Card Fallback (no images) ────────────────────────────────────────────
function QuoteCard({ text }: { text: string }) {
    return (
        <div className="relative aspect-[4/3] bg-[#2D5A4A] flex items-center justify-center p-8">
            <p className="font-serif text-white/90 text-xl sm:text-2xl text-center italic leading-relaxed line-clamp-6">
                "{text.slice(0, 200)}{text.length > 200 ? '...' : ''}"
            </p>
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
                {/* STEP 3: Image-First Media Hero (Top of Card) */}
                {!isOverlay && (
                    <>
                        {imageCount > 0 ? (
                            <div className="relative w-full">
                                {/* Topic Badge - Glassmorphism */}
                                {post.location && (
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className="inline-flex items-center gap-1.5 bg-white/30 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full">
                                            <span>📍</span>
                                            <span>{post.location}</span>
                                        </span>
                                    </div>
                                )}
                                
                                {/* Carousel for multi-image, single for 1 image */}
                                {imageCount === 1 ? (
                                    <div 
                                        className="relative w-full aspect-[4/5] cursor-pointer group"
                                        onClick={() => setLightboxIndex(0)}
                                    >
                                        <OptimizedImage
                                            src={images[0]?.url || ''}
                                            alt="Post image"
                                            width={800}
                                            small={images[0]?.small}
                                            medium={images[0]?.medium}
                                            large={images[0]?.large}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    </div>
                                ) : (
                                    <EditorialCarousel
                                        images={images}
                                        onImageClick={(idx) => setLightboxIndex(idx)}
                                    />
                                )}
                            </div>
                        ) : (
                            /* Quote Card Fallback - no images */
                            <QuoteCard text={post.caption || ''} />
                        )}
                    </>
                )}

                {/* STEP 4: User Metadata (The Byline) */}
                {!isOverlay && (
                    <div className="px-6 pt-5 pb-3">
                        <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10 ring-2 ring-white shadow-sm">
                                <AvatarImage src={authorAvatar} alt={authorName} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-sm font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-[#1A1A1A]">{authorName}</span>
                                    {post.isVerifiedHost && (
                                        <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full">
                                            Host
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-[#6B7280]">{formatRelative(post.createdAt)}</span>
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

                {/* STEP 5: Editorial Content (The Teaser) */}
                {!isOverlay && imageCount > 0 && post.caption && (
                    <div className="px-6 pb-4">
                        {/* Post Title - Editorial Serif */}
                        <h3 className="font-serif text-xl font-bold text-[#1A1A1A] leading-tight mb-2 line-clamp-2">
                            {title}
                        </h3>
                        {/* Post Body - Modern Sans */}
                        <p className="text-sm text-[#6B7280] leading-relaxed line-clamp-2">
                            {excerpt}
                            {hasLongContent && (
                                <button 
                                    onClick={() => setExpanded(!expanded)} 
                                    className="ml-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                                >
                                    Read more
                                </button>
                            )}
                        </p>
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

                {/* STEP 6: Whisper-Quiet Interactions Bar */}
                {!isQuoted && (
                    <div className={cn(
                        "border-t border-gray-100 px-6 py-4",
                        isOverlay && "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent border-t-0"
                    )}>
                        <div className="flex items-center gap-6">
                            {/* Like Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); }}
                                className={cn(
                                    "flex items-center gap-1.5 transition-all duration-200",
                                    post.isLikedByCurrentUser 
                                        ? "text-emerald-600" 
                                        : isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-red-500"
                                )}
                            >
                                <motion.div
                                    whileTap={{ scale: 1.2 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Heart 
                                        className={cn("w-[18px] h-[18px]", post.isLikedByCurrentUser && "fill-current")} 
                                        strokeWidth={1.5} 
                                    />
                                </motion.div>
                                <span className="text-xs font-medium">{post.likes || 0}</span>
                            </button>

                            {/* Comment Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenComments?.(post.id); }}
                                className={cn(
                                    "flex items-center gap-1.5 transition-all duration-200",
                                    isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-emerald-600"
                                )}
                            >
                                <MessageCircle className="w-[18px] h-[18px]" strokeWidth={1.5} />
                                <span className="text-xs font-medium">{post.comments || 0}</span>
                            </button>

                            {/* Share Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRepost(); }}
                                className={cn(
                                    "flex items-center gap-1.5 transition-all duration-200 ml-auto",
                                    isOverlay ? "text-white/80 hover:text-white" : "text-[#6B7280] hover:text-purple-500"
                                )}
                            >
                                <Share2 className="w-[18px] h-[18px]" strokeWidth={1.5} />
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
