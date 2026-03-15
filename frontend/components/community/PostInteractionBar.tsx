'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postApi } from '@/lib/api/posts';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

interface PostInteractionBarProps {
    postId: string;
    likes: number;
    comments: number;
    shareCount: number;
    isLiked: boolean;
    onOpenComments: () => void;
    onRepost: () => void;
    onLikeToggle: (newCount: number, newLiked: boolean) => void;
    variant?: 'default' | 'overlay';
    className?: string;
}

export function PostInteractionBar({
    postId,
    likes,
    comments,
    shareCount,
    isLiked,
    onOpenComments,
    onRepost,
    onLikeToggle,
    variant = 'default',
    className
}: PostInteractionBarProps) {
    const { isAuthenticated, user } = useAuth() as any;
    const [popping, setPopping] = useState(false);
    const queryClient = useQueryClient();
    const viewerId = user?.id ?? null;
    const latestFeedKey = queryKeys.community.feed(undefined, 'latest', viewerId);
    const trendingKey = queryKeys.community.trending(viewerId);
    const communityFeedPrefix = ['community', 'posts'] as const;

    const mutation = useMutation({
        mutationFn: async () => {
            const res = await postApi.like(postId);
            return res.data;
        },
        onMutate: async () => {
            if (!isAuthenticated) {
                toast.error('Please log in to like posts');
                throw new Error('Unauthenticated');
            }
            setPopping(true);
            setTimeout(() => setPopping(false), 420);

            await queryClient.cancelQueries({ queryKey: communityFeedPrefix });
            await queryClient.cancelQueries({ queryKey: trendingKey });
            const previousPosts = queryClient.getQueryData(latestFeedKey);
            const previousTrending = queryClient.getQueryData(trendingKey);

            queryClient.setQueryData(latestFeedKey, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        posts: (page.posts || []).map((post: any) => {
                            if (post.postId === postId || post.id === postId) {
                                const newIsLiked = !post.isLikedByCurrentUser;
                                const newCount = newIsLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
                                if (onLikeToggle) onLikeToggle(newCount, newIsLiked);
                                return { ...post, isLikedByCurrentUser: newIsLiked, likeCount: newCount };
                            }
                            return post;
                        })
                    }))
                };
            });

            queryClient.setQueryData(trendingKey, (old: any) => {
                if (!old || !old.posts) return old;
                return {
                    ...old,
                    posts: (old.posts || []).map((post: any) => {
                        if (post.postId === postId || post.id === postId) {
                            const newIsLiked = !post.isLikedByCurrentUser;
                            const newCount = newIsLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1);
                            return { ...post, isLikedByCurrentUser: newIsLiked, likeCount: newCount };
                        }
                        return post;
                    })
                };
            });

            return { previousPosts, previousTrending };
        },
        onError: (err: any, _, context: any) => {
            if (context?.previousPosts) {
                queryClient.setQueryData(latestFeedKey, context.previousPosts);
            }
            if (context?.previousTrending) {
                queryClient.setQueryData(trendingKey, context.previousTrending);
            }
            if (err.message !== 'Unauthenticated') {
                const isNetworkError = !err.response || err.code === 'ERR_NETWORK';
                toast.error(isNetworkError ? "Connection hiccup — try again" : "Couldn't save your love. Try again.");
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: communityFeedPrefix });
            queryClient.invalidateQueries({ queryKey: trendingKey });
        }
    });

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isAuthenticated) {
            toast.error('Please log in to like posts');
            return;
        }
        mutation.mutate();
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            await postApi.share(postId);
            toast.success('Link copied to clipboard!');
            
            queryClient.setQueryData(latestFeedKey, (old: any) => {
                if (!old || !old.pages) return old;
                return {
                    ...old,
                    pages: old.pages.map((page: any) => ({
                        ...page,
                        posts: (page.posts || []).map((post: any) => {
                            if (post.postId === postId || post.id === postId) {
                                return { ...post, shareCount: (post.shareCount || 0) + 1 };
                            }
                            return post;
                        })
                    }))
                };
            });
        } catch (error) {
            if (navigator.share) {
                await navigator.share({
                    title: 'Check out this post on North Bengal Homestays',
                    url: window.location.href
                });
            } else {
                await navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard!');
            }
        }
    };

    const isOverlay = variant === 'overlay';
    const baseClasses = cn(
        'flex items-center gap-6 py-3',
        isOverlay ? 'text-white' : 'text-neutral-500',
        className
    );

    return (
        <div className={baseClasses}>
            <button
                onClick={handleLike}
                disabled={mutation.isPending}
                className={cn(
                    'flex items-center gap-1.5 font-medium transition-all duration-200',
                    isOverlay ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-red-500',
                    mutation.isPending && 'opacity-50 cursor-not-allowed'
                )}
            >
                <Heart 
                    className={cn(
                        'w-[18px] h-[18px] transition-all duration-200',
                        popping && 'scale-125 bounce-pop',
                        isLiked ? 'fill-current' : '',
                        isOverlay && isLiked ? 'text-white' : isLiked ? 'text-red-500' : ''
                    )} 
                />
                <span className="text-xs">{likes}</span>
            </button>

            <button
                onClick={onOpenComments}
                className={cn(
                    'flex items-center gap-1.5 font-medium transition-all duration-200',
                    isOverlay ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-emerald-500'
                )}
            >
                <MessageCircle className="w-[18px] h-[18px]" />
                <span className="text-xs">{comments}</span>
            </button>

            <button
                onClick={onRepost}
                className={cn(
                    'flex items-center gap-1.5 font-medium transition-all duration-200',
                    isOverlay ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-blue-500'
                )}
            >
                <Repeat2 className="w-[18px] h-[18px]" />
                <span className="text-xs">Repost</span>
            </button>

            <button
                onClick={handleShare}
                className={cn(
                    'flex items-center gap-1.5 font-medium transition-all duration-200',
                    isOverlay ? 'text-white/80 hover:text-white' : 'text-neutral-500 hover:text-purple-500'
                )}
            >
                <Share2 className="w-[18px] h-[18px]" />
                <span className="text-xs">Share</span>
            </button>
        </div>
    );
}
