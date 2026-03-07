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
import { postApi } from '@/lib/api/posts';
import { useAuth } from '@/context/AuthContext';
import { LoginPromptModal } from './LoginPromptModal';

// ── Icons for Tags ───────────────────────────────────────────────────────────
const TAG_ICONS: Record<string, React.ReactNode> = {
    'Hidden Gem': <CheckCircle2 className="w-3 h-3" />,
    'Top Pick': <TrendingUp className="w-3 h-3" />, // Will import TrendingUp
    'Mountain Bliss': <MapPin className="w-3 h-3" />,
    'Local Secret': <Send className="w-3 h-3" />,
};
import { TrendingUp } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
import { CommunityPost, QuotePost } from './types';
import { RepostModal } from './RepostModal';

// ── Helpers ──────────────────────────────────────────────────────────────────
export function formatRelative(isoDate: string) {
    if (!isoDate) return '';
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 86400)}d ago`;
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
            const res = await postApi.like(postId);
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
                await postApi.share(post.id);
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

    const hasImage = !!post.imageUrl;
    const isMultiImage = post.images && post.images.length > 1;
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    return (
        <>
            <motion.article
                data-testid={isQuoted ? "quoted-post-card" : "post-card"}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                {...(!isQuoted ? { whileHover: { y: -2 }, transition: { type: 'spring', stiffness: 400, damping: 30 } } : {})}
                className={articleClassName}
            >
                {/* Image Block */}
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
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ))}
                                </motion.div>
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-30">
                                    {post.images.map((_, idx) => (
                                        <div key={idx} className={cn("w-1.5 h-1.5 rounded-full transition-all", idx === activeImageIndex ? "bg-white w-4" : "bg-white/40")} />
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="relative aspect-square md:aspect-video lg:min-h-[400px] cursor-pointer" onClick={() => setLightboxIndex(0)}>
                                <img src={`${post.imageUrl}?tr=w-1200,q-70,f-webp`} alt={post.location} className="w-full h-full object-cover" />
                            </div>
                        )}
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
                    </div>
                ) : (
                    <div className="relative z-10 w-full p-8 bg-gradient-to-br from-zinc-900 to-zinc-950 border-b border-white/10">
                        <div className="flex items-center justify-between mb-8">
                            <span className="bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-white/20">Editorial</span>
                            <div className="flex items-center gap-2 text-rose-400 text-sm font-bold uppercase tracking-wider"><MapPin className="w-4 h-4" /> {post.location}</div>
                        </div>
                        <p className="text-xl text-white leading-relaxed font-serif italic mb-6">&quot;{post.caption}&quot;</p>
                        {canModify && onDelete && (
                            <div className="flex items-center gap-3">
                                <button onClick={() => onEdit?.(post)} className="text-xs font-bold text-gray-400 hover:text-white uppercase tracking-widest transition-colors">Edit Story</button>
                                <button onClick={() => onDelete(post.id)} className="text-xs font-bold text-red-500/70 hover:text-red-400 uppercase tracking-widest transition-colors">Delete</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className={cn("relative z-20 px-6 pb-6 bg-zinc-950", hasImage ? "pt-6" : "pt-2")}>
                    {hasImage && <p className="text-base text-gray-200 leading-relaxed font-serif mb-6 whitespace-pre-line">{post.caption}</p>}
                    {post.originalPost && (
                        <div className="mb-5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md overflow-hidden">
                            <PostCard post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                        </div>
                    )}
                    <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004d00] to-emerald-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                            {authorAvatar ? <img src={authorAvatar} alt={authorName} className="w-full h-full object-cover" /> : initials}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-100">{authorName}</span>
                            <span className="text-xs text-gray-400">{formatRelative(post.createdAt)}</span>
                        </div>
                        {post.homestayId && post.homestayName && (
                            <div className="ml-auto">
                                <Link href={`/homestays/${post.homestayId}`} className="inline-flex items-center gap-1.5 bg-green-500/20 text-green-100 text-xs py-1.5 px-3 rounded-full font-semibold ring-1 ring-green-500/40">
                                    <MapPin className="w-3.5 h-3.5" /> <span className="truncate max-w-[120px]">{post.homestayName}</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {!isQuoted && (
                    <div className="relative z-20 flex items-center justify-between px-2 py-2 border-t border-white/10 bg-black/40 backdrop-blur-md">
                        <LikeButton
                            postId={post.id}
                            initialLiked={post.isLikedByCurrentUser || false}
                            initialCount={post.likes || 0}
                            darkMode={true}
                            onLikeToggle={(newCount, newLiked) => onUpdate?.({ ...post, likes: newCount, isLikedByCurrentUser: newLiked })}
                            onUnauthenticated={() => setLoginModal({ open: true, action: 'love' })}
                        />
                        <button onClick={() => { if (!isAuthenticated) { setLoginModal({ open: true, action: 'comment' }); return; } onOpenComments?.(post.id); }}
                            className="flex-1 flex justify-center items-center gap-2 min-h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold">
                            <MessageCircle className="w-4 h-4" /> <span>{post.comments || 0}</span>
                        </button>
                        <button onClick={handleRepost} className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold">
                            <Repeat2 className="w-5 h-5" />
                        </button>
                        <button onClick={handleShare} className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 text-sm font-semibold">
                            <Share2 className="w-4 h-4" /> <span>{shareCount}</span>
                        </button>
                    </div>
                )}
            </motion.article>

            {lightboxIndex !== null && hasImage && (
                <ImageLightbox images={post.images.map(img => img.url)} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}

            <LoginPromptModal isOpen={loginModal.open} action={loginModal.action} onClose={() => setLoginModal({ ...loginModal, open: false })} />

            <AnimatePresence>
                {internalRepostQuote && (
                    <RepostModal quote={internalRepostQuote} onSuccess={handleInternalRepostSuccess} onCancel={() => setInternalRepostQuote(null)} />
                )}
            </AnimatePresence>
        </>
    );
}
