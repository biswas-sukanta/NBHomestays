import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function CommentSkeleton({ depth = 0 }: { depth?: number }) {
    return (
        <div className={cn('flex gap-2.5 mb-4', depth > 0 && 'ml-8 pl-3 border-l-2 border-border/50')}>
            {/* Avatar */}
            <Skeleton className="w-8 h-8 rounded-full flex-none" />

            <div className="flex-1 space-y-2">
                {/* Bubble */}
                <div className="bg-secondary/20 rounded-xl px-3 py-2.5 space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                </div>

                {/* Meta Row */}
                <div className="flex gap-4 px-1">
                    <Skeleton className="h-3 w-12" />
                    {depth === 0 && <Skeleton className="h-3 w-10" />}
                </div>
            </div>
        </div>
    );
}
