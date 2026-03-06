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

// ── Types ────────────────────────────────────────────────────────────────────
export interface CommunityPost {
    id: string;
    author: {
        id: string;
        name: string;
        role: string;
        avatarUrl?: string;
        isVerifiedHost?: boolean;
    };
    locationName: string;
    textContent: string;
    media?: { id?: string; url: string; fileId?: string }[];
    createdAt: string;
    loveCount: number;
    shareCount: number;
    isLikedByCurrentUser: boolean;
    commentCount?: number;
    homestayId?: string;
    homestayName?: string;
    originalPost?: CommunityPost;
    tags?: string[];
}

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
function LikeButton({ postId, initialLiked, initialCount, darkMode, onLikeToggle }: { postId: string; initialLiked: boolean; initialCount: number; darkMode?: boolean; onLikeToggle?: (loveCount: number, isLiked: boolean) => void }) {
    const { isAuthenticated } = useAuth() as any;
    const [popping, setPopping] = useState(false);
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await api.post(`/api/posts/${postId}/like`);
            return res.data;
        },
        onMutate: async () => {
            if (!isAuthenticated) {
                toast.error('Sign in to love this story');
                throw new Error('Unauthenticated');
            }
            setPopping(true);
            setTimeout(() => setPopping(false), 420);

            // Cancel outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({ queryKey: ['community-posts'] });
            const previousPosts = queryClient.getQueryData(['community-posts']);

            // Optimistically update the cache
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

            return { previousPosts };
        },
        onError: (err, newTodo, context: any) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(['community-posts'], context.previousPosts);
                toast.error("Cloud sync failed. Reverting love.");
            }
        },
        onSettled: () => {
            // Background sync against the true server state
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
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
    const authorName = post.author?.name || 'Traveller';
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const isOwner = String(currentUser?.id) === String(post.author?.id);
    const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'ROLE_ADMIN';
    const canModify = isOwner || isAdmin;

    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [shareCount, setShareCount] = useState<number>(Number(post.shareCount) || 0);
    const [sharing, setSharing] = useState(false);
    const { isAuthenticated } = useAuth() as any;

    // Share handler: native Web Share API → clipboard fallback → backend metric
    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (sharing) return;
        setSharing(true);
        const url = `${window.location.origin}/community#post-${post.id}`;
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title: 'North Bengal Homestays Story', text: post.textContent, url });
                setShareCount(prev => prev + 1);
                await api.post(`/api/posts/${post.id}/share`);
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
        if (!isAuthenticated) { toast.error('Sign in to repost stories'); return; }
        const quote: QuotePost = { id: post.id, authorName, textContent: post.textContent };
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
    const coverImage = post.media && post.media.length > 0
        ? post.media[0].url
        : 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80'; // Fallback for pure text posts to maintain editorial layout

    const content = (
        <motion.article
            data-testid={isQuoted ? "quoted-post-card" : "post-card"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!isQuoted ? { whileHover: { y: -2 }, transition: { type: 'spring', stiffness: 400, damping: 30 } } : {})}
            className={articleClassName}
        >
            {/* ── Background Image Layer ── */}
            <div
                className={cn("absolute inset-0 z-0", post.media && post.media.length > 0 ? "cursor-pointer" : "")}
                onClick={() => { if (post.media && post.media.length > 0) setLightboxIndex(0); }}
            >
                <img
                    src={`https://ik.imagekit.io/y4v82f1t1/tr:w-1000,q-75,f-webp/${coverImage}`}
                    alt={post.locationName}
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
            </div>

            {/* Full-card Scrims for text legibility */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10 pointer-events-none" />

            {/* ── Header: Edit/Delete + Metadata ── */}
            <div className="relative z-20 px-5 pt-5 flex justify-between items-start pointer-events-none">
                <div className="flex flex-wrap gap-2 pointer-events-auto">
                    <span className="inline-flex items-center bg-white/20 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-white/20 shadow-sm">
                        {isQuoted ? 'Repost' : 'Community Story'}
                    </span>
                    {post.tags?.map(tag => (
                        <span key={tag} className="inline-flex items-center bg-green-500/20 backdrop-blur-md text-green-100 text-[10px] font-bold uppercase tracking-widest rounded-full px-3 py-1 ring-1 ring-green-500/30">
                            {tag}
                        </span>
                    ))}
                </div>

                {canModify && onDelete && (
                    <div className="flex items-center gap-2 pointer-events-auto bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 ring-1 ring-white/10">
                        <button onClick={() => onEdit?.(post)} className="text-xs font-semibold text-gray-300 hover:text-white transition-colors">Edit</button>
                        <span className="text-gray-600">•</span>
                        <button onClick={() => onDelete(post.id)} className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors">Delete</button>
                    </div>
                )}
            </div>

            {/* ── Spacer to push content to bottom ── */}
            <div className="relative min-h-[250px] md:min-h-[350px]" />

            {/* ── Main Content Block (Bottom Left Overlay) ── */}
            <div className="relative z-20 px-5 pb-5 pointer-events-none">
                <div className="flex items-center gap-1.5 text-white/90 text-sm font-semibold mb-2 uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-rose-400" /> {post.locationName}
                </div>

                <p className="text-xl md:text-2xl text-white leading-relaxed whitespace-pre-line font-serif drop-shadow-md mb-4 pointer-events-auto cursor-auto select-text">
                    {post.textContent}
                </p>

                {/* Recursive Nested Repost */}
                {post.originalPost && (
                    <div className="mb-5 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md pointer-events-auto overflow-hidden">
                        <PostCard post={post.originalPost} isQuoted={true} currentUser={currentUser} />
                    </div>
                )}

                {/* Multi-image indicator */}
                {post.media && post.media.length > 1 && (
                    <div className="absolute right-5 bottom-20 pointer-events-auto">
                        <button
                            onClick={() => setLightboxIndex(0)}
                            className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-2 rounded-lg ring-1 ring-white/20 hover:bg-black/80 transition-colors"
                        >
                            <ImageIcon className="w-4 h-4" /> +{post.media.length - 1} Photos
                        </button>
                    </div>
                )}

                {/* Author Row */}
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#004d00] to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-none shadow-lg ring-2 ring-white/20">
                        {initials}
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 pointer-events-auto">
                            <span className="font-bold text-sm text-gray-100 hover:text-white hover:underline cursor-pointer leading-tight">
                                {authorName}
                            </span>
                            {post.author?.isVerifiedHost && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
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
                const commentCount = Math.max(0, Number(post.commentCount) || 0);
                const safeShareCount = Math.max(0, Number(shareCount) || 0);
                const hasComments = commentCount > 0;
                const hasShares = safeShareCount > 0;

                return (
                    <div className="relative z-20 flex items-center justify-between px-2 py-2 border-t border-white/10 pointer-events-auto bg-black/40 backdrop-blur-md">
                        {/* Like */}
                        <LikeButton
                            postId={post.id}
                            initialLiked={post.isLikedByCurrentUser}
                            initialCount={Math.max(0, Number(post.loveCount) || 0)}
                            darkMode={true}
                            onLikeToggle={(newCount, newLiked) => onUpdate?.({ ...post, loveCount: newCount, isLikedByCurrentUser: newLiked })}
                        />

                        {/* Comment */}
                        <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenComments?.(post.id); }}
                            className={cn('flex-1 flex justify-center items-center gap-2 min-h-10 rounded-lg transition-transform active:scale-95 text-sm font-semibold group',
                                hasComments ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5')}>
                            <MessageCircle className={cn('w-4 h-4', hasComments && 'fill-white')} />
                            <span>{Number(post.commentCount) || 0}</span>
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
            {lightboxIndex !== null && post.media && post.media.length > 0 && (
                <ImageLightbox images={post.media.map(m => m.url)} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
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

interface HomestayOpt { id: string; name: string; }

function InternalMiniRepostComposer({ quote, onSuccess, onCancel }: { quote: QuotePost; onSuccess: (post?: CommunityPost) => void; onCancel: () => void }) {
    const queryClient = useQueryClient();
    const [text, setText] = useState('');
    const [location, setLocation] = useState('North Bengal');
    const [submitting, setSubmitting] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<{ id: string; file: File; previewUrl: string }[]>([]);
    const [homestays, setHomestays] = useState<HomestayOpt[]>([]);
    const [selectedHomestay, setSelectedHomestay] = useState('');
    const fileRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        api.get('/api/homestays')
            .then(res => setHomestays(res.data.content || res.data || []))
            .catch(() => { });
    }, []);

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
                const up = await api.post('/api/upload', form);
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
            const res = await api.post('/api/posts', formData);
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
                className="bg-white w-full h-[100dvh] flex flex-col md:w-[600px] md:h-auto md:max-h-[85vh] md:rounded-2xl shadow-2xl overflow-hidden relative z-10"
            >
                {/* Tier 1: Safe-Area Header (flex-none) */}
                <div className="flex-none pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-4 pb-4 px-4 flex justify-between items-center border-b border-gray-200 bg-white">
                    <p className="font-bold text-gray-800 text-lg flex items-center gap-2"><Repeat2 className="w-4 h-4 text-green-600" /> Repost Story</p>
                    <button onClick={onCancel} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0" aria-label="Close">
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                {/* Tier 2: The Contained Body (flex-1 min-h-0) */}
                <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
                    {/* Quoted Preview */}
                    <div className="border border-green-300 rounded-xl p-4 bg-green-50">
                        <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Repeat2 className="w-3.5 h-3.5" /> Reposting {quote.authorName}&apos;s story
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-3">{quote.textContent}</p>
                    </div>
                    <textarea
                        value={text}
                        onChange={e => setText(e.target.value)}
                        placeholder="Add your thoughts..."
                        className="w-full h-32 md:h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-green-500/40 focus:border-transparent resize-none text-base font-medium text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                    />
                    {/* Image staging */}
                    {stagedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                            {stagedFiles.map((f, i) => (
                                <div key={f.id} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-200">
                                    <OptimizedImage src={f.previewUrl} alt="preview" className="w-full h-full object-cover" width={200} />
                                    <button onClick={() => { URL.revokeObjectURL(f.previewUrl); setStagedFiles(p => p.filter((_, j) => j !== i)); }}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tools Row — Photo & Location side by side */}
                    <div className="flex items-center gap-3">
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileRef.current?.click()} className="flex-1 flex justify-center items-center gap-2 border border-gray-200 rounded-xl py-2.5 bg-white text-blue-600 text-sm font-semibold hover:bg-gray-50 shadow-sm transition-colors">
                            <ImageIcon className="w-4 h-4" /> Photo
                        </button>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-500" />
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location..." className="w-full border border-gray-200 bg-white text-rose-700 placeholder-rose-400 rounded-xl pl-8 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-200 focus:border-transparent focus:outline-none shadow-sm transition-all" />
                        </div>
                    </div>

                    {/* Tag Homestay */}
                    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <CustomCombobox options={homestays} value={selectedHomestay} onChange={setSelectedHomestay} placeholder="Tag Homestay" />
                    </div>

                    {/* Submit */}
                    <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 text-white text-base font-semibold rounded-xl shadow-md hover:bg-green-700 transition-all disabled:opacity-50 active:scale-[0.98] mt-1">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting ? 'Posting...' : 'Repost'}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

