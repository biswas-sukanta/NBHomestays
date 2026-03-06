import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "bg-zinc-950 overflow-hidden ring-1 ring-white/10",
            isQuoted ? "rounded-2xl mt-3 p-3" : "rounded-2xl mb-6 shadow-xl p-6"
        )}>
            {/* Header: Avatar + Meta */}
            <div className="flex items-center gap-3 mb-6">
                <Skeleton className="w-12 h-12 rounded-full flex-none bg-zinc-800" />
                <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-32 bg-zinc-800" />
                    <Skeleton className="h-3 w-48 bg-zinc-800/50" />
                </div>
            </div>

            {/* Content: Text lines */}
            <div className="space-y-3 mb-6">
                <Skeleton className="h-4 w-full bg-zinc-800" />
                <Skeleton className="h-4 w-full bg-zinc-800" />
                <Skeleton className="h-4 w-2/3 bg-zinc-800" />
            </div>

            {/* Media Placeholder */}
            {!isQuoted && (
                <Skeleton className="aspect-video w-full rounded-xl mb-6 bg-zinc-900 border border-white/5" />
            )}

            {/* Action Bar */}
            {!isQuoted && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                    <Skeleton className="h-9 w-24 rounded-full bg-zinc-900" />
                    <Skeleton className="h-9 w-24 rounded-full bg-zinc-900" />
                    <Skeleton className="h-9 w-24 rounded-full bg-zinc-900" />
                    <Skeleton className="h-9 w-24 rounded-full bg-zinc-900" />
                </div>
            )}
        </div>
    );
}
