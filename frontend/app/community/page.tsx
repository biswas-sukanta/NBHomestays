'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Image as ImageIcon, Send, X, Pencil, Plus, Loader2 } from 'lucide-react';
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
interface HomestayOption { id: string; name: string; address?: string; }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// ── Helpers ───────────────────────────────────────────────────
function formatRelative(isoDate: string) {
    const diff = (Date.now() - new Date(isoDate).getTime()) / 1000;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// ── Blur-up Image ─────────────────────────────────────────────
function BlurImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = useState(false);
    return (
        <div className={cn('relative overflow-hidden', className)}>
            <img src={src} alt={alt} className={cn('absolute inset-0 w-full h-full object-cover scale-110 blur-xl filter transition-opacity duration-700', loaded ? 'opacity-0' : 'opacity-100')} aria-hidden="true" />
            <img src={src} alt={alt} onLoad={() => setLoaded(true)} className={cn('relative w-full h-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0')} />
        </div>
    );
}

// ── Like Button ───────────────────────────────────────────────
function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked: boolean; initialCount: number; }) {
    const { isAuthenticated, getToken } = useAuth() as any;
    const [liked, setLiked] = useState(initialLiked);
    const [count, setCount] = useState(initialCount);
    const [popping, setPopping] = useState(false);

    const toggle = async () => {
        if (!isAuthenticated) return;
        const prev = { liked, count };
        setLiked(!liked);
        setCount(c => liked ? c - 1 : c + 1);
        setPopping(true);
        setTimeout(() => setPopping(false), 420);
        try {
            const token = typeof getToken === 'function' ? getToken() : null;
            await fetch(`${API}/api/posts/${postId}/like`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        } catch {
            setLiked(prev.liked); setCount(prev.count);
        }
    };

    return (
        <button onClick={toggle} className={cn('flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 group', liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400')} aria-label={liked ? 'Unlike post' : 'Like post'}>
            <Heart className={cn('w-5 h-5 transition-all duration-200', liked ? 'fill-rose-500 stroke-rose-500' : 'fill-transparent group-hover:stroke-rose-400', popping && 'animate-heart-pop')} />
            <span>{count}</span>
        </button>
    );
}

// ── Post Composer Modal ───────────────────────────────────────
function PostComposer({ onSuccess, onClose }: { onSuccess: (post: Post) => void; onClose: () => void; }) {
    const [text, setText] = useState('');
    const [location, setLocation] = useState('');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>([]);
    const [homestaySearch, setHomestaySearch] = useState('');
    const [homestayOptions, setHomestayOptions] = useState<HomestayOption[]>([]);
    const [selectedHomestay, setSelectedHomestay] = useState<HomestayOption | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Homestay search autocomplete
    useEffect(() => {
        if (homestaySearch.length < 2) { setHomestayOptions([]); return; }
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(`${API}/api/homestays/search?q=${encodeURIComponent(homestaySearch)}`);
                const data = await res.json();
                setHomestayOptions(Array.isArray(data) ? data.slice(0, 5) : []);
            } catch { setHomestayOptions([]); }
        }, 300);
        return () => clearTimeout(timer);
    }, [homestaySearch]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const urls = await Promise.all(files.map(async (file) => {
                const form = new FormData();
                form.append('file', file);
                const res = await fetch(`${API}/api/upload`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
                const data = await res.json();
                return data.url as string;
            }));
            setImageUrls(prev => [...prev, ...urls.filter(Boolean)]);
        } catch (err) { console.error('Upload failed', err); }
        finally { setUploading(false); }
    };

    const handleSubmit = async () => {
        if (!text.trim() && imageUrls.length === 0) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API}/api/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ textContent: text, locationName: location || 'North Bengal', imageUrls, homestayId: selectedHomestay?.id }),
            });
            const newPost = await res.json();
            onSuccess(newPost);
            onClose();
        } catch (err) { console.error('Post failed', err); }
        finally { setSubmitting(false); }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <h2 className="font-bold text-foreground">Share a Story</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors" aria-label="Close"><X className="w-4 h-4" /></button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* Text */}
                    <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience from North Bengal..." rows={4}
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />

                    {/* Location */}
                    <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. Darjeeling, Sikkim...)"
                        className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />

                    {/* Tag Homestay */}
                    <div className="relative">
                        <input value={selectedHomestay ? selectedHomestay.name : homestaySearch}
                            onChange={e => { setSelectedHomestay(null); setHomestaySearch(e.target.value); }}
                            placeholder="Tag a Homestay (optional)"
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        {homestayOptions.length > 0 && !selectedHomestay && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl overflow-hidden shadow-lg z-10">
                                {homestayOptions.map(h => (
                                    <button key={h.id} onClick={() => { setSelectedHomestay(h); setHomestaySearch(''); setHomestayOptions([]); }}
                                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors">
                                        <span className="font-medium">{h.name}</span>
                                        {h.address && <span className="text-muted-foreground ml-2 text-xs">{h.address}</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Image Previews */}
                    {imageUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-1.5">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-lg overflow-hidden group">
                                    <img src={url} alt="preview" className="w-full h-full object-cover" />
                                    <button onClick={() => setImageUrls(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity" aria-label="Remove image">
                                        <X className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                    <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                    <button onClick={() => fileRef.current?.click()} disabled={uploading}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        {uploading ? 'Uploading...' : 'Add Photos'}
                    </button>
                    <button onClick={handleSubmit} disabled={submitting || (!text.trim() && imageUrls.length === 0)}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting ? 'Posting...' : 'Post'}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
    const authorName = [post.user?.firstName, post.user?.lastName].filter(Boolean).join(' ') || 'Traveller';
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    return (
        <motion.article initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
            {post.imageUrls?.length > 0 && (
                <div className={cn('grid gap-0.5', post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                    {post.imageUrls.slice(0, 4).map((url, i) => (
                        <BlurImage key={i} src={url} alt={`Post image ${i + 1}`}
                            className={cn(post.imageUrls.length === 1 ? 'h-72' : 'h-48', i === 0 && post.imageUrls.length >= 3 ? 'col-span-2 h-60' : '')} />
                    ))}
                </div>
            )}
            <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-none">
                        {post.user?.avatarUrl ? <img src={post.user.avatarUrl} alt={authorName} className="w-full h-full rounded-full object-cover" /> : initials}
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
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line mb-4">{post.textContent}</p>
                <div className="flex items-center gap-5 pt-2 border-t border-border/50">
                    <LikeButton postId={post.id} initialLiked={post.isLiked ?? false} initialCount={post.likeCount ?? 0} />
                    <Link href={`/community/post/${post.id}`} className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
                        <MessageCircle className="w-5 h-5" /><span>{post.commentCount ?? 0}</span>
                    </Link>
                </div>
            </div>
        </motion.article>
    );
}

// ── Main Feed Page ─────────────────────────────────────────────
export default function CommunityPage() {
    const { isAuthenticated } = useAuth() as any;
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
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
        } catch (e) { console.error('Failed to load posts', e); }
        finally { setLoading(false); }
    }, [loading, hasMore]);

    useEffect(() => { fetchPosts(0); }, []);

    useEffect(() => {
        const el = observerRef.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting && hasMore && !loading) { const next = page + 1; setPage(next); fetchPosts(next); }
        }, { rootMargin: '200px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, page, fetchPosts]);

    const handleNewPost = (post: Post) => {
        setPosts(prev => [post, ...prev]);
    };

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

                {loading && [1, 2, 3].map(i => (
                    <div key={i} className="rounded-2xl overflow-hidden border border-border">
                        <div className="h-56 skeleton-shimmer" />
                        <div className="p-4 space-y-3">
                            <div className="flex gap-3">
                                <div className="w-9 h-9 rounded-full skeleton-shimmer flex-none" />
                                <div className="flex-1 space-y-2"><div className="h-3 w-24 rounded skeleton-shimmer" /><div className="h-2 w-36 rounded skeleton-shimmer" /></div>
                            </div>
                            <div className="h-3 w-full rounded skeleton-shimmer" /><div className="h-3 w-2/3 rounded skeleton-shimmer" />
                        </div>
                    </div>
                ))}

                <div ref={observerRef} className="h-4" />
                {!hasMore && posts.length > 0 && <p className="text-center text-muted-foreground text-sm py-4">You've seen it all! 🌿</p>}
            </div>

            {/* Floating Compose Button — visible for authenticated users */}
            <AnimatePresence>
                {isAuthenticated && !composerOpen && (
                    <motion.button key="fab" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                        onClick={() => setComposerOpen(true)}
                        className="fixed bottom-24 right-5 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all z-40"
                        aria-label="Write a Story">
                        <Pencil className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Composer Modal */}
            <AnimatePresence>
                {composerOpen && (
                    <PostComposer onSuccess={handleNewPost} onClose={() => setComposerOpen(false)} />
                )}
            </AnimatePresence>
        </div>
    );
}
