import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "overflow-hidden relative bg-[#FDFBF7]",
            isQuoted ? "rounded-[20px] mt-3 ring-1 ring-neutral-200" : "rounded-[20px] border-none shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)]"
        )}>
            {/* Curation Pills - Backend-Driven */}
            <div className="flex items-center gap-2 px-6 pt-5">
                <Skeleton className="h-6 w-20 rounded-full bg-neutral-200 animate-pulse" />
                <Skeleton className="h-6 w-16 rounded-full bg-neutral-200 animate-pulse" />
            </div>

            {/* Editorial Image Grid Placeholder */}
            <div className="px-6 pt-3 pb-4">
                <div className="grid grid-cols-2 gap-1.5 rounded-lg overflow-hidden">
                    <Skeleton className="aspect-[4/3] bg-neutral-200 animate-pulse col-span-2" />
                </div>
            </div>

            {/* Category Tags Placeholder */}
            <div className="flex gap-2 px-6 pb-3">
                <Skeleton className="h-7 w-24 rounded-full bg-neutral-200 animate-pulse" />
                <Skeleton className="h-7 w-20 rounded-full bg-neutral-200 animate-pulse" />
            </div>

            {/* User Metadata Byline */}
            <div className="px-6 pt-2 pb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-9 h-9 rounded-full bg-neutral-200 animate-pulse" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24 bg-neutral-200 animate-pulse" />
                        <Skeleton className="h-3 w-16 bg-neutral-200 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Editorial Content Teaser with Fading Effect */}
            <div className="px-6 pb-4 space-y-2">
                <Skeleton className="h-6 w-3/4 bg-neutral-200 animate-pulse" />
                <Skeleton className="h-4 w-full bg-neutral-200 animate-pulse" />
                <Skeleton className="h-4 w-2/3 bg-neutral-200 animate-pulse" />
            </div>

            {/* Social Interaction Bar - Grouped Layout */}
            {!isQuoted && (
                <div className="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
                    {/* Left Group: Like, Comment, Repost */}
                    <div className="flex items-center gap-5">
                        <Skeleton className="h-4 w-16 bg-neutral-200 animate-pulse rounded" />
                        <Skeleton className="h-4 w-20 bg-neutral-200 animate-pulse rounded" />
                        <Skeleton className="h-4 w-16 bg-neutral-200 animate-pulse rounded" />
                    </div>
                    {/* Right: External Share */}
                    <Skeleton className="h-4 w-20 bg-neutral-200 animate-pulse rounded" />
                </div>
            )}
        </div>
    );
}
