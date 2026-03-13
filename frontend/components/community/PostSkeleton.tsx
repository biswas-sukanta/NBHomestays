import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "bg-white overflow-hidden relative",
            isQuoted ? "rounded-[22px] mt-3 ring-1 ring-neutral-200" : "rounded-[22px] border border-[#e8e8e8] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
        )}>
            {/* Author Header Placeholder */}
            <div className="p-[26px] flex items-center gap-3">
                <Skeleton className="w-11 h-11 rounded-full bg-neutral-100 animate-pulse flex-none" />
                <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32 bg-neutral-100 animate-pulse" />
                        <Skeleton className="h-4 w-12 bg-neutral-100 animate-pulse rounded-full" />
                    </div>
                    <Skeleton className="h-3 w-48 bg-neutral-100 animate-pulse" />
                </div>
            </div>

            {/* Content Section - Text first */}
            <div className="px-[26px] pb-[26px] bg-white relative z-20">
                {/* Caption Placeholder */}
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-3/4 bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-1/2 bg-neutral-100 animate-pulse" />
                    <Skeleton className="h-4 w-2/3 bg-neutral-100 animate-pulse" />
                </div>
            </div>

            {/* Section Divider */}
            <div className="h-px bg-[rgba(0,0,0,0.04)] mx-[26px]" />

            {/* Image Grid Placeholder */}
            <div className="p-[6px] mx-[26px] my-4 bg-neutral-50/50 rounded-[18px]">
                <div className="grid grid-cols-2 gap-1.5 rounded-[14px] overflow-hidden">
                    <Skeleton className="aspect-square bg-neutral-100 animate-pulse" />
                    <Skeleton className="aspect-square bg-neutral-100 animate-pulse" />
                </div>
            </div>

            {/* Tags Placeholder */}
            <div className="flex gap-2 px-[26px] pb-4">
                <Skeleton className="h-6 w-20 bg-neutral-100 rounded-full animate-pulse" />
                <Skeleton className="h-6 w-24 bg-neutral-100 rounded-full animate-pulse" />
            </div>

            {/* Section Divider */}
            <div className="h-px bg-[rgba(0,0,0,0.04)] mx-[26px]" />

            {/* Action Bar */}
            {!isQuoted && (
                <div className="relative z-20 flex items-center gap-6 px-[26px] py-4 bg-white">
                    <Skeleton className="h-5 w-16 bg-neutral-100 animate-pulse rounded" />
                    <Skeleton className="h-5 w-16 bg-neutral-100 animate-pulse rounded" />
                    <Skeleton className="h-5 w-16 bg-neutral-100 animate-pulse rounded" />
                    <Skeleton className="h-5 w-14 bg-neutral-100 animate-pulse rounded" />
                </div>
            )}
        </div>
    );
}
