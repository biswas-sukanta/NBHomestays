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
import { PostCard } from '@/components/community/PostCard';
import { CommunityPost } from '@/components/community/types';
import { PostSkeleton } from '@/components/community/PostSkeleton';
import { CommentsSection } from '@/components/comments-section';
import { CustomCombobox } from '@/components/ui/combobox';
import { FilterMatrix } from '@/components/ui/filter-matrix';
import { postApi } from '@/lib/api/posts';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { CommunityHero } from '@/components/community/community-hero';
import { TrendingStories } from '@/components/community/trending-stories';
import { CommunitySidebar } from '@/components/community/sidebar';
import { CommunityPageSkeleton } from '@/components/community/Skeletons';
import { LoginPromptModal } from '@/components/community/LoginPromptModal';
import { normalizePost, NormalizedPost } from '@/lib/adapters/normalizePost';
import { useHomestaysLookup } from '@/hooks/useHomestaysLookup';

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
import { CreatePostModal } from '@/components/community/CreatePostModal';

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
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginAction, setLoginAction] = useState<'love' | 'comment' | 'repost' | 'share'>('share');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);

    const { ref, inView } = useInView({ threshold: 0.1 });

    const fetchPosts = async ({ pageParam = 0 }) => {
        const validPage = Number.isInteger(pageParam) ? pageParam : 0;
        const tagParam = activeTag ? `&tag=${encodeURIComponent(activeTag)}` : '';
        const { data } = await postApi.getFeed(`page=${validPage}&size=12&sort=createdAt,desc${tagParam}`);
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
            const { data } = await postApi.getFeed('page=0&size=3&sort=loveCount,desc');
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
        const previousFeed = queryClient.getQueryData(['community-posts', activeTag]);
        queryClient.setQueryData(['community-posts', activeTag], (old: any) => {
            if (!old || !old.pages) return old;
            return {
                ...old,
                pages: old.pages.map((page: any) => ({
                    ...page,
                    content: (page.content || []).filter((post: any) => post.id !== id)
                }))
            };
        });
        try {
            await postApi.delete(id);
            queryClient.invalidateQueries({ queryKey: ['community-posts'] });
            toast.success('Story deleted');
        } catch (err) {
            queryClient.setQueryData(['community-posts', activeTag], previousFeed);
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
            <CommunityHero onOpenComposer={() => {
                if (!isAuthenticated) {
                    setLoginAction('share');
                    setIsLoginModalOpen(true);
                    return;
                }
                setPostToEdit(null);
                setComposerOpen(true);
            }} />

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

            <LoginPromptModal
                isOpen={isLoginModalOpen}
                action={loginAction}
                onClose={() => setIsLoginModalOpen(false)}
            />

            <AnimatePresence>
                {composerOpen && (
                    <CreatePostModal
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
