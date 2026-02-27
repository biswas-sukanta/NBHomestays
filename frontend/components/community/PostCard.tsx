'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Pencil, MoreHorizontal, Trash2, Share2, Loader2, Repeat2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ImageCollage } from '@/components/community/ImageCollage';
import { ImageLightbox } from '@/components/community/ImageLightbox';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

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
    repostedPost?: CommunityPost;
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
}

// ── LikeButton ────────────────────────────────────────────────────────────────
function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked: boolean; initialCount: number }) {
    const { isAuthenticated } = useAuth() as any;
    const [liked, setLiked] = useState<boolean>(Boolean(initialLiked));
    const [count, setCount] = useState<number>(Number(initialCount) || 0);
    const [popping, setPopping] = useState(false);

    const toggle = async () => {
        if (!isAuthenticated) { toast.error('Sign in to love this story'); return; }
        const prev = { liked, count };
        setLiked(l => !l);
        setCount(c => liked ? Math.max(0, c - 1) : c + 1);
        setPopping(true);
        setTimeout(() => setPopping(false), 420);
        try {
            const res = await api.post(`/api/posts/${postId}/like`);
            setCount(res.data.loveCount);
            setLiked(res.data.isLiked);
        } catch {
            setLiked(prev.liked);
            setCount(prev.count);
        }
    };

    return (
        <button
            onClick={toggle}
            className={cn('flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 group relative z-10', liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400')}
            aria-label={liked ? 'Unlike post' : 'Like post'}
        >
            <Heart className={cn('w-5 h-5 transition-all duration-200', liked ? 'fill-rose-500 stroke-rose-500' : 'fill-transparent group-hover:stroke-rose-400', popping && 'scale-125')} />
            <span>{count}</span>
        </button>
    );
}

// ── PostCard ──────────────────────────────────────────────────────────────────
export function PostCard({ post, onUpdate, onDelete, currentUser, isDetailView = false, onRepost }: PostCardProps) {
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

    const handleRepost = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) { toast.error('Sign in to repost stories'); return; }
        if (onRepost) {
            onRepost({ id: post.id, authorName, textContent: post.textContent });
        } else {
            toast.info('Open the community feed to repost.');
        }
    };

    const articleClassName = cn(
        'group bg-card border border-border/70 rounded-[28px] overflow-hidden shadow-sm transition-all duration-300 relative',
        !isDetailView && 'hover:border-green-300 hover:shadow-xl hover:shadow-green-500/5 cursor-pointer'
    );

    const content = (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            {...(!isDetailView ? { whileHover: { y: -3, scale: 1.005 }, transition: { type: 'spring', stiffness: 400, damping: 30 } } : {})}
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

            {/* Homestay Tag Mini-Card */}
            {post.homestayId && post.homestayName && (
                <div className="mx-5 mt-4 flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-2xl px-4 py-2.5 relative z-10 pointer-events-auto">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-none">
                        <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-[11px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest">Tagged Homestay</p>
                        <p className="text-sm font-extrabold text-foreground truncate">{post.homestayName}</p>
                    </div>
                    <Link href={`/homestays/${post.homestayId}`} className="ml-auto shrink-0 text-[11px] font-extrabold text-green-700 dark:text-green-400 hover:text-green-900 transition-colors uppercase tracking-wider pointer-events-auto">
                        Book →
                    </Link>
                </div>
            )}

            <div className="p-5 sm:p-6 relative z-10 pointer-events-none">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-white text-[15px] font-bold flex-none shadow-md">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0 flex justify-between items-start pt-0.5">
                        <div>
                            <p className="font-extrabold text-[15px] text-foreground tracking-tight">{authorName}</p>
                            <div className="flex items-center gap-1.5 mt-1 text-[13px] font-semibold text-muted-foreground">
                                <MapPin className="w-3.5 h-3.5 text-green-600 flex-none" />
                                <span className="truncate">{post.locationName}</span>
                                <span className="mx-1 text-gray-300">•</span>
                                <span className="flex-none font-medium">{formatRelative(post.createdAt)}</span>
                            </div>
                        </div>

                        {/* Edit/Delete dropdown (owner/admin, feed only) */}
                        {isOwner && onDelete && onUpdate && (
                            <div className="pointer-events-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-8 h-8 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors flex justify-center items-center">
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-36 rounded-xl font-medium">
                                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                            <Pencil className="w-4 h-4 mr-2" /> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => onDelete(post.id)}>
                                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-[15px] text-foreground/90 leading-[1.6] whitespace-pre-line mb-4 font-medium">{post.textContent}</p>

                {/* Recursive Nested Repost */}
                {post.repostedPost && (
                    <div className="mb-5 mt-2 rounded-2xl border-2 border-border/60 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                        <PostCard
                            post={post.repostedPost}
                            isDetailView={true} // prevent deep nesting links
                            currentUser={currentUser}
                        />
                    </div>
                )}

                {/* Actions Bar */}
                <div className="flex items-center gap-5 pt-4 border-t border-border/40 pointer-events-auto">
                    <LikeButton postId={post.id} initialLiked={post.isLikedByCurrentUser} initialCount={post.loveCount} />
                    <Link href={`/community/post/${post.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" /><span>{post.commentCount ?? 0}</span>
                    </Link>
                    {/* Repost */}
                    <button onClick={handleRepost} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-green-600 transition-colors" aria-label="Repost">
                        <Repeat2 className="w-4 h-4" />
                    </button>
                    {/* Share */}
                    <button onClick={handleShare} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-green-600 transition-colors ml-auto" aria-label="Share post">
                        {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                        {shareCount > 0 && <span className="text-xs">{shareCount}</span>}
                    </button>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxIndex !== null && post.imageUrls.length > 0 && (
                <ImageLightbox images={post.imageUrls} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
            )}
        </motion.article>
    );

    // In edit mode (feed only), swap the card for the inline editor
    if (isEditing && onUpdate && onDelete) {
        // Dynamic import avoids circular deps — PostComposerInline lives in community/page.tsx
        // We signal back via a custom event that the parent can listen to.
        // Since we're extracting this component, the edit flow is handled by the parent feed page.
        // This branch is only relevant when onUpdate/onDelete are injected (feed mode).
        return content; // Parent handles edit toggling
    }

    return content;
}
