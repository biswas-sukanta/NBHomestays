'use client';

import React, { useState } from 'react';
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
    isDetailView?: boolean;
    /** Callback to open composer in "Repost" mode */
    onRepost?: (quote: QuotePost) => void;
    /** Is this post being rendered as a quoted repost inside another post? */
    isQuoted?: boolean;
    /** Callback to open the global comment drawer */
    onOpenComments?: (postId: string) => void;
}

// ── LikeButton ────────────────────────────────────────────────────────────────
function LikeButton({ postId, initialLiked, initialCount, darkMode }: { postId: string; initialLiked: boolean; initialCount: number; darkMode?: boolean }) {
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
        } catch (error) {
            console.error("Failed to action post", error);
        }
    };

    return (
        <button
            data-testid="like-btn"
            onClick={toggle}
            className={cn('flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg transition-colors duration-200 active:scale-95 text-sm font-semibold group',
                liked ? 'text-rose-600 hover:bg-rose-50' :
                    darkMode ? 'text-white hover:bg-white/10' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100')}
            aria-label={liked ? 'Unlike post' : 'Like post'}
        >
            <Heart className={cn('w-5 h-5 transition-all duration-200',
                liked ? 'fill-rose-600 stroke-rose-600' :
                    darkMode ? 'fill-transparent group-hover:stroke-white' : 'fill-transparent group-hover:stroke-gray-700', popping && 'scale-125')} />
            <span>{count}</span>
        </button>
    );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
export function PostCard({ post, onUpdate, onDelete, currentUser, isDetailView = false, onRepost, isQuoted = false, onOpenComments }: PostCardProps) {
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

    const articleClassName = cn(
        'bg-white border rounded-xl overflow-hidden transition-all duration-300',
        isQuoted ? "border-gray-200 mt-3 hover:bg-gray-50/50" : "border-gray-200 mb-4 shadow-sm hover:shadow-md",
        isDetailView && !isQuoted && "shadow-none border-t border-x-0 border-b-0 rounded-none mb-0"
    );

    const content = (
        <motion.article
            data-testid={isQuoted ? "quoted-post-card" : "post-card"}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!isDetailView && !isQuoted ? { whileHover: { y: -3, scale: 1.005 }, transition: { type: 'spring', stiffness: 400, damping: 30 } } : {})}
            className={articleClassName}
        >
            {/* Card-level link (feed only) */}
            {!isDetailView && (
                <Link href={`/community/post/${post.id}`} className="absolute inset-0 z-0" aria-label={`View post by ${authorName}`} />
            )}

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
                            isDetailView={true}
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
                        {/* Like — already state-aware internally */}
                        <LikeButton postId={post.id} initialLiked={post.isLikedByCurrentUser} initialCount={Math.max(0, Number(post.loveCount) || 0)} />

                        {/* Comment — blue fill when comments exist */}
                        <button
                            data-testid="comment-btn"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpenComments?.(post.id); }}
                            className={cn(
                                'flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg transition-all duration-200 active:scale-95 text-sm font-semibold group',
                                hasComments ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <MessageCircle className={cn('w-5 h-5 transition-all duration-200', hasComments && 'fill-blue-600/20 stroke-blue-600')} />
                            <span>{commentCount}</span>
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
                    footer={
                        <div className="w-full flex flex-col p-4 bg-gradient-to-t from-black via-black/80 to-transparent">
                            <div className="flex items-center gap-3 mb-4 px-2 pointer-events-none">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-green-500 to-green-700 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-none">
                                    {initials}
                                </div>
                                <span className="font-bold text-sm text-white drop-shadow-md">{authorName}</span>
                            </div>
                            <div className="flex items-center justify-between px-1 pt-2 border-t border-white/20 pointer-events-auto">
                                <LikeButton postId={post.id} initialLiked={post.isLikedByCurrentUser} initialCount={Math.max(0, Number(post.loveCount) || 0)} darkMode />
                                <Link onClick={e => e.stopPropagation()} href={`/community/post/${post.id}`} className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-white hover:bg-white/10 transition-colors active:scale-95 text-sm font-semibold">
                                    <MessageCircle className="w-5 h-5" /><span>{Math.max(0, Number(post.commentCount) || 0)}</span>
                                </Link>
                                {/* Repost */}
                                <button onClick={handleRepost} className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-white hover:bg-white/10 transition-colors active:scale-95 text-sm font-semibold" aria-label="Repost">
                                    <Repeat2 className="w-5 h-5" />
                                </button>
                                {/* Share */}
                                <button onClick={handleShare} className="flex-1 flex justify-center items-center gap-1.5 min-h-10 rounded-lg text-white hover:bg-white/10 transition-colors active:scale-95 text-sm font-semibold" aria-label="Share post">
                                    <Share2 className="w-5 h-5" /> <span>{Math.max(0, Number(shareCount) || 0)}</span>
                                </button>
                            </div>
                        </div>
                    }
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
                        onSuccess={() => setInternalRepostQuote(null)}
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

function InternalMiniRepostComposer({ quote, onSuccess, onCancel }: { quote: QuotePost; onSuccess: () => void; onCancel: () => void }) {
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
            await api.post('/api/posts', payload);
            toast.success('Reposted!');
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
            onSuccess();
        } catch {
            toast.error('Repost failed');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-[9999] flex flex-col md:items-center md:justify-center bg-white md:bg-black/40 md:backdrop-blur-sm"
        >
            <div className="hidden md:block absolute inset-0" onClick={onCancel} />
            <div className="relative z-10 bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-2xl flex flex-col h-[100dvh] md:h-auto md:max-h-[85vh] w-full md:max-w-lg overflow-hidden">
                {/* Tier 1: Header — shrink-0, border-b */}
                <div className="shrink-0 px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <p className="font-extrabold text-gray-900 text-lg flex items-center gap-2"><Repeat2 className="w-4 h-4 text-green-600" /> Repost Story</p>
                    <button onClick={onCancel} className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-all active:scale-95 shadow-sm"><X className="w-5 h-5" /></button>
                </div>

                {/* Tier 2: Body — flex-1 scrollable, min-h-0 */}
                <div className="flex-1 overflow-y-auto px-5 py-5 overscroll-contain min-h-0 flex flex-col gap-4">
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
                        className="flex-1 min-h-[120px] w-full text-base font-medium text-gray-900 placeholder:text-gray-400 resize-none focus:ring-0 focus:outline-none border border-gray-200 rounded-xl p-4 bg-gray-50 focus:bg-white focus:border-green-400 transition-all"
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
                </div>

                {/* Tier 3: Footer — shrink-0, anchored to bottom, 2-row layout */}
                <div className="shrink-0 px-5 py-4 border-t border-gray-100 bg-white flex flex-col gap-3 pb-[env(safe-area-inset-bottom,16px)]">
                    {/* Row 1: Tool buttons */}
                    <div className="flex items-center gap-2 overflow-x-auto">
                        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors shrink-0">
                            <ImageIcon className="w-4 h-4" /> Photo
                        </button>
                        <div className="relative shrink-0">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-rose-500" />
                            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location..." className="bg-rose-50 text-rose-700 placeholder-rose-400 border-none rounded-full pl-8 pr-3 py-2 text-sm font-semibold focus:ring-0 focus:outline-none w-[120px] transition-all" />
                        </div>
                    </div>

                    {/* Row 2: Tag + Submit */}
                    <div className="flex flex-col gap-2">
                        <div className="relative min-w-0">
                            <CustomCombobox options={homestays} value={selectedHomestay} onChange={setSelectedHomestay} placeholder="Tag Homestay" />
                        </div>
                        <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-green-600 text-white text-base font-bold hover:bg-green-700 transition-all disabled:opacity-50 active:scale-95 shadow-sm">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {submitting ? 'Posting...' : 'Repost'}
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

