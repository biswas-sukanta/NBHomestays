'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Send, X, Pencil, Search, Loader2, Scissors, Share2, MapPin, Trophy } from 'lucide-react';
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
import { PostCardUnified as PostCard } from '@/components/community/PostCardUnified';
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
import { EmptyFeedState } from '@/components/community/EmptyFeedState';
import { normalizePost, NormalizedPost } from '@/lib/adapters/normalizePost';
import { useHomestaysLookup } from '@/hooks/useHomestaysLookup';
import { queryKeys } from '@/lib/queryKeys';
import { getFeedVariant, resolveFeedLayout } from '@/lib/utils/feed-utils';
import { getFeed, getTrendingFeed, type FeedResponse } from '@/lib/api/feed';

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
    const viewerId = user?.id ?? null;
    const [composerOpen, setComposerOpen] = useState(false);
    const [postToEdit, setPostToEdit] = useState<Post | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginAction, setLoginAction] = useState<'love' | 'comment' | 'repost' | 'share'>('share');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [feedScope, setFeedScope] = useState<'latest' | 'following' | 'trending'>('latest');

    const { ref, inView } = useInView({ threshold: 0.1 });
    const activeFeedQueryKey = queryKeys.community.feed(activeTag || undefined, feedScope, viewerId);
    const communityFeedPrefix = ['community', 'posts'] as const;

    // Cursor-based pagination using FeedService API
    const fetchPosts = async ({ pageParam = null as string | null }) => {
        const response = await getFeed({ 
            cursor: pageParam || undefined, 
            tag: activeTag || undefined,
            scope: feedScope,
            limit: 12 
        });
        return response;
    };

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isPending,
        isError
    } = useInfiniteQuery({
        queryKey: activeFeedQueryKey,
        queryFn: fetchPosts,
        initialPageParam: null as string | null,
        getNextPageParam: (lastPage: FeedResponse) => {
            if (!lastPage || !lastPage.hasMore) return undefined;
            return lastPage.nextCursor;
        },
        staleTime: 10000, // 10 seconds — community data must be fresh
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
        queryKey: queryKeys.community.trending(viewerId),
        queryFn: async () => {
            const response = await getTrendingFeed({ limit: 3 });
            return response;
        },
        staleTime: 10000, // 10 seconds — trending must be fresh
    });

    if (isPending) {
        return <CommunityPageSkeleton />;
    }

    if (isError) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-6 shadow-lg">
                    <Loader2 className="w-8 h-8 text-neutral-400" />
                </div>
                <h2 className="text-3xl font-heading font-bold text-neutral-900 mb-2 tracking-tight">Connection hiccup</h2>
                <p className="text-neutral-500 mb-8 max-w-sm font-medium leading-relaxed">We couldn&apos;t reach the travelers&apos; network. Please check your connection and try again.</p>
                <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: communityFeedPrefix })}
                    className="bg-neutral-900 text-white hover:bg-neutral-800 rounded-full px-10 py-6 font-bold shadow-lg transition-all active:scale-95"
                >
                    Refresh Discovery
                </Button>
            </div>
        );
    }

    const trendingPosts = (trendingData?.posts || []).slice(0, 3).map(normalizePost);

    const handleNewPost = () => {
        queryClient.invalidateQueries({ queryKey: communityFeedPrefix });
        setComposerOpen(false);
        setPostToEdit(null);
        toast.success('Story shared!');
    };

    const handleUpdatePost = () => {
        queryClient.invalidateQueries({ queryKey: communityFeedPrefix });
        setComposerOpen(false);
        setPostToEdit(null);
        toast.success('Post updated!');
    };

    const handleDeletePost = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this story?")) return;
        const previousFeed = queryClient.getQueryData(activeFeedQueryKey);
        queryClient.setQueryData(activeFeedQueryKey, (old: any) => {
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
            queryClient.invalidateQueries({ queryKey: activeFeedQueryKey });
            toast.success('Story deleted');
        } catch (err) {
            queryClient.setQueryData(activeFeedQueryKey, previousFeed);
            toast.error('Failed to delete story');
        }
    };

    const posts = data?.pages?.flatMap(page => page.posts || []) || [];
    const blocks = data?.pages?.flatMap(page => page.blocks || []) || [];

    const normalizedPosts = posts.map(normalizePost);
    // Use postId as key for lookup (matches layoutItems.postId from resolveFeedLayout)
    const postById = new Map(normalizedPosts.map(p => [p.id, p]));

    const filteredPosts = normalizedPosts.filter(p =>
        !searchQuery ||
        p.caption?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.authorName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const layoutItems = !searchQuery ? resolveFeedLayout(posts as any, blocks) : [];
    
    const layoutPosts = layoutItems
        .map(item => postById.get(item.postId))
        .filter(Boolean) as NormalizedPost[];
    
    // Posts currently being displayed (depends on search mode)
    const displayPosts = searchQuery ? filteredPosts : layoutPosts;

    return (
        <div className="min-h-screen bg-white text-neutral-900 selection:bg-green-500/30">
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

            <div className="border-t border-neutral-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 lg:gap-10 items-start">

                    {/* Left: Main Feed */}
                    <div className="w-full max-w-[720px] mx-auto space-y-6 pb-24">
                        {/* ── Sticky Filter Bar ── */}
                        <div className="sticky top-16 z-30 py-3 bg-white/95 backdrop-blur-md border-b border-neutral-200/50">
                            <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                                <button
                                    onClick={() => setFeedScope('latest')}
                                    className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap shrink-0 snap-start transition-all ${feedScope === 'latest' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}`}
                                >
                                    Latest
                                </button>
                                <button
                                    onClick={() => setFeedScope('trending')}
                                    className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap shrink-0 snap-start transition-all ${feedScope === 'trending' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}`}
                                >
                                    Trending
                                </button>
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            setLoginAction('share');
                                            setIsLoginModalOpen(true);
                                            return;
                                        }
                                        setFeedScope('following');
                                    }}
                                    className={`px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap shrink-0 snap-start transition-all ${feedScope === 'following' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'}`}
                                >
                                    Following
                                </button>
                                <a
                                    href="/community/leaderboard"
                                    className="px-4 py-2 rounded-full border text-sm font-semibold whitespace-nowrap shrink-0 snap-start transition-all bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-yellow-100 flex items-center gap-1.5"
                                >
                                    <Trophy className="w-4 h-4" />
                                    Leaderboard
                                </a>
                            </div>
                        </div>

                        {/* ── Top Bar Controls ── */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                            <h2 className="text-3xl font-bold font-heading text-neutral-900 tracking-tight">Community Feed</h2>

                            <div className="flex flex-col sm:flex-row gap-3 items-center">
                                <div className="relative w-full sm:w-64 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-green-600 transition-colors" />
                                    <Input
                                        placeholder="Search stories..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-neutral-100 border-none rounded-full h-11 pl-11 shadow-sm ring-1 ring-neutral-200 focus-visible:ring-2 focus-visible:ring-green-500/50 text-sm font-medium text-neutral-900 placeholder:text-neutral-500"
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

                        {/* ── Feed Mapping with Editorial Pattern ── */}
                        <AnimatePresence mode="popLayout">
                            {displayPosts.map((post, idx) => {
                                const imageCount = post.images?.length || (post.imageUrl ? 1 : 0);
                                const variant = searchQuery
                                    ? getFeedVariant(idx, imageCount)
                                    : (layoutItems[idx]?.variant ?? getFeedVariant(idx, imageCount));

                                return (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        variant={variant}
                                        currentUser={user}
                                        onEdit={(p) => { setPostToEdit(p); setComposerOpen(true); }}
                                        onUpdate={handleUpdatePost}
                                        onDelete={handleDeletePost}
                                        onOpenComments={(postId) => setActiveCommentPostId(postId)}
                                    />
                                );
                            })}
                        </AnimatePresence>

                        {displayPosts.length === 0 && !isFetchingNextPage && !isPending && (
                            <EmptyFeedState
                                reason={feedScope === 'following' && !user ? 'NOT_LOGGED_IN' : feedScope === 'following' && user ? 'NO_FOLLOWS' : 'NO_POSTS'}
                                onLogin={() => {
                                    setLoginAction('share');
                                    setIsLoginModalOpen(true);
                                }}
                            />
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
                                    className="bg-neutral-900 text-white hover:bg-neutral-800 font-bold px-10 py-5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                                >
                                    Load More Stories
                                </Button>
                            </div>
                        )}

                        {/* End of Feed Sentinel */}
                        {!hasNextPage && displayPosts.length > 0 && (
                            <div className="py-16 border-t border-neutral-200 text-center">
                                <p className="text-neutral-400 text-[10px] font-black tracking-[0.2em] uppercase">
                                    End of Discovery
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right: Sidebar Rail (Desktop Only) */}
                    <div className="relative">
                        <CommunitySidebar />
                    </div>
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
                        queryClient.invalidateQueries({ queryKey: communityFeedPrefix });
                    }}
                    currentUserRole={user?.role}
                />
            )}
        </div>
    );
}
