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
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CommunityHero } from '@/components/community/community-hero';
import { TrendingStories } from '@/components/community/trending-stories';
import { CommunitySidebar } from '@/components/community/sidebar';
import { CommunityPageSkeleton } from '@/components/community/Skeletons';
import { normalizePost, NormalizedPost } from '@/lib/adapters/normalizePost';
type Post = NormalizedPost;

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
    const [text, setText] = useState(postData?.caption || '');
    const [location, setLocation] = useState(postData?.location || '');
    const [submitting, setSubmitting] = useState(false);
    const [existingMedia, setExistingMedia] = useState<{ url: string; fileId?: string }[]>(postData?.imageUrl ? [{ url: postData.imageUrl }] : []);
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
            setText(postData.caption || '');
            setLocation(postData.location || '');
            setExistingMedia(postData.imageUrl ? [{ url: postData.imageUrl }] : []);
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
                className="bg-zinc-950 w-full h-[100dvh] flex flex-col md:w-[620px] md:h-auto md:max-h-[90vh] md:rounded-3xl shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 border border-white/5 ring-1 ring-white/10"
            >
                <div className="flex-none pt-[max(1.5rem,env(safe-area-inset-top))] md:pt-7 pb-6 px-8 flex justify-between items-center border-b border-white/5 bg-zinc-950">
                    <h2 className="text-2xl md:text-3xl font-bold font-serif text-white tracking-tight">
                        {postData ? 'Edit Your Story' : repostTarget ? 'Repost Story' : 'Share Your Journey'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-3 bg-zinc-900 hover:bg-zinc-800 rounded-full transition-all flex-shrink-0 border border-white/10 shadow-xl group active:scale-90"
                        aria-label="Close"
                    >
                        <X size={20} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto p-8 flex flex-col gap-8 bg-zinc-950">
                    {repostTarget && (
                        <div className="border border-green-500/30 rounded-2xl p-5 bg-green-500/5 shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none" />
                            <p className="text-[10px] font-black text-green-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                <Share2 className="w-3.5 h-3.5" /> Reposting {repostTarget.authorName}&apos;s story
                            </p>
                            <p className="text-base font-serif text-zinc-200 line-clamp-3 italic leading-relaxed">&quot;{repostTarget.textContent}&quot;</p>
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
                        className="w-full h-40 md:h-56 p-6 bg-zinc-900/50 border border-white/10 rounded-3xl shadow-2xl focus:bg-zinc-900 focus:ring-4 focus:ring-green-500/20 focus:border-green-500/50 resize-none text-lg font-medium text-white placeholder-zinc-600 transition-all duration-300"
                        error={error}
                    />

                    {(stagedFiles.length > 0 || existingMedia.length > 0) && (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
                            {existingMedia.map((mediaObj, i) => (
                                <div key={`ex-${i}`} className="relative aspect-square rounded-2xl overflow-hidden group shadow-2xl bg-zinc-900 ring-1 ring-white/10">
                                    <OptimizedImage src={mediaObj.url} alt="existing" className="w-full h-full object-cover" width={200} />
                                    <button onClick={() => setExistingMedia(prev => prev.filter((_, idx) => idx !== i))}
                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <X className="w-7 h-7 text-white drop-shadow-2xl" />
                                    </button>
                                </div>
                            ))}
                            {stagedFiles.map((staged, i) => (
                                <div key={staged.id} className="relative aspect-square rounded-2xl overflow-hidden group shadow-2xl bg-zinc-900 ring-2 ring-green-500/40">
                                    <OptimizedImage src={staged.previewUrl} alt="preview" className="w-full h-full object-cover" width={200} />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all backdrop-blur-[2px]">
                                        <button onClick={() => setCropModal({ isOpen: true, imageIdx: i })} className="p-2.5 bg-white text-zinc-950 rounded-full hover:scale-110 transition-transform shadow-2xl"><Scissors className="w-4 h-4" /></button>
                                        <button onClick={() => removeStaged(staged.id)} className="p-2.5 bg-rose-500 text-white rounded-full hover:scale-110 transition-transform shadow-2xl"><X className="w-4 h-4" /></button>
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

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <input data-testid="image-upload-input" ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
                        <button data-testid="add-photo-btn" onClick={() => fileRef.current?.click()} disabled={submitting}
                            className="w-full sm:w-auto flex-1 flex justify-center items-center gap-2 border border-blue-500/30 rounded-2xl py-4 bg-blue-500/5 text-blue-400 text-sm font-black uppercase tracking-wider hover:bg-blue-500/10 hover:border-blue-500/50 shadow-2xl transition-all active:scale-95" title="Add Photos">
                            <ImageIcon className="w-5 h-5" />
                            <span>Add Visuals</span>
                        </button>
                        <div className="w-full sm:w-auto flex-[2] relative group">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500 group-focus-within:text-green-400 transition-colors" />
                            <input
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                placeholder="Where did this happen?"
                                className="w-full border border-white/10 bg-zinc-900/50 text-white placeholder-zinc-600 rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-4 focus:ring-green-500/10 focus:border-green-500/50 shadow-2xl transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="border border-white/10 rounded-2xl shadow-2xl overflow-hidden bg-zinc-900/50">
                        <CustomCombobox
                            options={homestays}
                            value={selectedHomestay}
                            onChange={setSelectedHomestay}
                            placeholder="Tag a specific Homestay..."
                        />
                    </div>

                    {/* ── Vibe Tag Badge Grid ── */}
                    <div className="pt-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Post Category {selectedTags.length > 0 && <span className="text-green-500">({selectedTags.length}/3)</span>}</p>
                        <div className="flex flex-wrap gap-2.5">
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
                                            'px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-all duration-300 select-none shadow-xl',
                                            isSelected
                                                ? 'bg-green-600 text-white border-green-500 shadow-[0_0_20px_rgba(22,163,74,0.3)] scale-[1.05]'
                                                : isDisabled
                                                    ? 'bg-zinc-900 text-zinc-700 border-white/5 opacity-50 cursor-not-allowed'
                                                    : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-white/20 hover:text-white hover:bg-zinc-800'
                                        )}
                                    >
                                        {tag.label}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedTags.length >= 3 && (
                            <p className="text-[10px] text-amber-500 mt-3 font-black uppercase tracking-widest animate-in fade-in duration-300">Maximum tags reached</p>
                        )}
                    </div>

                    <div className="pt-6 mt-auto">
                        <button data-testid="submit-post-btn" onClick={handleSubmit} disabled={submitting || (!text.trim() && stagedFiles.length === 0 && existingMedia.length === 0)}
                            className="w-full flex items-center justify-center gap-3 py-5 bg-white hover:bg-zinc-100 text-zinc-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:shadow-[0_25px_50px_rgba(255,255,255,0.15)] active:scale-[0.98] disabled:opacity-30 disabled:active:scale-100 transition-all text-sm">
                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {submitting ? 'Publishing...' : (postData ? 'Update Story' : repostTarget ? 'Publish Repost' : 'Publish Story')}
                        </button>
                    </div>
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
        const { data } = await api.get(`/api/posts?page=${validPage}&size=12&sort=createdAt,desc${tagParam}`);
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

    // Conditional infinite scroll: only auto-fire on mobile.
    // On desktop, we require the explicit Load More Stories button click.
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage && !searchQuery && isMobile) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, searchQuery, isMobile]);

    const { data: trendingData } = useQuery({
        queryKey: ['trending-posts'],
        queryFn: async () => {
            const { data } = await api.get('/api/posts?page=0&size=3&sort=loveCount,desc');
            return data; // Return full response to handle .content later
        }
    });

    if (isPending) {
        return <CommunityPageSkeleton />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 shadow-2xl">
                    <Loader2 className="w-8 h-8 text-zinc-500" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-tight">Connection hiccup</h2>
                <p className="text-zinc-500 mb-8 max-w-sm font-medium leading-relaxed">We couldn&apos;t reach the travelers&apos; network. Please check your connection and try again.</p>
                <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['community-posts'] })}
                    className="bg-white text-black hover:bg-zinc-100 rounded-full px-10 py-6 font-bold shadow-xl transition-all active:scale-95"
                >
                    Refresh Discovery
                </Button>
            </div>
        );
    }

    const { content: trendingContent = [] } = trendingData as any || {};
    const trendingPosts = (Array.isArray(trendingContent) ? trendingContent : []).map(normalizePost);
    console.log("Community Feed Data:", data);
    console.log("Trending Data:", trendingData);

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

    const normalizedPosts = posts.map(normalizePost);

    const filteredPosts = normalizedPosts.filter(p =>
        !searchQuery ||
        p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.authorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-green-500/30">
            {/* SEO Guard, Metadata hidden */}
            <CommunityHero onOpenComposer={() => { setPostToEdit(null); setComposerOpen(true); }} />

            {/* Trending Curated Grid */}
            {!searchQuery && !activeTag && trendingPosts.length > 0 && (
                <TrendingStories stories={trendingPosts} />
            )}

            <div className="container mx-auto px-4 lg:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">

                    {/* Left: Main Feed */}
                    <div className="w-full space-y-8">
                        {/* ── Top Bar Controls ── */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                            <h2 className="text-3xl font-bold font-serif text-white tracking-tight">Community Feed</h2>

                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <div className="relative w-full sm:w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-green-500 transition-colors" />
                                    <Input
                                        placeholder="Search stories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-zinc-900 border-none rounded-full h-11 pl-11 shadow-2xl ring-1 ring-white/10 focus-visible:ring-2 focus-visible:ring-green-500/50 text-sm font-medium text-white placeholder:text-zinc-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Tag Filter Matrix ── */}
                        <div className="mb-8">
                            <FilterMatrix
                                options={[
                                    { label: '🌟 All', value: null },
                                    ...VIBE_TAGS.map(t => ({ label: t.label, value: t.value })),
                                ]}
                                activeValue={activeTag}
                                onChange={setActiveTag}
                            />
                        </div>

                        {/* ── Feed Mapping ── */}
                        <AnimatePresence mode="popLayout">
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

                        {filteredPosts.length === 0 && !isFetchingNextPage && (
                            <div className="text-center py-24 bg-zinc-900/50 rounded-3xl border border-dashed border-white/10 shadow-2xl text-zinc-500 overflow-hidden relative isolate">
                                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent -z-10" />
                                <div className="text-6xl mb-6 opacity-30 animate-pulse">🍃</div>
                                <p className="font-bold text-2xl text-white mb-2 font-serif">Deep silence here...</p>
                                <p className="text-sm text-zinc-400 max-w-xs mx-auto">No stories found. Be the first to share a journey or try a different filter.</p>
                            </div>
                        )}

                        {isFetchingNextPage && (
                            <div className="space-y-6">
                                {[1, 2].map(i => <PostSkeleton key={i} />)}
                            </div>
                        )}

                        <div ref={ref} className="h-4" />

                        {/* ── Infinite Scroll / Load More Switch ── */}
                        {hasNextPage && !isFetchingNextPage && !isMobile && !searchQuery && (
                            <div className="pt-8 pb-12 flex justify-center">
                                <Button
                                    onClick={() => fetchNextPage()}
                                    size="lg"
                                    className="bg-zinc-900 text-white border border-white/10 hover:bg-zinc-800 hover:border-white/20 font-bold px-12 py-7 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95"
                                >
                                    Load More Stories
                                </Button>
                            </div>
                        )}

                        {/* End of Feed Sentinel */}
                        {!hasNextPage && filteredPosts.length > 0 && !searchQuery && (
                            <div className="py-16 border-t border-white/10 text-center opacity-50">
                                <p className="text-zinc-500 text-[10px] font-black tracking-[0.2em] uppercase">
                                    End of Discovery
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Sidebar Rail (Desktop Only) */}
                    <div className="relative">
                        <CommunitySidebar posts={normalizedPosts} />
                    </div>
                </div>
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
