'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Heart, MessageCircle, MapPin, Share2, Repeat2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
const ImageLightbox = dynamic(() => import('@/components/community/ImageLightbox').then(m => m.ImageLightbox), { ssr: false });
import { postApi } from '@/lib/api/posts';
import { useAuth } from '@/context/AuthContext';
import { LoginPromptModal } from './LoginPromptModal';
import { queryKeys } from '@/lib/queryKeys';
import { TrendingUp } from 'lucide-react';

const TAG_ICONS: Record<string, React.ReactNode> = {
    'Hidden Gem': <CheckCircle2 className="w-3 h-3" />,
    'Top Pick': <TrendingUp className="w-3 h-3" />,
    'Mountain Bliss': <MapPin className="w-3 h-3" />,
};

import { CommunityPost, QuotePost } from './types';
import { RepostModal } from './RepostModal';

function formatRelative(isoDate: string) {
    if (!isoDate) return '';
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 86400)}d ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

function extractTitleAndExcerpt(text: string): { title: string; excerpt: string } {
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
            await queryClient.cancelQueries({ queryKey: queryKeys.community.feed() });
            await queryClient.cancelQueries({ queryKey: queryKeys.community.trending });
            const previousPosts = queryClient.getQueryData(queryKeys.community.feed());
            const previousTrending = queryClient.getQueryData(queryKeys.community.trending);

            // Optimistically update the main feed cache
            queryClient.setQueryData(queryKeys.community.feed(), (old: any) => {
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
            queryClient.setQueryData(queryKeys.community.trending, (old: any) => {
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
                queryClient.setQueryData(queryKeys.community.feed(), context.previousPosts);
            }
            if (context?.previousTrending) {
                queryClient.setQueryData(queryKeys.community.trending, context.previousTrending);
            }

            // Unauthenticated is handled in onMutate, so we only show errors for actual save failures
            if (err.message !== 'Unauthenticated') {
                const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error';
                toast.error(isNetworkError ? "Connection hiccup — try again" : "Couldn't save your love. Try again.");
            }
        },
        onSettled: () => {
            // Background sync against the true server state
            queryClient.invalidateQueries({ queryKey: queryKeys.community.feed() });
            queryClient.invalidateQueries({ queryKey: queryKeys.community.trending });
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

    const [expanded, setExpanded] = useState(false);
    const hasLongContent = (post.caption?.length || 0) > 200;

    const articleClassName = cn(
        'relative bg-white overflow-hidden transition-all duration-300 isolate',
        isQuoted ? "mt-3 rounded-xl ring-1 ring-neutral-200" : "rounded-xl shadow-sm hover:shadow-md border border-neutral-200",
        !isQuoted && 'hover:-translate-y-[2px]'
    );

    const hasImage = !!post.imageUrl || (post.images && post.images.length > 0);
    const imageCount = post.images?.length || (post.imageUrl ? 1 : 0);
    const isMultiImage = imageCount > 1;

    const { title, excerpt } = useMemo(() => extractTitleAndExcerpt(post.caption), [post.caption]);

    return (
        <>
            <motion.article
                data-testid={isQuoted ? "quoted-post-card" : "post-card"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                {...(!isQuoted ? { whileHover: { y: -2 } } : {})}
                className={articleClassName}
            >
                {/* Image Block */}
                {hasImage && (
                    <div className="relative z-10 w-full overflow-hidden">
                        <div className="relative w-full aspect-[4/5] max-h-[360px] sm:max-h-[420px] lg:max-h-[520px] overflow-hidden bg-neutral-100">
                            {imageCount === 1 && (
                                <div className="relative w-full h-full cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(0)}>
                                    <Image src={post.imageUrl || post.images?.[0]?.url || ''} alt={post.location || 'Post image'} fill sizes="(min-width: 768px) 600px, 100vw" className="object-cover" />
                                </div>
                            )}
                            {imageCount === 2 && (
                                <div className="grid grid-cols-2 w-full h-full">
                                    {post.images?.map((img, idx) => (
                                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(idx)}>
                                            <Image src={img.url} alt={`${post.location} - ${idx + 1}`} fill sizes="50vw" className="object-cover" />
                                        </div>
                                    ))}
                                </div>
                            )}
                            {imageCount === 3 && (
                                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                    <div className="col-span-2 row-span-1 cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(0)}>
                                        <Image src={post.images?.[0]?.url} alt={`${post.location} - 1`} fill sizes="100vw" className="object-cover" />
                                    </div>
                                    <div className="cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(1)}>
                                        <Image src={post.images?.[1]?.url} alt={`${post.location} - 2`} fill sizes="50vw" className="object-cover" />
                                    </div>
                                    <div className="cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(2)}>
                                        <Image src={post.images?.[2]?.url} alt={`${post.location} - 3`} fill sizes="50vw" className="object-cover" />
                                    </div>
                                </div>
                            )}
                            {imageCount >= 4 && (
                                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                    {post.images?.slice(0, 4).map((img, idx) => (
                                        <div key={idx} className="relative w-full h-full cursor-pointer overflow-hidden" onClick={() => setLightboxIndex(idx)}>
                                            <Image src={img.url} alt={`${post.location} - ${idx + 1}`} fill sizes="50vw" className="object-cover" />
                                            {idx === 3 && imageCount > 4 && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <span className="text-white font-bold text-xl">+{imageCount - 4}</span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* Content Block */}
                <div className="relative z-20 p-4 lg:p-5 bg-white">
                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center bg-neutral-100 text-neutral-600 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                            {isQuoted ? 'Repost' : 'Story'}
                        </span>
                        {(post.tags ?? []).slice(0, 2).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1">
                                {TAG_ICONS[tag]}{tag}
                            </span>
                        ))}
                    </div>

                    {/* Headline */}
                    <h3 className="text-xl sm:text-2xl font-bold font-heading text-neutral-900 leading-tight tracking-tight mb-2 line-clamp-2">
                        {title || post.caption.slice(0, 100)}
                    </h3>

                    {/* Excerpt with Read more */}
                    <div className="text-sm sm:text-base text-neutral-600 leading-relaxed mb-3">
                        <span className={expanded ? '' : 'line-clamp-3'}>
                            {excerpt || post.caption.slice(100) || post.caption}
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

                {/* Quoted Repost */}
                {post.originalPost && (
                    <div className="px-4 lg:px-5 pb-4 bg-white">
                        <div className="rounded-xl border border-neutral-200 bg-neutral-50 overflow-hidden">
                            <PostCard post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                        </div>
                    </div>
                )}

                {/* Actions Bar */}
                {!isQuoted && (
                    <div className="relative z-20 flex items-center justify-between px-4 py-3 border-t border-neutral-100 bg-white">
                        <LikeButton
                            postId={post.id}
                            initialLiked={post.isLikedByCurrentUser || false}
                            initialCount={post.likes || 0}
                            darkMode={false}
                            onLikeToggle={(newCount, newLiked) => onUpdate?.({ ...post, likes: newCount, isLikedByCurrentUser: newLiked })}
                            onUnauthenticated={() => setLoginModal({ open: true, action: 'love' })}
                        />
                        <button
                            onClick={() => { if (!isAuthenticated) { setLoginModal({ open: true, action: 'comment' }); return; } onOpenComments?.(post.id); }}
                            className="flex-1 flex justify-center items-center gap-2 min-h-10 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 text-sm font-semibold transition-colors"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>{post.comments || 0}</span>
                        </button>
                        <button
                            onClick={handleRepost}
                            className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 text-sm font-semibold transition-colors"
                        >
                            <Repeat2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 text-sm font-semibold transition-colors"
                        >
                            <Share2 className="w-4 h-4" />
                            <span>{shareCount}</span>
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
