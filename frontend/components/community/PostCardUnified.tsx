'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Heart, MessageCircle, Repeat2, Share2, Plus, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CommunityPost, QuotePost } from './types';
import type { MediaVariant } from '@/lib/adapters/normalizePost';
import { RepostModal } from './RepostModal';
import { extractTitleAndExcerpt, formatRelative, truncateText, FeedLayoutVariant, getAspectClass } from '@/lib/utils/feed-utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// ── Step 1: Design Tokens & Typography ─────────────────────────────────────────
// Serif (Playfair Display) for headlines/quotes - font-heading
// Sans-serif (Inter) for body text - font-sans
const COLORS = {
    card: '#FDFBF7',           // Warm premium cream
    primary: '#1A1A1A',        // Deep charcoal (text-primary)
    muted: '#6B7280',          // Sophisticated grey (text-muted)
    accentBrand: '#2D5A4A',    // Deep forest green (accent-brand) - from logo
    accentSubtle: '#E8E4DD',   // Subtle beige (accent-subtle)
    gold: '#D4A574',           // Gold/copper accent
    goldHover: '#C49660',      // Gold hover state
};

// ── Step 5: Category Tag Configuration ───────────────────────────────────────
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

// ── Step 3: Horizontal Snap Carousel for Multi-Image Posts ────────────────────
function ImageCarousel({ 
    images, 
    onImageClick 
}: { 
    images: MediaVariant[]; 
    onImageClick: (idx: number) => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    
    const imageCount = images.length;
    if (imageCount === 0) return null;
    
    // Single image: Large horizontal with editorial aspect
    if (imageCount === 1) {
        return (
            <div 
                className="relative w-full aspect-[16/10] cursor-pointer group overflow-hidden"
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
    
    // Multiple images: Horizontal snap carousel
    return (
        <div className="relative w-full">
            <div 
                ref={containerRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {images.map((img, idx) => (
                    <div
                        key={idx}
                        className="relative flex-shrink-0 w-[85%] sm:w-[60%] aspect-[4/3] cursor-pointer group overflow-hidden snap-center rounded-lg"
                        onClick={() => onImageClick(idx)}
                    >
                        <OptimizedImage
                            src={img.url}
                            alt={`Image ${idx + 1}`}
                            width={600}
                            small={img.small}
                            medium={img.medium}
                            large={img.large}
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                    </div>
                ))}
            </div>
            
            {/* Carousel indicators */}
            {imageCount > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                    {images.slice(0, 5).map((_, idx) => (
                        <div 
                            key={idx}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                idx === currentIndex ? "bg-[#2D5A4A] w-4" : "bg-neutral-300"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Step 4: Super-Premium Text-Only Card ──────────────────────────────────────
function TextOnlyCard({ 
    title, 
    body, 
    authorName,
    authorAvatar,
    initials,
    timestamp,
    tags,
    isFeatured,
    isEditorial
}: { 
    title: string; 
    body: string;
    authorName: string;
    authorAvatar?: string;
    initials: string;
    timestamp: string;
    tags?: string[];
    isFeatured?: boolean;
    isEditorial?: boolean;
}) {
    const isDuplicate = title === body || !body || body.trim() === '';
    const displayTitle = title;
    const displayBody = isDuplicate ? null : body;
    
    return (
        <div className="relative bg-gradient-to-br from-[#FDFBF7] to-[#F5F3EE] p-6 sm:p-8 min-h-[280px] flex flex-col justify-center">
            {/* Step 5: FEATURED/EDITORIAL Pills at top */}
            {isFeatured && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full shadow-sm">
                        ✨ Featured
                    </span>
                </div>
            )}
            {isEditorial && (
                <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#2D5A4A] text-[#FDFBF7] rounded-full shadow-sm">
                        Editorial
                    </span>
                </div>
            )}
            
            {/* User info at top */}
            <div className="flex items-center gap-3 mb-6">
                <Avatar className="w-9 h-9 ring-2 ring-white/80 shadow-sm">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback className="bg-gradient-to-br from-[#2D5A4A] to-teal-600 text-white text-xs font-bold">
                        {initials}
                    </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#1A1A1A] font-sans">{authorName}</span>
                    <span className="text-xs text-[#6B7280] font-sans">· {timestamp}</span>
                </div>
            </div>
            
            {/* Title as elegant serif quote - center-aligned */}
            <h3 className="font-heading text-2xl sm:text-3xl font-bold text-[#1A1A1A] text-center leading-snug italic">
                "{displayTitle}"
            </h3>
            
            {/* Body text - only if different from title */}
            {displayBody && (
                <p className="text-sm text-[#6B7280] text-center leading-relaxed max-w-md mx-auto whitespace-pre-wrap mt-4 font-sans">
                    {displayBody}
                </p>
            )}
            
            {/* Step 5: Category Pills below title/quote */}
            {tags && tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                    {tags.slice(0, 3).map(tag => {
                        const config = CATEGORY_CONFIG[tag] || { icon: '🏷', color: 'bg-neutral-50 text-neutral-700 border-neutral-200' };
                        return (
                            <span
                                key={tag}
                                className={cn(
                                    "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border font-sans",
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
    
    const effectiveVariant = (variant === 'featured' && imageCount === 0) ? 'standard' : variant;

    const { title, excerpt } = useMemo(() => extractTitleAndExcerpt(post.caption || ''), [post.caption]);
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

    const isFeatured = effectiveVariant === 'featured' || (post as any).isFeatured;
    const isEditorial = (post as any).isEditorial;

    // Step 2: Card Container Physics
    const articleClassName = cn(
        'relative overflow-hidden transition-all duration-300 isolate',
        // Warm cream background
        'bg-[#FDFBF7]',
        // Rounded-[20px] with diffuse sophisticated shadow
        isQuoted 
            ? "mt-3 rounded-[16px] ring-1 ring-neutral-200" 
            : "rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] border-none",
        !isQuoted && 'hover:-translate-y-0.5'
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
                {/* Step 5: FEATURED Pill - Premium gold at top of card */}
                {isFeatured && imageCount > 0 && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-white rounded-full shadow-sm">
                            ✨ Featured
                        </span>
                    </div>
                )}
                
                {/* Step 5: EDITORIAL Pill - Dark green at top of card */}
                {isEditorial && imageCount > 0 && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-[#2D5A4A] text-[#FDFBF7] rounded-full shadow-sm">
                            Editorial
                        </span>
                    </div>
                )}

                {/* Image or Text-Only Card */}
                {imageCount > 0 ? (
                    <div className="relative w-full">
                        <ImageCarousel
                            images={images}
                            onImageClick={(idx) => setLightboxIndex(idx)}
                        />
                    </div>
                ) : (
                    <TextOnlyCard
                        title={title || post.caption?.slice(0, 50) || 'Untitled'}
                        body={post.caption || ''}
                        authorName={authorName}
                        authorAvatar={authorAvatar}
                        initials={initials}
                        timestamp={formatRelative(post.createdAt)}
                        tags={post.tags}
                        isFeatured={isFeatured}
                        isEditorial={isEditorial}
                    />
                )}

                {/* Content Block for Image Posts */}
                {imageCount > 0 && (
                    <div className="px-5 sm:px-6 py-4">
                        {/* User Metadata Byline */}
                        <div className="flex items-center gap-3 mb-3">
                            <Avatar className="w-8 h-8 ring-2 ring-white shadow-sm">
                                <AvatarImage src={authorAvatar} alt={authorName} />
                                <AvatarFallback className="bg-gradient-to-br from-[#2D5A4A] to-teal-600 text-white text-xs font-bold">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-semibold text-[#1A1A1A] truncate font-sans">{authorName}</span>
                                {post.isVerifiedHost && (
                                    <span className="px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 rounded-full font-sans">
                                        Host
                                    </span>
                                )}
                                <span className="text-xs text-[#6B7280] font-sans">· {formatRelative(post.createdAt)}</span>
                            </div>
                            {canModify && onDelete && (
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onEdit?.(post); }}
                                        className="text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors font-sans"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); onDelete(post.id); }}
                                        className="text-xs font-medium text-red-400 hover:text-red-500 transition-colors font-sans"
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Step 1: Editorial Content with Premium Typography */}
                        {post.caption && (
                            <div className="mb-3">
                                {/* Serif headline */}
                                <h3 className="font-heading text-xl font-bold text-[#1A1A1A] leading-tight mb-2">
                                    {title}
                                </h3>
                                
                                {/* Sans-serif body with animated read more */}
                                <div className="relative overflow-hidden">
                                    <motion.div
                                        initial={false}
                                        animate={{ 
                                            height: expanded ? 'auto' : '4.5rem',
                                            transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
                                        }}
                                        className="relative"
                                    >
                                        <p className={cn(
                                            "text-sm text-[#6B7280] leading-relaxed font-sans",
                                            !expanded && "line-clamp-3"
                                        )}>
                                            {post.caption}
                                        </p>
                                    </motion.div>
                                    {/* Fading read more effect */}
                                    {hasLongContent && !expanded && (
                                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent pointer-events-none" />
                                    )}
                                </div>
                                
                                {hasLongContent && (
                                    <button 
                                        onClick={() => setExpanded(!expanded)}
                                        className="mt-1.5 inline-flex items-center gap-1 text-sm font-medium text-[#D4A574] hover:text-[#C49660] transition-colors font-sans"
                                    >
                                        {expanded ? (
                                            <><ChevronUp className="w-4 h-4" strokeWidth={1.5} />Show less</>
                                        ) : (
                                            <><ChevronDown className="w-4 h-4" strokeWidth={1.5} />Read more</>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Step 5: Category Pills below title */}
                        {(post.tags ?? []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {(post.tags ?? []).slice(0, 3).map(tag => {
                                    const config = CATEGORY_CONFIG[tag] || { icon: '🏷', color: 'bg-neutral-50 text-neutral-700 border-neutral-200' };
                                    return (
                                        <span
                                            key={tag}
                                            className={cn(
                                                "inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-3 py-1 border font-sans",
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
                )}

                {/* Quoted Repost */}
                {post.originalPost && (
                    <div className="px-4 pb-4 bg-[#FDFBF7]">
                        <div className="rounded-[16px] border border-neutral-200 bg-neutral-50 overflow-hidden">
                            <PostCardUnified post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                        </div>
                    </div>
                )}

                {/* Step 6: Social Interaction Bar - Proper Grouping */}
                {!isQuoted && (
                    <div className="flex items-center justify-between pt-3 pb-3 px-5 sm:px-6 border-t border-[#E8E4DD]/50">
                        {/* Left Group: Like, Comment, Repost */}
                        <div className="flex items-center gap-5">
                            {/* Like Button - Active uses deep forest green from logo */}
                            <button
                                onClick={(e) => { 
                                    e.stopPropagation(); 
                                    onUpdate?.({ ...post, likes: (post.likes || 0) + (post.isLikedByCurrentUser ? -1 : 1), isLikedByCurrentUser: !post.isLikedByCurrentUser }); 
                                }}
                                className="p-2 -m-2 flex items-center gap-1.5 transition-transform duration-150 active:scale-95"
                            >
                                <motion.div
                                    whileTap={{ scale: 1.3 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    <Heart 
                                        className={cn(
                                            "w-5 h-5 transition-all duration-200",
                                            post.isLikedByCurrentUser 
                                                ? "text-[#2D5A4A] fill-[#2D5A4A]" 
                                                : "text-neutral-400"
                                        )} 
                                        strokeWidth={1.25} 
                                    />
                                </motion.div>
                                <span className="text-xs font-medium text-neutral-700 font-sans">{post.likes || 0}</span>
                            </button>

                            {/* Comment Button */}
                            <button
                                onClick={(e) => { e.stopPropagation(); onOpenComments?.(post.id); }}
                                className="p-2 -m-2 flex items-center gap-1.5 transition-transform duration-150 active:scale-95"
                            >
                                <MessageCircle 
                                    className="w-5 h-5 text-neutral-400" 
                                    strokeWidth={1.25} 
                                />
                                <span className="text-xs font-medium text-neutral-700 font-sans">{post.comments || 0}</span>
                            </button>

                            {/* Repost Button - Platform intent with Repeat2 */}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleRepost(); }}
                                className="p-2 -m-2 flex items-center gap-1.5 transition-transform duration-150 active:scale-95"
                            >
                                <motion.div
                                    whileHover={{ rotate: 180 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Repeat2 
                                        className="w-5 h-5 text-neutral-400" 
                                        strokeWidth={1.25} 
                                    />
                                </motion.div>
                                <span className="text-xs font-medium text-neutral-700 font-sans">{post.shareCount || 0}</span>
                            </button>
                        </div>

                        {/* Right Group: External Share */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const shareData = {
                                    title: title || 'Check out this post',
                                    url: `${window.location.origin}/community#post-${post.id}`
                                };
                                if (navigator.share) {
                                    navigator.share(shareData);
                                } else {
                                    navigator.clipboard.writeText(shareData.url);
                                }
                            }}
                            className="p-2 -m-2 flex items-center gap-1.5 transition-transform duration-150 active:scale-95"
                        >
                            <ExternalLink 
                                className="w-5 h-5 text-neutral-400" 
                                strokeWidth={1.25} 
                            />
                            <span className="text-xs font-medium text-neutral-700 font-sans hidden sm:inline">Share</span>
                        </button>
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
