'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Image as ImageIcon, Send, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ── Types ─────────────────────────────────────────────────────
interface Post {
    id: string;
    user: { id: string; firstName: string; lastName: string; avatarUrl?: string };
    locationName: string;
    textContent: string;
    imageUrls: string[];
    createdAt: string;
    likeCount?: number;
    commentCount?: number;
    isLiked?: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Helpers ───────────────────────────────────────────────────
function formatRelative(isoDate: string) {
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Blur-up Image Component ───────────────────────────────────
function BlurImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className={cn('relative overflow-hidden', className)}>
            {/* Blur placeholder */}
            <img
                src={src}
                alt={alt}
                className={cn('absolute inset-0 w-full h-full object-cover scale-110',
                    'blur-xl filter transition-opacity duration-700',
                    loaded ? 'opacity-0' : 'opacity-100'
                )}
                aria-hidden="true"
            />
            {/* Full quality */}
            <img
                src={src}
                alt={alt}
                onLoad={() => setLoaded(true)}
                className={cn('relative w-full h-full object-cover transition-opacity duration-700',
                    loaded ? 'opacity-100' : 'opacity-0'
                )}
            />
        </div>
    );
}

// ── Like Button ───────────────────────────────────────────────
function LikeButton({ postId, initialLiked, initialCount }: {
    postId: string; initialLiked: boolean; initialCount: number;
}) {
    const { isAuthenticated, getToken } = useAuth() as any;
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [popping, setPopping] = useState(false);

    const toggle = async () => {
        if (!isAuthenticated) return;
        const prev = { liked, count };
        // Optimistic update
        setLiked(!liked);
        setCount(c => liked ? c - 1 : c + 1);
        setPopping(true);
        setTimeout(() => setPopping(false), 420);
        try {
            const token = typeof getToken === 'function' ? getToken() : null;
            await fetch(`${API}/api/posts/${postId}/like`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
        } catch {
            // Rollback on failure
            setLiked(prev.liked);
            setCount(prev.count);
        }
    };

    return (
        <button
            onClick={toggle}
            className={cn(
                'flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 group',
                liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400'
            )}
            aria-label={liked ? 'Unlike post' : 'Like post'}
        >
            <Heart
                className={cn(
                    'w-5 h-5 transition-all duration-200',
                    liked ? 'fill-rose-500 stroke-rose-500' : 'fill-transparent group-hover:stroke-rose-400',
                    popping && 'animate-heart-pop'
                )}
            />
            <span>{count}</span>
        </button>
    );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
    const authorName = [post.user?.firstName, post.user?.lastName].filter(Boolean).join(' ') || 'Traveller';
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
        >
            {/* Images */}
            {post.imageUrls?.length > 0 && (
                <div className={cn(
                    'grid gap-0.5',
                    post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                )}>
                    {post.imageUrls.slice(0, 4).map((url, i) => (
                        <BlurImage
                            key={i}
                            src={url}
                            alt={`Post image ${i + 1}`}
                            className={cn(
                                post.imageUrls.length === 1 ? 'h-72' : 'h-48',
                                i === 0 && post.imageUrls.length >= 3 ? 'col-span-2 h-60' : ''
                            )}
                        />
                    ))}
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {/* Author row */}
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-none">
                        {post.user?.avatarUrl
                            ? <img src={post.user.avatarUrl} alt={authorName} className="w-full h-full rounded-full object-cover" />
                            : initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-none">{authorName}</p>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                            <MapPin className="w-3 h-3 flex-none" />
                            <span className="truncate">{post.locationName}</span>
                            <span className="mx-1">·</span>
                            <span className="flex-none">{formatRelative(post.createdAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Text */}
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-4">
                    {post.textContent}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-5 pt-2 border-t border-border/50">
                    <LikeButton
                        postId={post.id}
                        initialLiked={post.isLiked ?? false}
                        initialCount={post.likeCount ?? 0}
                    />
                    <Link href={`/community/post/${post.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.commentCount ?? 0}</span>
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}

// ── Main Feed Page ─────────────────────────────────────────────
export default function CommunityPage() {
    const { isAuthenticated, token } = useAuth() as any;
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observerRef = useRef<HTMLDivElement>(null);

    const fetchPosts = useCallback(async (pageNum: number) => {
        if (loading || !hasMore) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/posts?page=${pageNum}&size=10&sort=createdAt,desc`);
            const data = await res.json();
            const content: Post[] = data.content ?? data ?? [];
            setPosts(prev => pageNum === 0 ? content : [...prev, ...content]);
            setHasMore(content.length === 10);
        } catch (e) {
            console.error('Failed to load posts', e);
        } finally {
            setLoading(false);
        }
    }, [loading, hasMore]);

    // Initial load
    useEffect(() => { fetchPosts(0); }, []);

    // Infinite scroll sentinel
    useEffect(() => {
        const el = observerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && hasMore && !loading) {
                    const next = page + 1;
                    setPage(next);
                    fetchPosts(next);
                }
            },
            { rootMargin: '200px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, page, fetchPosts]);

    return (
        <div className="min-h-screen bg-background">
            {/* Banner */}
            <div className="bg-gradient-to-br from-[oklch(0.20_0.10_150)] to-[oklch(0.28_0.14_155)] py-10 px-4">
                <div className="container mx-auto max-w-2xl">
                    <h1 className="text-3xl font-extrabold text-white tracking-tight mb-1">Community</h1>
                    <p className="text-white/70 text-sm">Stories, tips, and moments from North Bengal travellers.</p>
                </div>
            </div>

            {/* Feed */}
            <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
                <AnimatePresence>
                    {posts.map(post => <PostCard key={post.id} post={post} />)}
                </AnimatePresence>

                {/* Skeleton loaders */}
                {loading && [1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-border">
                        <div className="h-56 skeleton-shimmer" />
                        <div className="p-4 space-y-3">
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full skeleton-shimmer flex-none" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-24 rounded skeleton-shimmer" />
                                    <div className="h-2 w-36 rounded skeleton-shimmer" />
                                </div>
                            </div>
                            <div className="h-3 w-full rounded skeleton-shimmer" />
                            <div className="h-3 w-2/3 rounded skeleton-shimmer" />
                        </div>
                    </div>
                ))}

                {/* Sentinel */}
                <div ref={observerRef} className="h-4" />

                {!hasMore && posts.length > 0 && (
                    <p className="text-center text-muted-foreground text-sm py-4">
                        You've seen it all! 🌿
                    </p>
                )}
            </div>
        </div>
    );
}
