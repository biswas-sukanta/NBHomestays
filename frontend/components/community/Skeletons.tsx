import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { PostSkeleton } from './PostSkeleton';

/**
 * Premium Hero Skeleton (Responsive)
 * Matches CommunityHero h-[60vh] min-h-[500px]
 */
export function HeroSkeleton() {
    return (
        <section className="relative w-full h-[60vh] min-h-[500px] flex items-center justify-center overflow-hidden bg-neutral-100">
            <div className="container relative z-20 px-4 md:px-6 mx-auto text-center flex flex-col items-center justify-center translate-y-6">
                <div className="max-w-3xl mx-auto space-y-4 md:space-y-6 flex flex-col items-center">
                    {/* H1 Placeholder */}
                    <Skeleton className="h-16 w-64 sm:h-20 sm:w-80 md:h-32 md:w-[600px] bg-neutral-200 rounded-2xl animate-pulse" />
                    {/* Subtitle Placeholder */}
                    <Skeleton className="h-5 w-48 sm:h-6 sm:w-60 md:h-8 md:w-96 bg-neutral-200 rounded-xl animate-pulse" />
                    {/* Button Placeholder */}
                    <div className="pt-6 sm:pt-8 w-full flex justify-center">
                        <Skeleton className="h-[56px] w-[180px] sm:h-[64px] sm:w-[220px] rounded-full bg-neutral-200 animate-pulse" />
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Premium Trending Stories Skeleton (Responsive)
 * Matches the 7/12 & 5/12 grid layout of TrendingStories
 */
export function TrendingStoriesSkeleton() {
    return (
        <section className="py-12 md:py-16 bg-neutral-50">
            <div className="container mx-auto px-4 lg:px-6">
                {/* Header Section */}
                <div className="flex items-center gap-4 mb-10">
                    <Skeleton className="w-12 h-12 rounded-full bg-neutral-200 animate-pulse" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 sm:w-64 bg-neutral-200 animate-pulse" />
                        <Skeleton className="h-3 w-32 sm:w-40 bg-neutral-200 animate-pulse" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto">
                    {/* Featured (Top on Mobile, Left on Desktop) */}
                    <div className="lg:col-span-7 h-[400px] lg:h-[600px] relative rounded-2xl overflow-hidden border border-neutral-200 bg-white">
                        <Skeleton className="absolute inset-0 w-full h-full bg-neutral-100 animate-pulse" />
                        <div className="absolute inset-x-0 bottom-0 p-6 md:p-8 space-y-4">
                            <div className="flex gap-2">
                                <Skeleton className="h-6 w-20 bg-neutral-200 animate-pulse" />
                                <Skeleton className="h-6 w-24 bg-neutral-200 animate-pulse" />
                            </div>
                            <Skeleton className="h-8 md:h-10 w-full bg-neutral-200 animate-pulse" />
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-neutral-200 animate-pulse" />
                                <div className="space-y-1">
                                    <Skeleton className="h-3 w-16 md:h-4 md:w-24 bg-neutral-200 animate-pulse" />
                                    <Skeleton className="h-2 w-24 md:h-3 md:w-32 bg-neutral-200 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Stories (Bottom on Mobile, Right on Desktop) */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="h-[250px] lg:flex-1 relative rounded-2xl overflow-hidden border border-neutral-200 bg-white">
                            <Skeleton className="absolute inset-0 w-full h-full bg-neutral-100 animate-pulse" />
                            <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
                                <Skeleton className="h-4 w-24 bg-neutral-200 animate-pulse" />
                                <Skeleton className="h-6 w-full bg-neutral-200 animate-pulse" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
                                    <Skeleton className="h-3 w-20 bg-neutral-200 animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <div className="h-[250px] lg:flex-1 relative rounded-2xl overflow-hidden border border-neutral-200 bg-white">
                            <Skeleton className="absolute inset-0 w-full h-full bg-neutral-100 animate-pulse" />
                            <div className="absolute inset-x-0 bottom-0 p-5 space-y-3">
                                <Skeleton className="h-4 w-24 bg-neutral-200 animate-pulse" />
                                <Skeleton className="h-6 w-full bg-neutral-200 animate-pulse" />
                                <div className="flex items-center gap-2">
                                    <Skeleton className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
                                    <Skeleton className="h-3 w-20 bg-neutral-200 animate-pulse" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/**
 * Main Feed Skeleton Grid (Preserves Sidebar)
 */
export function CommunityPageSkeleton() {
    return (
        <div className="min-h-screen bg-white text-neutral-900">
            <HeroSkeleton />

            <TrendingStoriesSkeleton />

            <div className="container mx-auto px-4 lg:px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
                    {/* Left Feed */}
                    <div className="w-full space-y-8">
                        {/* Feed Controls */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                            <Skeleton className="h-10 w-64 bg-neutral-100 rounded-lg animate-pulse" />
                            <Skeleton className="h-11 w-full sm:w-64 bg-neutral-100 rounded-full animate-pulse" />
                        </div>

                        {/* Filter Matrix */}
                        <div className="mb-8 flex gap-3 overflow-hidden">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="h-10 w-24 rounded-full bg-neutral-100 animate-pulse flex-shrink-0" />
                            ))}
                        </div>

                        {/* Posts */}
                        <div className="space-y-8">
                            {[1, 2].map(i => <PostSkeleton key={i} />)}
                        </div>
                    </div>

                    {/* Sidebar Rail */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 space-y-4">
                            <Skeleton className="h-6 w-3/4 bg-neutral-100 animate-pulse" />
                            <Skeleton className="h-4 w-full bg-neutral-100 animate-pulse" />
                            <Skeleton className="h-4 w-2/3 bg-neutral-100 animate-pulse" />
                        </div>
                        <div className="p-6 rounded-2xl bg-white border border-neutral-200 space-y-4">
                            <Skeleton className="h-6 w-3/4 bg-neutral-100 animate-pulse" />
                            <div className="flex flex-wrap gap-2">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Skeleton key={i} className="h-6 w-16 bg-neutral-100 rounded-full animate-pulse" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
