import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "bg-white overflow-hidden border border-neutral-200 relative",
            isQuoted ? "rounded-2xl mt-3" : "rounded-2xl mb-6 shadow-sm"
        )}>
            {/* Top Header Overlay Placeholder (Tags/Metadata) */}
            <div className="absolute inset-x-0 top-0 pt-6 px-6 flex justify-between items-start z-20">
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-6 w-16 bg-neutral-100 rounded-full animate-pulse" />
                    <Skeleton className="h-6 w-24 bg-emerald-100 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Media/Content Block */}
            <div className={cn(
                "relative z-10 w-full bg-neutral-100 border-b border-neutral-200",
                isQuoted ? "h-32" : "aspect-[4/5] max-h-[420px]"
            )}>
                <Skeleton className="absolute inset-0 w-full h-full bg-neutral-100 animate-pulse" />
            </div>

            {/* Meta Section: Caption & Author */}
            <div className="px-6 pb-6 pt-6 bg-white relative z-20">
                {/* Caption Placeholder */}
                <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-3/4 bg-neutral-100 animate-pulse" />
                </div>

                {/* Author Row */}
                <div className="flex items-center gap-3 pt-2 border-t border-neutral-100 mt-2">
                    <Skeleton className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse flex-none" />
                    <div className="flex flex-col gap-1.5 flex-1">
                        <Skeleton className="h-4 w-32 bg-neutral-100 animate-pulse" />
                        <Skeleton className="h-3 w-20 bg-neutral-100 animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            {!isQuoted && (
                <div className="relative z-20 flex items-center justify-between px-2 py-2 border-t border-neutral-100 bg-neutral-50">
                    <Skeleton className="h-10 w-1/4 bg-neutral-100 animate-pulse mx-1 rounded-lg" />
                    <Skeleton className="h-10 w-1/4 bg-neutral-100 animate-pulse mx-1 rounded-lg" />
                    <Skeleton className="h-10 w-1/4 bg-neutral-100 animate-pulse mx-1 rounded-lg" />
                    <Skeleton className="h-10 w-1/4 bg-neutral-100 animate-pulse mx-1 rounded-lg" />
                </div>
            )}
        </div>
    );
}
