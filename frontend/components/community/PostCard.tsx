'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Pencil, MoreHorizontal, Trash2, Share2, Loader2, Repeat2, X, Send, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ImageCollage } from '@/components/community/ImageCollage';
import { ImageLightbox } from '@/components/community/ImageLightbox';
import { CommentsSection } from '@/components/comments-section';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────────────────────
export interface CommunityPost {
    id: string;
    userId: string;
    userName: string;
    userEmail?: string;
    locationName: string;
    textContent: string;
    imageUrls: string[];
    createdAt: string;
    loveCount: number;
    shareCount: number;
    isLikedByCurrentUser: boolean;
    commentCount?: number;
    homestayId?: string;
    homestayName?: string;
    originalPost?: CommunityPost;
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
    /** Show edit/delete controls (only on main feed where callbacks are available) */
    onUpdate?: (p: CommunityPost) => void;
    onDelete?: (id: string) => void;
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
    const [liked, setLiked] = useState<boolean>(Boolean(initialLiked));
    const [count, setCount] = useState<number>(Number(initialCount) || 0);
    const [popping, setPopping] = useState(false);

    const toggle = async () => {
        if (!isAuthenticated) { toast.error('Sign in to love this story'); return; }
        setPopping(true);
        setTimeout(() => setPopping(false), 420);
        try {
            const res = await api.post(`/api/posts/${postId}/like`);
            setCount(res.data.loveCount);
            setLiked(res.data.isLiked);
            if (onLikeToggle) {
                onLikeToggle(res.data.loveCount, res.data.isLiked);
            }
        } catch (error) {
            console.error("Failed to action post", error);
        }
    };

    return (
        <button
            data-testid="like-btn"
            onClick={toggle}
            className={cn('flex-1 flex justify-center items-center gap-2 rounded-lg transition-transform duration-200 active:scale-75 text-sm font-semibold group cursor-pointer min-h-10',
                (liked || count > 0) ? 'text-red-500 hover:bg-red-50' :
                    darkMode ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}
            aria-label={liked ? 'Unlike post' : 'Like post'}
        >
            <Heart className={cn('w-5 h-5 transition-all duration-200',
                popping ? 'scale-125 bounce-pop' : '',
                (liked || count > 0) ? 'fill-red-500 stroke-red-500 animate-in zoom-in-75 duration-300' :
                    darkMode ? 'stroke-white' : 'stroke-gray-500 group-hover:stroke-gray-700')} />
            <span>{Number(count) || 0}</span>
        </button>
    );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
export function PostCard({ post, onUpdate, onDelete, currentUser, onRepost, isQuoted = false, onOpenComments, onNewPost }: PostCardProps) {
    const authorName = post.userName || 'Traveller';
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const isOwner = currentUser?.id === post.userId || currentUser?.role === 'ROLE_ADMIN';
    const [isEditing, setIsEditing] = useState(false);
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
        const url = `${window.location.origin}/community/post/${post.id}`;
        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title: `${authorName}'s story`, text: post.textContent?.slice(0, 100), url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('Link copied to clipboard!');
            }
            await api.post(`/api/posts/${post.id}/share`);
            setShareCount(c => c + 1);
        } catch (err: any) {
            // AbortError = user cancelled share dialog, not a true error
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
        'bg-white border rounded-xl overflow-hidden transition-all duration-300',
        isQuoted ? "border-gray-200 mt-3 hover:bg-gray-50/50" : "border-gray-200 mb-4 shadow-sm hover:shadow-md",
    );

    const content = (
        <motion.article
            data-testid={isQuoted ? "quoted-post-card" : "post-card"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!isQuoted ? { whileHover: { y: -3, scale: 1.005 }, transition: { type: 'spring', stiffness: 400, damping: 30 } } : {})}
            className={articleClassName}
        >

            {/* Dynamic Image Collage */}
            {post.imageUrls?.length > 0 && (
                <div className="relative z-10">
                    <ImageCollage images={post.imageUrls} onImageClick={(i) => setLightboxIndex(i)} />
                </div>
            )}

            <div className={cn("p-4 relative z-10 pointer-events-none", isQuoted && "p-3")}>
                {/* Header Sequence */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold flex-none shadow-sm">
                            {initials}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-sm text-gray-900 hover:underline cursor-pointer pointer-events-auto leading-tight">{authorName}</span>
                            <span className="text-xs text-gray-500 leading-tight flex items-center gap-1 mt-0.5">
                                {formatRelative(post.createdAt)} • <MapPin className="w-3 h-3 inline-block" /> {post.locationName}
                            </span>

                            {/* Homestay Tag Mini-Pill */}
                            {post.homestayId && post.homestayName && (
                                <div className="mt-1.5 pointer-events-auto">
                                    <Link href={`/homestays/${post.homestayId}`} className="inline-flex items-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 text-[11px] py-0.5 px-2 rounded-full font-semibold transition-colors border border-green-100">
                                        <MapPin className="w-3 h-3" />
                                        Linked to: {post.homestayName}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Edit/Delete dropdown */}
                    {isOwner && onDelete && onUpdate && (
                        <div className="pointer-events-auto">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button data-testid="post-options-btn" className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors flex justify-center items-center">
                                        <MoreHorizontal className="w-5 h-5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 rounded-xl font-medium border-gray-200">
                                    <DropdownMenuItem data-testid="edit-post-btn" onClick={() => setIsEditing(true)}>
                                        <Pencil className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem data-testid="delete-post-btn" className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onDelete(post.id)}>
                                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                <p className={cn("text-sm text-gray-900 leading-relaxed whitespace-pre-line mb-3 font-normal", isQuoted && "text-xs")}>{post.textContent}</p>

                {/* Recursive Nested Repost */}
                {post.originalPost && (
                    <div className="mb-3 mt-2 rounded-lg border border-gray-300 bg-gray-50 pointer-events-auto overflow-hidden">
                        <PostCard
                            post={post.originalPost}
                            isQuoted={true}
                            currentUser={currentUser}
                        />
                    </div>
                )}
            </div>

            {/* ── Premium Action Bar (Hidden if quoting) ── */}
            {!isQuoted && (() => {
                const commentCount = Math.max(0, Number(post.commentCount) || 0);
                const safeShareCount = Math.max(0, Number(shareCount) || 0);
                const hasComments = commentCount > 0;
                const hasShares = safeShareCount > 0;

                return (
                    <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 pointer-events-auto bg-white relative z-10">
                        {/* Like — instantly dispatches update to global state array on success */}
                        <LikeButton
                            postId={post.id}
                            initialLiked={post.isLikedByCurrentUser}
                            initialCount={Math.max(0, Number(post.loveCount) || 0)}
                            onLikeToggle={(newLoveCount, newIsLiked) => {
                                if (onUpdate) {
                                    onUpdate({ ...post, loveCount: newLoveCount, isLikedByCurrentUser: newIsLiked });
                                }
                            }}
                        />

                        {/* Comment — dynamic fill when comments exist */}
                        <button
                            data-testid="comment-btn"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenComments?.(post.id); }}
                            className={cn(
                                'flex-1 flex justify-center items-center gap-2 min-h-10 rounded-lg transition-transform duration-200 active:scale-75 text-sm font-semibold group cursor-pointer',
                                hasComments ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <MessageCircle className={cn('w-5 h-5 transition-all duration-200', hasComments && 'fill-green-600 stroke-green-600 scale-110')} />
                            <span>{Number(post.commentCount) || 0}</span>
                        </button>

                        {/* Repost — green tint when post has original */}
                        <button
                            data-testid="repost-btn"
                            onClick={handleRepost}
                            className={cn(
                                'flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg transition-all duration-200 active:scale-95 text-sm font-semibold group',
                                post.originalPost ? 'text-green-600 hover:bg-green-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            )}
                            aria-label="Repost"
                        >
                            <Repeat2 className={cn('w-5 h-5 transition-all duration-200', post.originalPost && 'text-green-600')} />
                        </button>

                        {/* Share — purple accent when shared */}
                        <button
                            data-testid="share-btn"
                            onClick={handleShare}
                            className={cn(
                                'flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg transition-all duration-200 active:scale-95 text-sm font-semibold group',
                                hasShares ? 'text-violet-600 hover:bg-violet-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            )}
                            aria-label="Share post"
                        >
                            <Share2 className={cn('w-5 h-5 transition-all duration-200', hasShares && 'text-violet-600')} />
                            <span>{safeShareCount}</span>
                        </button>
                    </div>
                );
            })()}

            {/* Lightbox */}
            {lightboxIndex !== null && post.imageUrls && post.imageUrls.length > 0 && (
                <ImageLightbox
                    images={post.imageUrls}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxIndex(null)}
                />
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
            let imageUrls: string[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(f => form.append('files', f.file));
                const up = await api.post('/api/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
                imageUrls = up.data;
            }
            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                imageUrls,
                repostedFromPostId: quote.id,
            };
            if (selectedHomestay) payload.homestayId = selectedHomestay;
            const res = await api.post('/api/posts', payload);
            toast.success('Reposted!');
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
                                    <img src={f.previewUrl} alt="preview" className="w-full h-full object-cover" />
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

