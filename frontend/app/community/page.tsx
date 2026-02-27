'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, X, Pencil, Search, Loader2, Scissors, Share2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { SharedPageBanner } from '@/components/shared-page-banner';
import { ImageCropModal } from '@/components/host/ImageCropModal';
import { StagedFile } from '@/components/host/ImageDropzone';
import { PostCard, CommunityPost } from '@/components/community/PostCard';
import api from '@/lib/api';
import { MapPin } from 'lucide-react';

// Re-export for local use — the canonical definition lives in PostCard.tsx
type Post = CommunityPost;
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


// ── Post Composer Inline ───────────────────────────────────────
function PostComposerInline({ postData, onSuccess, onCancel }: { postData?: Post; onSuccess: (post: Post) => void; onCancel: () => void; }) {
    const [text, setText] = useState(postData?.textContent || '');
    const [location, setLocation] = useState(postData?.locationName || '');
    const [submitting, setSubmitting] = useState(false);
    const [existingUrls, setExistingUrls] = useState<string[]>(postData?.imageUrls || []);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageIdx: number | null }>({
        isOpen: false,
        imageIdx: null,
    });
    const fileRef = useRef<HTMLInputElement>(null);
    const [homestays, setHomestays] = useState<HomestayOption[]>([]);
    const [selectedHomestay, setSelectedHomestay] = useState(postData?.homestayId || '');

    useEffect(() => {
        api.get('/api/homestays')
            .then(res => setHomestays(res.data.content || res.data || []))
            .catch(err => console.error("Failed to fetch homestays for tagging:", err));
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        const newStaged = files.map(file => ({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        setStagedFiles(prev => [...prev, ...newStaged].slice(0, 10));
        if (fileRef.current) fileRef.current.value = '';
    };

    const removeStaged = (id: string) => {
        setStagedFiles(prev => {
            const f = prev.find(item => item.id === id);
            if (f) URL.revokeObjectURL(f.previewUrl);
            return prev.filter(item => item.id !== id);
        });
    };

    const handleCropComplete = (blob: Blob) => {
        if (cropModal.imageIdx === null) return;
        const idx = cropModal.imageIdx;
        const current = stagedFiles[idx];
        const newFile = new File([blob], current.file.name, { type: 'image/jpeg' });
        URL.revokeObjectURL(current.previewUrl);
        const newUrl = URL.createObjectURL(newFile);

        setStagedFiles(prev => {
            const next = [...prev];
            next[idx] = { ...next[idx], file: newFile, previewUrl: newUrl };
            return next;
        });
    };

    const handleSubmit = async () => {
        if (!text.trim() && stagedFiles.length === 0 && existingUrls.length === 0) return;
        setSubmitting(true);
        try {
            let finalImageUrls = [...existingUrls];

            // 1. Batch Upload Staged Files
            if (stagedFiles.length > 0) {
                const formData = new FormData();
                stagedFiles.forEach(staged => formData.append('files', staged.file));
                toast.info("Uploading images...");
                const uploadRes = await api.post('/api/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalImageUrls = [...finalImageUrls, ...uploadRes.data];
            }

            // 2. Submit Post
            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                imageUrls: finalImageUrls
            };
            if (selectedHomestay) {
                payload.homestayId = selectedHomestay;
            }

            const endpoint = postData ? `/api/posts/${postData.id}` : '/api/posts';
            const res = postData ? await api.put(endpoint, payload) : await api.post(endpoint, payload);

            onSuccess(res.data);
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
        } catch (err: any) {
            console.error('Post failed', err);
            toast.error(err.response?.data?.message || "Failed to share story.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-card border border-border sm:rounded-3xl rounded-2xl overflow-hidden shadow-2xl z-50">
            <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center shadow-lg shadow-green-600/20">
                        <ImageIcon className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="font-extrabold text-foreground tracking-tight">{postData ? 'Edit Your Story' : 'Share Your Journey'}</h2>
                </div>
                <button onClick={onCancel} className="w-9 h-9 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="px-6 py-6 space-y-6">
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="What's the atmosphere like? Tell the community..."
                    rows={4}
                    className="w-full bg-secondary/30 border border-border rounded-2xl px-5 py-4 text-[15px] font-medium text-foreground placeholder:text-muted-foreground/60 resize-none focus:outline-none focus:ring-4 focus:ring-green-600/10 focus:border-green-600/30 transition-all shadow-inner"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-green-600 transition-colors" />
                        <input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Location (e.g. Darjeeling, Sittong...)"
                            className="w-full bg-secondary/30 border border-border rounded-2xl pl-11 pr-5 py-3.5 text-[15px] font-bold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-4 focus:ring-green-600/10 focus:border-green-600/30 transition-all"
                        />
                    </div>
                    <div className="relative group">
                        <select
                            value={selectedHomestay}
                            onChange={e => setSelectedHomestay(e.target.value)}
                            className={cn(
                                "w-full bg-secondary/30 border border-border rounded-2xl px-5 py-3.5 text-[15px] font-bold appearance-none focus:outline-none focus:ring-4 focus:ring-green-600/10 focus:border-green-600/30 transition-all",
                                selectedHomestay ? "text-foreground" : "text-muted-foreground/60"
                            )}
                        >
                            <option value="">Tag a Homestay (Optional)</option>
                            {homestays.map(h => (
                                <option key={h.id} value={h.id}>{h.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-focus-within:text-green-600 transition-colors">
                            ▼
                        </div>
                    </div>
                </div>

                {/* Staging Area */}
                {(stagedFiles.length > 0 || existingUrls.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-muted/10 p-4 rounded-3xl border border-dashed border-border">
                        {existingUrls.map((url, i) => (
                            <div key={`ex-${i}`} className="relative aspect-square rounded-xl overflow-hidden group shadow-md">
                                <img src={url} alt="existing" className="w-full h-full object-cover" />
                                <button onClick={() => setExistingUrls(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all backdrop-blur-[2px]">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        ))}
                        {stagedFiles.map((staged, i) => (
                            <div key={staged.id} className="relative aspect-square rounded-xl overflow-hidden group shadow-md border-2 border-green-600/20">
                                <img src={staged.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all backdrop-blur-[2px]">
                                    <button onClick={() => setCropModal({ isOpen: true, imageIdx: i })} className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><Scissors className="w-4 h-4" /></button>
                                    <button onClick={() => removeStaged(staged.id)} className="p-2 bg-rose-500 rounded-full text-white hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between px-6 py-5 border-t border-border/50 bg-muted/10">
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                <button onClick={() => fileRef.current?.click()} disabled={submitting}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary text-secondary-foreground text-sm font-bold hover:bg-secondary/80 transition-all disabled:opacity-50 shadow-sm">
                    <ImageIcon className="w-4 h-4" />
                    Add Photos
                </button>
                <button onClick={handleSubmit} disabled={submitting || (!text.trim() && stagedFiles.length === 0 && existingUrls.length === 0)}
                    className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-green-600 text-white text-[15px] font-extrabold tracking-tight hover:bg-green-700 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-green-600/20">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    {submitting ? 'Sharing...' : (postData ? 'Update Story' : 'Share Story')}
                </button>
            </div>

            {cropModal.isOpen && cropModal.imageIdx !== null && (
                <ImageCropModal
                    isOpen={cropModal.isOpen}
                    onClose={() => setCropModal({ isOpen: false, imageIdx: null })}
                    imageSrc={stagedFiles[cropModal.imageIdx].previewUrl}
                    onCropComplete={handleCropComplete}
                />
            )}
        </div>
    );
}

// ── Feed PostCard Wrapper ──────────────────────────────────────
// Thin wrapper: handles the edit-mode toggle locally, then delegates to the universal PostCard.
function FeedPostCard({ post, user, onUpdate, onDelete }: { post: Post; user: any; onUpdate: (p: Post) => void; onDelete: (id: string) => void; }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="z-10 relative">
                <PostComposerInline
                    postData={post}
                    onSuccess={(p) => { onUpdate(p); setIsEditing(false); toast.success('Post updated!'); }}
                    onCancel={() => setIsEditing(false)}
                />
            </motion.div>
        );
    }

    return (
        <PostCard
            post={post}
            currentUser={user}
            onUpdate={onUpdate}
            onDelete={onDelete}
        />
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
        const previousPosts = [...posts];
        setPosts(prev => prev.filter(p => p.id !== id)); // Optimistic UI
        try {
            await api.delete(`/api/posts/${id}`);
            toast.success('Story deleted');
        } catch (err) {
            setPosts(previousPosts); // Revert on failure
            toast.error('Failed to delete story');
        }
    };

    const filteredPosts = posts.filter(p =>
        !searchQuery ||
        p.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.userName || '').toLowerCase().includes(searchQuery.toLowerCase())
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
                        <FeedPostCard key={post.id} post={post} user={user} onUpdate={handleUpdatePost} onDelete={handleDeletePost} />
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
