import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
    return (
        <div className={cn('flex gap-2.5 mb-5', depth > 0 && 'ml-10 pl-4 border-l-2 border-neutral-200')}>
            {/* Avatar */}
            <Skeleton className="w-9 h-9 rounded-full flex-none bg-neutral-200 animate-pulse" />

            <div className="flex-1 space-y-2.5">
                {/* Bubble */}
                <div className="bg-neutral-50 rounded-2xl px-4 py-3 space-y-2 border border-neutral-200">
                    <Skeleton className="h-3 w-24 bg-neutral-200 animate-pulse" />
                    <Skeleton className="h-3.5 w-full bg-neutral-200 animate-pulse" />
                    <Skeleton className="h-3.5 w-4/5 bg-neutral-200 animate-pulse" />
                </div>

                {/* Meta Row */}
                <div className="flex gap-5 px-1 items-center">
                    <Skeleton className="h-3 w-14 bg-neutral-100 animate-pulse" />
                    {depth === 0 && <Skeleton className="h-3 w-10 bg-neutral-100 animate-pulse" />}
                </div>
            </div>
        </div>
    );
}
