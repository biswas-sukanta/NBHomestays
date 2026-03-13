import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "overflow-hidden relative bg-[#FDFBF7]",
            isQuoted ? "rounded-[20px] mt-3 ring-1 ring-neutral-200" : "rounded-[20px] border-none shadow-[0_12px_40px_-12px_rgba(0,0,0,0.08)]"
        )}>
            {/* Image Hero Placeholder */}
            <Skeleton className="w-full aspect-[4/5] bg-neutral-200 animate-pulse" />

            {/* User Metadata Byline */}
            <div className="px-6 pt-5 pb-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full bg-neutral-200 animate-pulse" />
                    <div className="flex flex-col gap-1.5">
                        <Skeleton className="h-4 w-24 bg-neutral-200 animate-pulse" />
                        <Skeleton className="h-3 w-16 bg-neutral-200 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Editorial Content Teaser */}
            <div className="px-6 pb-4 space-y-2">
                <Skeleton className="h-5 w-3/4 bg-neutral-200 animate-pulse" />
                <Skeleton className="h-4 w-full bg-neutral-200 animate-pulse" />
                <Skeleton className="h-4 w-2/3 bg-neutral-200 animate-pulse" />
            </div>

            {/* Whisper-Quiet Interactions Bar */}
            {!isQuoted && (
                <div className="border-t border-gray-100 px-6 py-4 flex items-center gap-6">
                    <Skeleton className="h-4 w-12 bg-neutral-200 animate-pulse rounded" />
                    <Skeleton className="h-4 w-12 bg-neutral-200 animate-pulse rounded" />
                    <Skeleton className="h-4 w-8 bg-neutral-200 animate-pulse rounded ml-auto" />
                </div>
            )}
        </div>
    );
}
