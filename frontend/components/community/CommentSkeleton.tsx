import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
    return (
        <div className={cn('flex gap-2.5 mb-5', depth > 0 && 'ml-10 pl-4 border-l-2 border-zinc-800')}>
            {/* Avatar */}
            <Skeleton className="w-9 h-9 rounded-full flex-none bg-zinc-800" />

            <div className="flex-1 space-y-2.5">
                {/* Bubble */}
                <div className="bg-zinc-900/50 rounded-2xl px-4 py-3 space-y-2 border border-white/5">
                    <Skeleton className="h-3 w-24 bg-zinc-800" />
                    <Skeleton className="h-3.5 w-full bg-zinc-800/80" />
                    <Skeleton className="h-3.5 w-4/5 bg-zinc-800/80" />
                </div>

                {/* Meta Row */}
                <div className="flex gap-5 px-1 items-center">
                    <Skeleton className="h-3 w-14 bg-zinc-800/50" />
                    {depth === 0 && <Skeleton className="h-3 w-10 bg-zinc-800/50" />}
                </div>
            </div>
        </div>
    );
}
