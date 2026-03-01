'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, X, Pencil, Search, Loader2, Scissors, Share2, MapPin } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { SharedPageBanner } from '@/components/shared-page-banner';
import dynamic from 'next/dynamic';
const ImageCropModal = dynamic(() => import('@/components/host/ImageCropModal').then(m => m.ImageCropModal), { ssr: false });
import { StagedFile } from '@/components/host/ImageDropzone';
import { PostCard, CommunityPost } from '@/components/community/PostCard';
import { PostSkeleton } from '@/components/community/PostSkeleton';
import { CommentsSection } from '@/components/comments-section';
import { CustomCombobox } from '@/components/ui/combobox';
import { FilterMatrix } from '@/components/ui/filter-matrix';
import api from '@/lib/api';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { OptimizedImage } from '@/components/ui/optimized-image';

type Post = CommunityPost;

interface HomestayOption { id: string; name: string; address?: string; }

const VIBE_TAGS = [
    { label: '❓ Question', value: 'Question' },
    { label: '📝 Trip Report', value: 'Trip Report' },
    { label: '⭐ Review', value: 'Review' },
    { label: '⚠️ Alert', value: 'Alert' },
    { label: '✨ Hidden Gem', value: 'Hidden Gem' },
    { label: '🏔️ Offbeat', value: 'Offbeat' },
    { label: '🚗 Transport', value: 'Transport' },
] as const;

// ── Post Composer Inline ───────────────────────────────────────
interface RepostTarget { id: string; authorName: string; textContent: string; }
function PostComposerInline({ postData, repostTarget, onSuccess, onCancel }: { postData?: Post; repostTarget?: RepostTarget; onSuccess: (post: Post) => void; onCancel: () => void; }) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [text, setText] = useState(postData?.textContent || '');
    const [location, setLocation] = useState(postData?.locationName || '');
    const [submitting, setSubmitting] = useState(false);
    const [existingMedia, setExistingMedia] = useState<{ url: string; fileId?: string }[]>(postData?.media || []);
    const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
    const [cropModal, setCropModal] = useState<{ isOpen: boolean; imageIdx: number | null }>({
        isOpen: false,
        imageIdx: null,
    });
    const fileRef = useRef<HTMLInputElement>(null);
    const [homestays, setHomestays] = useState<HomestayOption[]>([]);
    const [selectedHomestay, setSelectedHomestay] = useState(postData?.homestayId || '');
    const [selectedTags, setSelectedTags] = useState<string[]>(postData?.tags || []);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : prev.length < 3 ? [...prev, tag] : prev
        );
    };

    useEffect(() => {
        if (postData) {
            setText(postData.textContent || '');
            setLocation(postData.locationName || '');
            setExistingMedia(postData.media || []);
            setSelectedHomestay(postData.homestayId || '');
        }
    }, [postData]);

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

    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0) {
            setError("Please add some text or a photo to share.");
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            let uploadedMedia: { url: string; fileId?: string }[] = [];
            if (stagedFiles.length > 0) {
                const form = new FormData();
                stagedFiles.forEach(staged => form.append('files', staged.file));
                const upres = await api.post('/api/upload', form);
                uploadedMedia = upres.data;
            }

            const payload: any = {
                textContent: text,
                locationName: location || 'North Bengal',
                media: [...existingMedia, ...uploadedMedia],
                tags: selectedTags.length > 0 ? selectedTags : undefined,
            };

            if (selectedHomestay) {
                payload.homestayId = selectedHomestay;
            }
            if (repostTarget) {
                payload.repostedFromPostId = repostTarget.id;
            }

            const formData = new FormData();
            formData.append('request', new Blob([JSON.stringify(payload)], { type: "application/json" }));
            // We NO LONGER append `files` directly to `/api/posts`, as they are now securely uploaded via `/api/upload`

            toast.info(postData ? "Updating story..." : "Sharing story...");
            const endpoint = postData ? `/api/posts/${postData.id}` : '/api/posts';
            const res = postData
                ? await api.put(endpoint, formData)
                : await api.post(endpoint, formData);

            // Optimistically update React Query cache to instantly render the post + images!
            if (!postData) {
                queryClient.setQueryData(['community-posts'], (old: any) => {
                    if (!old || !old.pages) return old;
                    const newPages = [...old.pages];
                    if (newPages.length > 0) {
                        newPages[0] = {
                            ...newPages[0],
                            content: [res.data, ...(newPages[0].content || [])]
                        };
                    }
                    return { ...old, pages: newPages };
                });
            } else {
                queryClient.setQueryData(['community-posts'], (old: any) => {
                    if (!old || !old.pages) return old;
                    const newPages = old.pages.map((page: any) => ({
                        ...page,
                        content: (page.content || []).map((p: any) => p.id === postData.id ? res.data : p)
                    }));
                    return { ...old, pages: newPages };
                });
            }

            // Invalidate to ensure background sync
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            if (postData) {
                queryClient.invalidateQueries({ queryKey: ['post', postData.id] });
            }

            onSuccess(res.data);
            stagedFiles.forEach(f => URL.revokeObjectURL(f.previewUrl));
        } catch (err: any) {
            console.error('Post failed', err);
            toast.error(err.response?.data?.message || "Failed to share story.");
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
                <div className="flex-none pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-4 pb-4 px-4 flex justify-between items-center border-b border-gray-200 bg-white">
                    <h2 className="text-lg font-bold text-gray-800">
                        {postData ? 'Edit Your Story' : repostTarget ? 'Repost Story' : 'Share Your Journey'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0"
                        aria-label="Close"
                    >
                        <X size={20} className="text-gray-600" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-4">
                    {repostTarget && (
                        <div className="border border-green-300 rounded-xl p-4 bg-green-50">
                            <p className="text-[11px] font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Share2 className="w-3.5 h-3.5" /> Reposting {repostTarget.authorName}&apos;s story
                            </p>
                            <p className="text-sm text-gray-700 line-clamp-3">{repostTarget.textContent}</p>
                        </div>
                    )}

                    <Textarea
                        data-testid="post-textarea"
                        value={text}
                        onChange={e => {
                            setText(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder={repostTarget ? 'Add your thoughts...' : "What's the atmosphere like? Tell the community..."}
                        className="w-full h-32 md:h-40 p-4 bg-gray-50 border border-gray-200 rounded-xl shadow-inner focus:bg-white focus:ring-2 focus:ring-green-500/40 focus:border-transparent resize-none text-base font-medium text-gray-900 placeholder-gray-400 transition-all duration-200"
                        error={error}
                    />

                    {(stagedFiles.length > 0 || existingMedia.length > 0) && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-xl border border-dashed border-gray-300">
                            {existingMedia.map((mediaObj, i) => (
                                <div key={`ex-${i}`} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-gray-200">
                                    <OptimizedImage src={mediaObj.url} alt="existing" className="w-full h-full object-cover" width={200} />
                                    <button onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <X className="w-6 h-6 text-white" />
                                    </button>
                                </div>
                            ))}
                            {stagedFiles.map((staged, i) => (
                                <div key={staged.id} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm border-2 border-green-500/20 bg-gray-200">
                                    <OptimizedImage src={staged.previewUrl} alt="preview" className="w-full h-full object-cover" width={200} />
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

                    <div className="flex items-center gap-3">
                        <input data-testid="image-upload-input" ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        <button data-testid="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={submitting}
                            className="flex-1 flex justify-center items-center gap-2 border border-gray-200 rounded-xl py-2.5 bg-white text-blue-600 text-sm font-semibold hover:bg-gray-50 shadow-sm transition-colors" title="Add Photos">
                            <ImageIcon className="w-4 h-4" />
                            <span>Photo</span>
                        </button>
                        <div className="flex-1 relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-rose-500" />
                            <input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="Location..."
                                className="w-full border border-gray-200 bg-white text-rose-700 placeholder-rose-400 rounded-xl pl-9 pr-3 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-200 focus:border-transparent focus:outline-none shadow-sm transition-all"
                            />
                        </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <CustomCombobox
                            options={homestays}
                            value={selectedHomestay}
                            onChange={setSelectedHomestay}
                            placeholder="Tag Homestay"
                        />
                    </div>

                    {/* ── Vibe Tag Badge Grid ── */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Vibe Tags {selectedTags.length > 0 && <span className="text-green-600">({selectedTags.length}/3)</span>}</p>
                        <div className="flex flex-wrap gap-2">
                            {VIBE_TAGS.map(tag => {
                                const isSelected = selectedTags.includes(tag.value);
                                const isDisabled = !isSelected && selectedTags.length >= 3;
                                return (
                                    <button
                                        key={tag.value}
                                        type="button"
                                        onClick={() => toggleTag(tag.value)}
                                        disabled={isDisabled}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 select-none',
                                            isSelected
                                                ? 'bg-[#004d00] text-white border-[#004d00] shadow-md scale-105'
                                                : isDisabled
                                                    ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40 cursor-not-allowed'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:border-[#004d00]/40 hover:bg-green-50'
                                        )}
                                    >
                                        {tag.label}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedTags.length >= 3 && (
                            <p className="text-xs text-amber-600 mt-1.5 font-medium animate-in fade-in duration-300">Max 3 tags selected</p>
                        )}
                    </div>

                    <button data-testid="submit-post-btn" onClick={handleSubmit} disabled={submitting || (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0)}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-md active:scale-[0.98] disabled:opacity-50 transition-all text-base mt-1">
                        {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting ? 'Sharing...' : (postData ? 'Update' : repostTarget ? 'Repost' : 'Post')}
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}

const CommunityFeedSkeleton = () => (
    <div className="min-h-screen bg-background">
        <SharedPageBanner
            title="Community"
            subtitle="Stories, tips, and incredible moments from North Bengal travellers."
        />
        <div className="container mx-auto max-w-2xl px-4 py-8 space-y-8">
            <div className="space-y-4">
                {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
            </div>
        </div>
    </div>
);

// ── Main Feed Page ─────────────────────────────────────────────
export default function CommunityPage() {
    const { isAuthenticated, user } = useAuth() as any;
    const queryClient = useQueryClient();
    const [composerOpen, setComposerOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState<Post | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const { ref, inView } = useInView({ threshold: 0.1 });

    const fetchPosts = async ({ pageParam = 0 }) => {
        const validPage = Number.isInteger(pageParam) ? pageParam : 0;
        const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : '';
        const { data } = await api.get(`/api/posts?page=${validPage}&size=10&sort=createdAt,desc${tagParam}`);
        return data;
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isPending,
        isError
    } = useInfiniteQuery({
        queryKey: ['community-posts', activeTag],
        queryFn: fetchPosts,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            // 1. Guard against empty/malformed responses
            if (!lastPage || !lastPage.page) return undefined;

            const currentPage = lastPage.page.number;
            const totalPages = lastPage.page.totalPages;

            // 2. Strict type check to prevent NaN propagation
            if (typeof currentPage !== 'number' || typeof totalPages !== 'number') {
                console.error("Pagination data is not a number", lastPage.page);
                return undefined;
            }

            // 3. Check if we reached the end
            if (currentPage + 1 >= totalPages) {
                return undefined; // Stops React Query from fetching more
            }

            // 4. Safely return the next integer
            return currentPage + 1;
        },
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage && !searchQuery) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery]);

    if (isPending) {
        return <CommunityFeedSkeleton />;
    }

    if (isError) {
        return <div className="text-center py-20 text-red-500">Failed to load feed. Please try again.</div>;
    }

    const handleNewPost = () => {
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        setComposerOpen(false);
        setPostToEdit(null);
        toast.success('Story shared!');
    };

    const handleUpdatePost = () => {
        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
        setComposerOpen(false);
        setPostToEdit(null);
        toast.success('Post updated!');
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;
        try {
            await api.delete(`/api/posts/${id}`);
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            toast.success('Story deleted');
        } catch (err) {
            toast.error('Failed to delete story');
        }
    };

    const posts = data?.pages?.flatMap(page => page.content || page.data || []) || [];

    const filteredPosts = posts.filter(p =>
        !searchQuery ||
        p.textContent.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.author?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <SharedPageBanner
                title="Community"
                subtitle="Stories, tips, and incredible moments from North Bengal travellers."
            />

            <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">
                {/* ── Tag Filter Matrix ── */}
                <FilterMatrix
                    options={[
                        { label: '🌟 All', value: null },
                        ...VIBE_TAGS.map(t => ({ label: t.label, value: t.value })),
                    ]}
                    activeValue={activeTag}
                    onChange={setActiveTag}
                />

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
                        <PostCard
                            key={post.id}
                            post={post}
                            currentUser={user}
                            onEdit={(p) => { setPostToEdit(p); setComposerOpen(true); }}
                            onUpdate={handleUpdatePost}
                            onDelete={handleDeletePost}
                            onOpenComments={(postId) => setActiveCommentPostId(postId)}
                        />
                    ))}
                </AnimatePresence>

                {filteredPosts.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <div className="text-4xl mb-4">🍃</div>
                        <p className="font-medium text-lg">No stories found.</p>
                    </div>
                )}

                {isFetchingNextPage && (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <PostSkeleton key={i} />)}
                    </div>
                )}

                <div ref={ref} className="h-4" />
                {!hasNextPage && filteredPosts.length > 0 && !searchQuery && (
                    <p className="text-center text-muted-foreground text-[15px] py-4 font-semibold tracking-wide uppercase opacity-70">
                        You&apos;ve seen it all! 🌿
                    </p>
                )}
            </div>

            <AnimatePresence>
                {isAuthenticated && !composerOpen && (
                    <motion.button data-testid="fab-add-post" key="fab" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { setPostToEdit(null); setComposerOpen(true); }}
                        className="fixed bottom-24 right-5 sm:bottom-10 sm:right-10 w-16 h-16 rounded-full bg-green-600 focus:ring-4 focus:ring-green-600/30 text-white shadow-xl shadow-green-900/20 flex items-center justify-center hover:bg-green-700 transition-all z-40"
                        aria-label="Write a Story">
                        <Pencil className="w-6 h-6" />
                    </motion.button>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {composerOpen && (
                    <PostComposerInline
                        postData={postToEdit || undefined}
                        onSuccess={postToEdit ? handleUpdatePost : handleNewPost}
                        onCancel={() => { setComposerOpen(false); setPostToEdit(null); }}
                    />
                )}
            </AnimatePresence>

            {activeCommentPostId && (
                <CommentsSection
                    postId={activeCommentPostId}
                    hideTrigger={true}
                    externalOpen={true}
                    onExternalClose={() => setActiveCommentPostId(null)}
                    onCommentCountChange={(newTotal: number) => {
                        queryClient.invalidateQueries({ queryKey: ['community-posts'] });
                    }}
                    currentUserRole={user?.role}
                />
            )}
        </div>
    );
}
