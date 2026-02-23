'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, MapPin, Image as ImageIcon, Send, X, Pencil, MoreHorizontal, Trash2, Search, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { SharedPageBanner } from '@/components/shared-page-banner';

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
        <div className={cn('relative overflow-hidden bg-secondary/30', className)}>
            <img src={src} alt={alt} className={cn('absolute inset-0 w-full h-full object-cover scale-110 blur-xl filter transition-opacity duration-700', loaded ? 'opacity-0' : 'opacity-100')} aria-hidden="true" />
            <img src={src} alt={alt} onLoad={() => setLoaded(true)} className={cn('relative w-full h-full object-cover transition-opacity duration-700', loaded ? 'opacity-100' : 'opacity-0')} />
        </div>
    );
}

// ── Like Button ───────────────────────────────────────────────
function LikeButton({ postId, initialLiked, initialCount }: { postId: string; initialLiked: boolean; initialCount: number; }) {
    const { isAuthenticated } = useAuth() as any;
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
            const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
            await fetch(`${API}/api/posts/${postId}/like`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {} });
        } catch {
            setLiked(prev.liked); setCount(prev.count);
        }
    };

    return (
        <button onClick={toggle} className={cn('flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200 group relative z-10', liked ? 'text-rose-500' : 'text-muted-foreground hover:text-rose-400')} aria-label={liked ? 'Unlike post' : 'Like post'}>
            <Heart className={cn('w-5 h-5 transition-all duration-200', liked ? 'fill-rose-500 stroke-rose-500' : 'fill-transparent group-hover:stroke-rose-400', popping && 'animate-heart-pop')} />
            <span>{count}</span>
        </button>
    );
}

// ── Post Composer Inline ───────────────────────────────────────
function PostComposerInline({ postData, onSuccess, onCancel }: { postData?: Post; onSuccess: (post: Post) => void; onCancel: () => void; }) {
    const [text, setText] = useState(postData?.textContent || '');
    const [location, setLocation] = useState(postData?.locationName || '');
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(postData?.imageUrls || []);
    const fileRef = useRef<HTMLInputElement>(null);

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
            const url = postData ? `${API}/api/posts/${postData.id}` : `${API}/api/posts`;
            const method = postData ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ textContent: text, locationName: location || 'North Bengal', imageUrls }),
            });
            const newPost = await res.json();
            onSuccess(newPost);
        } catch (err) { console.error('Post failed', err); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="bg-card border border-border sm:rounded-2xl rounded-xl overflow-hidden shadow-2xl z-50">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h2 className="font-bold text-foreground">{postData ? 'Edit Story' : 'Share a Story'}</h2>
                <button onClick={onCancel} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder="Share your experience from North Bengal..." rows={4}
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
                <input value={location} onChange={e => setLocation(e.target.value)} placeholder="Location (e.g. Darjeeling, Sikkim...)"
                    className="w-full bg-secondary/40 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30" />

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
            <div className="flex items-center justify-between px-5 py-4 border-t border-border">
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    {uploading ? 'Uploading...' : 'Add Photos'}
                </button>
                <button onClick={handleSubmit} disabled={submitting || (!text.trim() && imageUrls.length === 0)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-[14px] font-bold tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? (postData ? 'Saving...' : 'Posting...') : (postData ? 'Save Changes' : 'Post')}
                </button>
            </div>
        </div>
    );
}

// ── Post Card ─────────────────────────────────────────────────
function PostCard({ post, user, onUpdate, onDelete }: { post: Post; user: any; onUpdate: (p: Post) => void; onDelete: (id: string) => void; }) {
    const authorName = [post.user?.firstName, post.user?.lastName].filter(Boolean).join(' ') || 'Traveller';
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const isOwner = user?.id === post.user?.id || user?.role === 'ROLE_ADMIN';
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="z-10 relative">
                <PostComposerInline postData={post} onSuccess={(p) => { onUpdate(p); setIsEditing(false); toast.success('Post updated!'); }} onCancel={() => setIsEditing(false)} />
            </motion.div>
        );
    }

    return (
        <motion.article
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3, scale: 1.005 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="group block bg-card border border-border/70 hover:border-green-300 rounded-[28px] overflow-hidden shadow-sm hover:shadow-xl hover:shadow-green-500/5 transition-all duration-300 relative"
        >
            <Link href={`/community/post/${post.id}`} className="absolute inset-0 z-0" aria-label={`View post by ${authorName}`} />

            {/* Edge-to-Edge Images */}
            {post.imageUrls?.length > 0 && (
                <div className={cn('grid gap-1 bg-secondary/20', post.imageUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2')}>
                    {post.imageUrls.slice(0, 4).map((url, i) => (
                        <BlurImage key={i} src={url} alt={`Post image ${i + 1}`}
                            className={cn(post.imageUrls.length === 1 ? 'h-80 sm:h-96' : 'h-48 sm:h-60', i === 0 && post.imageUrls.length >= 3 ? 'col-span-2 h-64 sm:h-80' : '')} />
                    ))}
                </div>
            )}

            <div className="p-5 sm:p-6 relative z-10 pointer-events-none">
                <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-green-400 to-green-600 flex items-center justify-center text-white text-[15px] font-bold flex-none shadow-md">
                        {post.user?.avatarUrl ? <img src={post.user.avatarUrl} alt={authorName} className="w-full h-full rounded-full object-cover" /> : initials}
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

                        {/* Actions (Owner/Admin) */}
                        {isOwner && (
                            <div className="pointer-events-auto">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button className="w-8 h-8 rounded-full hover:bg-secondary flexItemsCenter text-muted-foreground hover:text-foreground transition-colors flex justify-center items-center">
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
                <p className="text-[15px] text-foreground/90 leading-[1.6] whitespace-pre-line mb-5 font-medium">{post.textContent}</p>
                <div className="flex items-center gap-6 pt-4 border-t border-border/40 pointer-events-auto">
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
    const { isAuthenticated, user } = useAuth() as any;
    const [posts, setPosts] = useState<Post[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const [composerOpen, setComposerOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
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
            if (entry.isIntersecting && hasMore && !loading && !searchQuery) { const next = page + 1; setPage(next); fetchPosts(next); }
        }, { rootMargin: '200px' });
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, page, fetchPosts, searchQuery]);

    const handleNewPost = (post: Post) => {
        setPosts(prev => [post, ...prev]);
        setComposerOpen(false);
    };

    const handleUpdatePost = (updated: Post) => {
        setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;
        try {
            const token = localStorage.getItem('token');
            await fetch(`${API}/api/posts/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
            setPosts(prev => prev.filter(p => p.id !== id));
            toast.success('Story deleted');
        } catch (err) { toast.error('Failed to delete story'); }
    };

    const filteredPosts = posts.filter(p =>
        !searchQuery ||
        p.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        [p.user?.firstName, p.user?.lastName].join(' ').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            {/* Banner */}
            <SharedPageBanner
                title="Community"
                subtitle="Stories, tips, and incredible moments from North Bengal travellers."
            />

            {/* Feed Container */}
            <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">

                {/* Search & Actions Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                    <div className="relative w-full sm:max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                        <Input
                            placeholder="Search by location, content, or author..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-secondary/40 border-none rounded-2xl h-12 pl-11 shadow-sm focus-visible:ring-2 focus-visible:ring-green-500/50 text-[15px] font-medium"
                        />
                    </div>
                </div>

                <AnimatePresence>
                    {filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} user={user} onUpdate={handleUpdatePost} onDelete={handleDeletePost} />
                    ))}
                </AnimatePresence>

                {filteredPosts.length === 0 && !loading && (
                    <div className="text-center py-20 text-muted-foreground">
                        <div className="text-4xl mb-4">🍃</div>
                        <p className="font-medium text-lg">No stories found.</p>
                    </div>
                )}

                {loading && [1, 2].map(i => (
                    <div key={i} className="rounded-3xl overflow-hidden border border-border shadow-sm">
                        <div className="h-64 skeleton-shimmer" />
                        <div className="p-6 space-y-4">
                            <div className="flex gap-4">
                                <div className="w-11 h-11 rounded-full skeleton-shimmer flex-none" />
                                <div className="flex-1 space-y-2.5 pt-1"><div className="h-4 w-32 rounded skeleton-shimmer" /><div className="h-3 w-40 rounded skeleton-shimmer" /></div>
                            </div>
                            <div className="h-3.5 w-full rounded skeleton-shimmer" /><div className="h-3.5 w-5/6 rounded skeleton-shimmer" />
                        </div>
                    </div>
                ))}

                <div ref={observerRef} className="h-4" />
                {!hasMore && filteredPosts.length > 0 && !searchQuery && <p className="text-center text-muted-foreground text-[15px] py-4 font-semibold tracking-wide uppercase opacity-70">You&apos;ve seen it all! 🌿</p>}
            </div>

            {/* Floating Compose Button */}
            <AnimatePresence>
                {isAuthenticated && !composerOpen && (
                    <motion.button key="fab" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => setComposerOpen(true)}
                        className="fixed bottom-24 right-5 sm:bottom-10 sm:right-10 w-16 h-16 rounded-full bg-green-600 focus:ring-4 focus:ring-green-600/30 text-white shadow-xl shadow-green-900/20 flex items-center justify-center hover:bg-green-700 transition-all z-40"
                        aria-label="Write a Story">
                        <Pencil className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Composer Modal Background Overlay */}
            <AnimatePresence>
                {composerOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setComposerOpen(false)} />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative z-10 w-full max-w-lg">
                            <PostComposerInline onSuccess={handleNewPost} onCancel={() => setComposerOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
