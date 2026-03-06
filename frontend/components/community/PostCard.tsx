'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Heart, MessageCircle, MapPin, Pencil, MoreHorizontal, Trash2, Share2, Loader2, Repeat2, X, Send, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ImageCollage } from '@/components/community/ImageCollage';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CommentsSection } from '@/components/comments-section';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { LoginPromptModal } from './LoginPromptModal';

// ── Icons for Tags ───────────────────────────────────────────────────────────
const TAG_ICONS: Record<string, React.ReactNode> = {
    'Hidden Gem': <CheckCircle2 className="w-3 h-3" />,
    'Top Pick': <TrendingUp className="w-3 h-3" />, // Will import TrendingUp
    'Himalayan Bliss': <MapPin className="w-3 h-3" />,
    'Local Secret': <Send className="w-3 h-3" />,
};
import { TrendingUp } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
import { NormalizedPost } from '@/lib/adapters/normalizePost';

export type CommunityPost = NormalizedPost;

// ── Helpers ──────────────────────────────────────────────────────────────────
export function formatRelative(isoDate: string) {
    if (!isoDate) return '';
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Inline PostComposerInline import type for Repost quoting 
export interface QuotePost {
    id: string;
    authorName: string;
    textContent: string;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface PostCardProps {
    post: CommunityPost;
    /** Existing update callback for when data actually changes (passed to composer) */
    onUpdate?: (p: CommunityPost) => void;
    onDelete?: (id: string) => void;
    /** Trigger for opening the edit modal from the parent */
    onEdit?: (p: CommunityPost) => void;
    /** Passed from feed page for owner comparison */
    currentUser?: any;
    /** In detail view: disable card-level link, disable hover lift */
    /** Callback to open composer in "Repost" mode */
    onRepost?: (quote: QuotePost) => void;
    /** Is this post being rendered as a quoted repost inside another post? */
    isQuoted?: boolean;
    /** Callback to open the global comment drawer */
    onOpenComments?: (postId: string) => void;
    /** Callback to instantly sync global state when a repost is created */
    onNewPost?: (p: CommunityPost) => void;
}

// ── LikeButton ────────────────────────────────────────────────────────────────
function LikeButton({ postId, initialLiked, initialCount, darkMode, onLikeToggle, onUnauthenticated }: { postId: string; initialLiked: boolean; initialCount: number; darkMode?: boolean; onLikeToggle?: (loveCount: number, isLiked: boolean) => void; onUnauthenticated?: () => void }) {
    const { isAuthenticated } = useAuth() as any;
    const [popping, setPopping] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/posts/${postId}/like`);
            return res.data;
        },
        onMutate: async () => {
            // Check authentication first
            if (!isAuthenticated) {
                onUnauthenticated?.();
                throw new Error('Unauthenticated');
            }

            setPopping(true);
            setTimeout(() => setPopping(false), 420);

            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['community-posts'] });
            await queryClient.cancelQueries({ queryKey: ['trending-posts'] });
            const previousPosts = queryClient.getQueryData(['community-posts']);
            const previousTrending = queryClient.getQueryData(['trending-posts']);

            // Optimistically update the main feed cache
            queryClient.setQueryData(['community-posts'], (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        content: (page.content || []).map((post: any) => {
                            if (post.id === postId) {
                                const newIsLiked = !post.isLikedByCurrentUser;
                                const newCount = newIsLiked ? post.loveCount + 1 : Math.max(0, post.loveCount - 1);
                                if (onLikeToggle) onLikeToggle(newCount, newIsLiked);
                                return { ...post, isLikedByCurrentUser: newIsLiked, loveCount: newCount };
                            }
                            return post;
                        })
                    }))
                };
            });

            // Optimistically update the trending posts cache
            queryClient.setQueryData(['trending-posts'], (old: any) => {
                if (!old || !old.content) return old;
                return {
                    ...old,
                    content: (old.content || []).map((post: any) => {
                        if (post.id === postId) {
                            const newIsLiked = !post.isLikedByCurrentUser;
                            const newCount = newIsLiked ? post.loveCount + 1 : Math.max(0, post.loveCount - 1);
                            return { ...post, isLikedByCurrentUser: newIsLiked, loveCount: newCount };
                        }
                        return post;
                    })
                };
            });

            return { previousPosts, previousTrending };
        },
        onError: (err: any, newTodo, context: any) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(['community-posts'], context.previousPosts);
            }
            if (context?.previousTrending) {
                queryClient.setQueryData(['trending-posts'], context.previousTrending);
            }

            // Unauthenticated is handled in onMutate, so we only show errors for actual save failures
            if (err.message !== 'Unauthenticated') {
                const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
                toast.error(isNetworkError ? "Connection hiccup — try again" : "Couldn't save your love. Try again.");
            }
        },
        onSettled: () => {
            // Background sync against the true server state
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            queryClient.invalidateQueries({ queryKey: ['trending-posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', postId] });
        }
    });

    return (
        <button
            data-testid="like-btn"
            onClick={() => mutation.mutate()}
            className={cn('flex-1 flex justify-center items-center gap-2 rounded-lg transition-transform duration-200 active:scale-75 text-sm font-semibold group cursor-pointer min-h-10',
                (initialLiked || initialCount > 0) ? 'text-red-500 hover:bg-red-50' :
                    darkMode ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}
            aria-label={initialLiked ? 'Unlike post' : 'Like post'}
        >
            <Heart className={cn('w-5 h-5 transition-all duration-200',
                popping ? 'scale-125 bounce-pop' : '',
                (initialLiked || initialCount > 0) ? 'fill-red-500 stroke-red-500 animate-in zoom-in-75 duration-300' :
                    darkMode ? 'stroke-white' : 'stroke-gray-500 group-hover:stroke-gray-700')} />
            <span>{Number(initialCount) || 0}</span>
        </button>
    );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
export function PostCard({ post, onUpdate, onDelete, onEdit, currentUser, onRepost, isQuoted = false, onOpenComments, onNewPost }: PostCardProps) {
    const authorName = post.authorName;
    const authorAvatar = post.authorAvatar;
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const isOwner = String(currentUser?.id) === String(post.authorId);
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ROLE_ADMIN';
    const canModify = isOwner || isAdmin;

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [shareCount, setShareCount] = useState<number>(Number(post.shareCount) || 0);
    const [sharing, setSharing] = useState(false);
    const { isAuthenticated } = useAuth() as any;
    const [loginModal, setLoginModal] = useState<{ open: boolean; action: 'love' | 'comment' | 'repost' | 'share' }>({
        open: false,
        action: 'love'
    });

    // Share handler: native Web Share API → clipboard fallback → backend metric
    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (sharing) return;
        setSharing(true);
        const url = `${window.location.origin}/community#post-${post.id}`;
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title: 'North Bengal Homestays Story', text: post.caption, url });
                setShareCount(prev => prev + 1);
                await api.post(`/posts/${post.id}/share`);
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
        } catch (err: any) {
            if (err?.name !== 'AbortError') toast.error('Could not share post');
        } finally {
            setSharing(false);
        }
    };

    // ── Internal Repost State (self-sufficient when no onRepost prop) ──
    const [internalRepostQuote, setInternalRepostQuote] = useState<QuotePost | null>(null);

    const handleRepost = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            setLoginModal({ open: true, action: 'repost' });
            return;
        }
        const quote: QuotePost = { id: post.id, authorName, textContent: post.caption };
        if (onRepost) {
            onRepost(quote);
        } else {
            // Self-sufficient: open internal repost composer
            setInternalRepostQuote(quote);
        }
    };

    const handleInternalRepostSuccess = (newPost?: CommunityPost) => {
        setInternalRepostQuote(null);
        if (newPost && onNewPost) {
            onNewPost(newPost);
        }
    };

    const articleClassName = cn(
        'relative bg-zinc-950 rounded-2xl overflow-hidden transition-all duration-300 isolate',
        isQuoted ? "mt-3 hover:bg-zinc-900 ring-1 ring-white/10" : "mb-6 shadow-xl hover:shadow-2xl ring-1 ring-white/5",
    );

    // Prepare primary display image
    const coverImage = post.imageUrl;
    const hasImage = !!coverImage;
    const isMultiImage = post.images && post.images.length > 1;

    // Simple Carousel State
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const content = (
        <motion.article
            data-testid={isQuoted ? "quoted-post-card" : "post-card"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!isQuoted ? { whileHover: { y: -2 }, transition: { type: 'spring', stiffness: 400, damping: 30 } } : {})}
            className={articleClassName}
        >
            {/* ── Image/Carousel Block ── */}
            {hasImage ? (
                <div className="relative z-10 w-full overflow-hidden group">
                    {isMultiImage ? (
                        <div className="relative aspect-square md:aspect-video lg:min-h-[500px]">
                            <motion.div
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                onDragEnd={(_, info) => {
                                    if (info.offset.x < -50 && activeImageIndex < post.images.length - 1) {
                                        setActiveImageIndex(prev => prev + 1);
                                    } else if (info.offset.x > 50 && activeImageIndex > 0) {
                                        setActiveImageIndex(prev => prev - 1);
                                    }
                                }}
                                animate={{ x: `-${activeImageIndex * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className="absolute inset-0 flex h-full"
                            >
                                {post.images.map((img, idx) => (
                                    <div key={idx} className="relative min-w-full h-full cursor-pointer" onClick={() => setLightboxIndex(idx)}>
                                        <img
                                            src={`${img.url}?tr=w-1200,q-70,f-webp`}
                                            alt={`${post.location} - ${idx + 1}`}
                                            className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                                        />
                                    </div>
                                ))}
                            </motion.div>

                            {/* Carousel Indicators */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                                {post.images.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "w-1.5 h-1.5 rounded-full transition-all duration-300",
                                            idx === activeImageIndex ? "bg-white w-4" : "bg-white/40"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div
                            className="relative aspect-square md:aspect-video lg:min-h-[400px] cursor-pointer"
                            onClick={() => setLightboxIndex(0)}
                        >
                            <img
                                src={`${coverImage}?tr=w-1200,q-70,f-webp`}
                                alt={post.location}
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
                            />
                        </div>
                    )}

                    {/* ── Header Overlay (Shared for both Single & Multi) ── */}
                    <div className="absolute inset-x-0 top-0 pt-6 px-6 flex justify-between items-start pointer-events-none z-20 bg-gradient-to-b from-black/60 to-transparent pb-10">
                        <div className="flex flex-wrap gap-2 pointer-events-auto">
                            <span className="inline-flex items-center bg-black/40 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-white/20">
                                {isQuoted ? 'Repost' : 'Story'}
                            </span>
                            {(post.tags ?? []).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1.5 bg-green-500/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-green-500">
                                    {TAG_ICONS[tag] || null}
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {canModify && onDelete && (
                            <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-md rounded-full px-3 py-1.5 ring-1 ring-white/20">
                                <button onClick={() => onEdit?.(post)} className="text-xs font-semibold text-gray-200 hover:text-white transition-colors">Edit</button>
                                <span className="text-gray-500">•</span>
                                <button onClick={() => onDelete(post.id)} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">Delete</button>
                            </div>
                        )}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 z-20 pointer-events-none">
                        <div className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-wider">
                            <MapPin className="w-4 h-4" /> {post.location}
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Text-Only Layout ── */
                <div className="relative z-10 w-full p-8 md:p-12 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-white/10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex flex-wrap gap-2">
                            <span className="inline-flex items-center bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-white/20">
                                Editorial
                            </span>
                            {(post.tags ?? []).map(tag => (
                                <span key={tag} className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-300 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-green-500/30">
                                    {TAG_ICONS[tag] || null}
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-wider">
                            <MapPin className="w-4 h-4" /> {post.location}
                        </div>
                    </div>

                    <p className="text-xl md:text-2xl lg:text-3xl text-white leading-relaxed font-serif italic mb-6">
                        &quot;{post.caption}&quot;
                    </p>

                    {canModify && onDelete && (
                        <div className="flex items-center gap-3">
                            <button onClick={() => onEdit?.(post)} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Edit Story</button>
                            <button onClick={() => onDelete(post.id)} className="text-xs font-bold text-red-500/70 hover:text-red-400 uppercase tracking-widest transition-colors">Delete</button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Meta Section (Caption & Author) ── */}
            <div className={cn("relative z-20 px-6 pb-6 bg-zinc-950", hasImage ? "pt-6" : "pt-2")}>
                {hasImage && (
                    <p className="text-base md:text-lg text-gray-200 leading-relaxed whitespace-pre-line font-serif mb-6 pointer-events-auto select-text line-clamp-4">
                        {post.caption}
                    </p>
                )}

                {/* Recursive Nested Repost */}
                {post.originalPost && (
                    <div className="mb-5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md pointer-events-auto overflow-hidden">
                        <PostCard post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                    </div>
                )}

                {/* Author Row */}
                <div className="flex items-center gap-3 pt-2 border-t border-white/10 mt-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004d00] to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-none shadow-lg ring-2 ring-white/20 overflow-hidden">
                        {post.authorAvatar ? <img src={post.authorAvatar} alt={authorName} className="w-full h-full object-cover" /> : initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                            <span className="font-bold text-sm text-gray-100 hover:text-white hover:underline cursor-pointer leading-tight">
                                {authorName}
                            </span>
                            {post.isVerifiedHost && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                        <span className="text-xs text-gray-400 font-medium">
                            {formatRelative(post.createdAt)}
                        </span>
                    </div>

                    {/* Quick Homestay Tag */}
                    {post.homestayId && post.homestayName && (
                        <div className="ml-auto pointer-events-auto">
                            <Link href={`/homestays/${post.homestayId}`} className="inline-flex items-center gap-1.5 bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-100 text-xs py-1.5 px-3 rounded-full font-semibold transition-colors ring-1 ring-green-500/40">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate max-w-[120px]">{post.homestayName}</span>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Premium Action Bar (Hidden if quoting) ── */}
            {!isQuoted && (() => {
                const commentCount = Math.max(0, Number(post.comments) || 0);
                const safeShareCount = Math.max(0, Number(shareCount) || 0);
                const hasComments = commentCount > 0;
                const hasShares = safeShareCount > 0;

                return (
                    <div className="relative z-20 flex items-center justify-between px-2 py-2 border-t border-white/10 pointer-events-auto bg-black/40 backdrop-blur-md">
                        {/* Like */}
                        <LikeButton
                            postId={post.id}
                            initialLiked={post.isLikedByCurrentUser || false}
                            initialCount={Math.max(0, Number(post.likes) || 0)}
                            darkMode={true}
                            onLikeToggle={(newCount, newLiked) => onUpdate?.({ ...post, likes: newCount, isLikedByCurrentUser: newLiked })}
                            onUnauthenticated={() => setLoginModal({ open: true, action: 'love' })}
                        />

                        {/* Comment */}
                        <button onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!isAuthenticated) { setLoginModal({ open: true, action: 'comment' }); return; }
                            onOpenComments?.(post.id);
                        }}
                            className={cn('flex-1 flex justify-center items-center gap-2 min-h-10 rounded-lg transition-transform active:scale-95 text-sm font-semibold group',
                                hasComments ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
                            <MessageCircle className={cn('w-4 h-4', hasComments && 'fill-white')} />
                            <span>{Number(post.comments) || 0}</span>
                        </button>

                        {/* Repost */}
                        <button onClick={handleRepost}
                            className={cn('flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg transition-all active:scale-95 text-sm font-semibold group',
                                post.originalPost ? 'text-green-400 bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
                            <Repeat2 className="w-5 h-5" />
                        </button>

                        {/* Share */}
                        <button onClick={handleShare}
                            className={cn('flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg transition-all active:scale-95 text-sm font-semibold group',
                                hasShares ? 'text-violet-400 bg-violet-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
                            <Share2 className="w-4 h-4" />
                            <span>{safeShareCount}</span>
                        </button>
                    </div>
                );
            })()}

            {/* Lightbox */}
            {lightboxIndex !== null && hasImage && (
                <ImageLightbox
                    images={post.images.map(img => img.url)}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
            )}
            {/* Modal Layer */}
            <LoginPromptModal
                isOpen={loginModal.open}
                action={loginModal.action}
                onClose={() => setLoginModal(prev => ({ ...prev, open: false }))}
            />
        </motion.article>
    );

    return (
        <>
            {content}
            {/* Self-contained Repost Composer (when no external onRepost is wired) */}
            <AnimatePresence>
                {internalRepostQuote && (
                    <InternalMiniRepostComposer
                        quote={internalRepostQuote}
                        onSuccess={handleInternalRepostSuccess}
                        onCancel={() => setInternalRepostQuote(null)}
                    />
                )}
            </AnimatePresence>
        </>
    );
}

// ── InternalMiniRepostComposer ──────────────────────────────────────────────
// Full-featured repost modal with image upload, location, and homestay tagging.
import { CustomCombobox } from '@/components/ui/combobox';
import { useHomestaysLookup } from '@/hooks/useHomestaysLookup';

interface HomestayOpt { id: string; name: string; }

function InternalMiniRepostComposer({ quote, onSuccess, onCancel }: { quote: QuotePost; onSuccess: (post?: CommunityPost) => void; onCancel: () => void }) {
    const queryClient = useQueryClient();
    const [text, setText] = useState('');
    const [location, setLocation] = useState('North Bengal');
    const [submitting, setSubmitting] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
    const { data: homestays = [] } = useHomestaysLookup();
    const [selectedHomestay, setSelectedHomestay] = useState('');
    const fileRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newStaged = files.map(f => ({ id: Math.random().toString(36).slice(2), file: f, previewUrl: URL.createObjectURL(f) }));
        setStagedFiles(prev => [...prev, ...newStaged].slice(0, 6));
        if (fileRef.current) fileRef.current.value = '';
    };

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            let finalMedia: { url: string; fileId?: string }[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(f => form.append('files', f.file));
                const up = await api.post('/upload', form);
                finalMedia = up.data;
            }
            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                media: finalMedia,
                repostedFromPostId: quote.id,
            };
            if (selectedHomestay) payload.homestayId = selectedHomestay;

            // Enforce multipart/form-data contract required by PostController
            const formData = new FormData();
            formData.append('request', new Blob([JSON.stringify(payload)], { type: "application/json" }));

            // Files could be appended directly here if we skip the separate /api/upload step, 
            // but preserving existing upload logic just sends the JSON Blob inside FormData
            const res = await api.post('/posts', formData);
            toast.success('Reposted!');

            // Instantly inject the repost into the active feed BEFORE the background refetch completes
            queryClient.setQueryData(['community-posts'], (old: any) => {
                if (!old || !old.pages) return old;
                const newPages = [...old.pages];
                if (newPages.length > 0) {
                    newPages[0] = { ...newPages[0], content: [res.data, ...(newPages[0].content || [])] };
                }
                return { ...old, pages: newPages };
            });

            // Invalidate the absolute truth feed
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
            onSuccess(res.data);
        } catch {
            toast.error('Repost failed');
        } finally {
            setSubmitting(false);
        }
    };
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 flex flex-col justify-end md:justify-center md:items-center">
            <div className="hidden md:block absolute inset-0 -z-10" onClick={onCancel} />
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="bg-zinc-950 w-full h-[100dvh] flex flex-col md:w-[620px] md:h-auto md:max-h-[85vh] md:rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 border border-white/5 ring-1 ring-white/10"
            >
                {/* Tier 1: Safe-Area Header (flex-none) */}
                <div className="flex-none pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-6 pb-6 px-8 flex justify-between items-center border-b border-white/5 bg-zinc-950">
                    <p className="font-bold text-white text-2xl md:text-3xl font-serif tracking-tight flex items-center gap-3"><Repeat2 className="w-5 h-5 text-green-500" /> Repost Story</p>
                    <button onClick={onCancel} className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all border border-white/10 flex-shrink-0 active:scale-90" aria-label="Close">
                        <X size={20} className="text-zinc-400" />
                    </button>
                </div>

                {/* Tier 2: The Contained Body (flex-1 min-h-0) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col gap-8 bg-zinc-950">
                    {/* Quoted Preview */}
                    <div className="border border-green-500/30 rounded-2xl p-5 bg-green-500/5 shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                        <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <Repeat2 className="w-3.5 h-3.5" /> Reposting {quote.authorName}&apos;s story
                        </p>
                        <p className="text-base font-serif text-zinc-200 line-clamp-3 italic leading-relaxed">&quot;{quote.textContent}&quot;</p>
                    </div>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-32 md:h-40 p-6 bg-zinc-900/50 border border-white/10 rounded-3xl shadow-2xl focus:bg-zinc-900 focus:ring-4 focus:ring-green-500/20 focus:border-green-500/50 resize-none text-lg font-medium text-white placeholder:text-zinc-600 transition-all duration-300"
                    />
                    {/* Image staging */}
                    {stagedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-4">
                            {stagedFiles.map((f, i) => (
                                <div key={f.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-2xl bg-zinc-900 ring-1 ring-white/10">
                                    <OptimizedImage src={f.previewUrl} alt="preview" className="w-full h-full object-cover" width={200} />
                                    <button onClick={() => { URL.revokeObjectURL(f.previewUrl); setStagedFiles(p => p.filter((_, j) => j !== i)); }}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <X className="w-7 h-7 text-white drop-shadow-2xl" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tools Row — Photo & Location side by side */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileRef.current?.click()} disabled={submitting} className="w-full sm:w-auto flex-[0.7] flex justify-center items-center gap-2 border border-white/10 rounded-2xl py-4 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-white/20 shadow-2xl transition-all active:scale-95 text-sm font-bold uppercase tracking-wider">
                            <ImageIcon className="w-5 h-5" /> Visuals
                        </button>
                        <div className="w-full sm:w-auto flex-[2] relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-green-400 transition-colors" />
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Where did this happen?" className="w-full border border-white/10 bg-zinc-900/50 text-white placeholder-zinc-600 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 shadow-2xl transition-all outline-none" />
                        </div>
                    </div>

                    {/* Tag Homestay */}
                    <div className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden bg-zinc-900/50">
                        <CustomCombobox options={homestays} value={selectedHomestay} onChange={setSelectedHomestay} placeholder="Tag a specific Homestay" />
                    </div>

                    {/* Submit */}
                    <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-3 py-5 bg-white hover:bg-zinc-100 text-zinc-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] disabled:opacity-30 mt-2 text-sm">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {submitting ? 'Publishing...' : 'Publish Repost'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

