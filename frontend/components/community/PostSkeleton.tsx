import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function PostSkeleton({ isQuoted = false }: { isQuoted?: boolean }) {
    return (
        <div className={cn(
            "bg-white border border-gray-200 overflow-hidden",
            isQuoted ? "rounded-xl mt-3 p-3" : "rounded-xl mb-4 shadow-sm p-4"
        )}>
            {/* Header: Avatar + Meta */}
            <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-12 h-12 rounded-full flex-none" />
                <div className="flex flex-col gap-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                </div>
            </div>

            {/* Content: Text lines */}
            <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Media Placeholder (Sometimes appears) */}
            {!isQuoted && (
                <Skeleton className="aspect-video w-full rounded-xl mb-4" />
            )}

            {/* Action Bar */}
            {!isQuoted && (
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
            )}
        </div>
    );
}
