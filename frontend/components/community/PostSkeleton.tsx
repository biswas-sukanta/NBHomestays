import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "bg-white overflow-hidden border border-neutral-200 relative",
            isQuoted ? "rounded-[20px] mt-3" : "rounded-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        )}>
            {/* Author Header Placeholder */}
            <div className="px-6 pt-6 pb-4 flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse flex-none" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <Skeleton className="h-4 w-32 bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-3 w-48 bg-neutral-100 animate-pulse" />
                </div>
            </div>

            {/* Content Section - Text first */}
            <div className="px-6 pb-4 bg-white relative z-20">
                {/* Caption Placeholder */}
                <div className="space-y-2 mb-4">
                    <Skeleton className="h-4 w-full bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-3/4 bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-1/2 bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-2/3 bg-neutral-100 animate-pulse" />
                </div>

                {/* Tags Placeholder */}
                <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 bg-neutral-100 rounded-full animate-pulse" />
                    <Skeleton className="h-5 w-20 bg-neutral-100 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Image Grid Placeholder */}
            <div className="px-6 pb-4">
                <div className="grid grid-cols-2 gap-1 rounded-[16px] overflow-hidden">
                    <Skeleton className="aspect-square bg-neutral-100 animate-pulse" />
                    <Skeleton className="aspect-square bg-neutral-100 animate-pulse" />
                </div>
            </div>

            {/* Action Bar */}
            {!isQuoted && (
                <div className="relative z-20 flex items-center gap-6 px-6 py-3 border-t border-neutral-100 bg-white">
                    <Skeleton className="h-5 w-12 bg-neutral-100 animate-pulse rounded" />
                    <Skeleton className="h-5 w-12 bg-neutral-100 animate-pulse rounded" />
                    <Skeleton className="h-5 w-16 bg-neutral-100 animate-pulse rounded" />
                    <Skeleton className="h-5 w-12 bg-neutral-100 animate-pulse rounded" />
                </div>
            )}
        </div>
    );
}
