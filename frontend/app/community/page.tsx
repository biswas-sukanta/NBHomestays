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
import { CustomCombobox } from '@/components/ui/combobox';
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
interface RepostTarget { id: string; authorName: string; textContent: string; }
function PostComposerInline({ postData, repostTarget, onSuccess, onCancel }: { postData?: Post; repostTarget?: RepostTarget; onSuccess: (post: Post) => void; onCancel: () => void; }) {
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
            if (repostTarget) {
                payload.repostedFromPostId = repostTarget.id;
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
        <div className="bg-white sm:rounded-2xl rounded-xl shadow-lg border border-gray-100 z-50 relative flex flex-col max-h-[100dvh] sm:max-h-[85vh]">
            {/* Header — shrink-0, always visible */}
            <div className="flex items-center justify-between p-6 pb-0 shrink-0">
                <h2 className="font-extrabold text-gray-900 tracking-tight text-xl">{postData ? 'Edit Your Story' : repostTarget ? 'Repost Story' : 'Share Your Journey'}</h2>
                <button onClick={onCancel} className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-all active:scale-95 shadow-sm"><X className="w-5 h-5" /></button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 pt-4 overscroll-contain">

                {/* Repost Quote Preview */}
                {repostTarget && (
                    <div className="border border-green-300 rounded-xl p-4 bg-green-50 mb-4">
                        <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                            <Share2 className="w-3.5 h-3.5" /> Reposting {repostTarget.authorName}&apos;s story
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-3">{repostTarget.textContent}</p>
                    </div>
                )}

                <textarea
                    data-testid="post-textarea"
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder={repostTarget ? 'Add your thoughts...' : "What's the atmosphere like? Tell the community..."}
                    rows={repostTarget ? 3 : 4}
                    className="w-full text-lg font-medium text-gray-900 placeholder-gray-500 resize-none focus:ring-0 focus:outline-none border-none p-0 mb-4 bg-transparent"
                />

                {/* Staging Area */}
                {(stagedFiles.length > 0 || existingUrls.length > 0) && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300 mb-4">
                        {existingUrls.map((url, i) => (
                            <div key={`ex-${i}`} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm">
                                <img src={url} alt="existing" className="w-full h-full object-cover" />
                                <button onClick={() => setExistingUrls(prev => prev.filter((_, idx) => idx !== i))}
                                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        ))}
                        {stagedFiles.map((staged, i) => (
                            <div key={staged.id} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border-2 border-green-500/20">
                                <img src={staged.previewUrl} alt="preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-all">
                                    <button onClick={() => setCropModal({ isOpen: true, imageIdx: i })} className="p-2 bg-white rounded-full text-gray-900 hover:scale-110 transition-transform"><Scissors className="w-4 h-4" /></button>
                                    <button onClick={() => removeStaged(staged.id)} className="p-2 bg-rose-500 rounded-full text-white hover:scale-110 transition-transform"><X className="w-4 h-4" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {cropModal.isOpen && cropModal.imageIdx !== null && (
                    <ImageCropModal
                        isOpen={cropModal.isOpen}
                        onClose={() => setCropModal({ isOpen: false, imageIdx: null })}
                        imageSrc={stagedFiles[cropModal.imageIdx].previewUrl}
                        onCropComplete={handleCropComplete}
                    />
                )}
            </div>{/* end scrollable content */}

            {/* Footer — shrink-0, always visible above keyboard */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 pt-4 border-t border-gray-100 shrink-0 bg-white">
                <div className="flex flex-wrap items-center gap-2">
                    <input data-testid="image-upload-input" ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                    <button data-testid="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={submitting}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors" title="Add Photos">
                        <ImageIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">Photo</span>
                    </button>

                    <div className="relative group">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                        <input
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="Location..."
                            className="bg-rose-50 text-rose-700 placeholder-rose-400 border-none rounded-full pl-9 pr-3 py-2 text-sm font-semibold focus:ring-0 focus:outline-none w-[130px] transition-all"
                        />
                    </div>

                    <div className="relative min-w-[160px] flex-1 sm:flex-none">
                        <CustomCombobox
                            options={homestays}
                            value={selectedHomestay}
                            onChange={setSelectedHomestay}
                            placeholder="Tag Homestay"
                        />
                    </div>
                </div>

                <button data-testid="submit-post-btn" onClick={handleSubmit} disabled={submitting || (!text.trim() && stagedFiles.length === 0 && existingUrls.length === 0)}
                    className="flex shrink-0 items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-full transition-transform active:scale-95 disabled:opacity-50 shadow-sm ml-auto">
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                    {submitting ? 'Sharing...' : (postData ? 'Update' : repostTarget ? 'Repost' : 'Post')}
                </button>
            </div>
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
                    <motion.button data-testid="fab-add-post" key="fab" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
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
                    <div className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-white md:bg-black/40 md:backdrop-blur-sm md:p-4">
                        <div className="hidden md:block absolute inset-0" onClick={() => setComposerOpen(false)} />
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative z-10 w-full md:max-w-lg h-[100dvh] md:h-auto md:max-h-[85vh] flex flex-col">
                            <PostComposerInline onSuccess={handleNewPost} onCancel={() => setComposerOpen(false)} />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
