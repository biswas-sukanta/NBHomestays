import React from 'react';
import { Award, Compass } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getLeaderboard, LeaderboardEntry } from '@/lib/api/feed';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Loading skeleton for sidebar
function TravelerSkeleton() {
    return (
        <div className="flex items-center gap-3 animate-pulse">
            <div className="w-7 text-[11px] font-black text-neutral-300">#?</div>
            <div className="w-10 h-10 rounded-full bg-neutral-200" />
            <div className="min-w-0 flex-1">
                <div className="h-4 bg-neutral-200 rounded w-20 mb-1" />
                <div className="h-3 bg-neutral-100 rounded w-14" />
            </div>
        </div>
    );
}

// Single traveler row component - uses real userId from LeaderboardEntry
function TravelerRow({ user, index }: { user: LeaderboardEntry; index: number }) {
    return (
        <Link href={`/profile/${user.userId}`} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-7 text-[11px] font-black text-neutral-400 group-hover:text-neutral-600 transition-colors">
                #{index + 1}
            </div>
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-200 transition-all" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-emerald-200 transition-all">
                    {user.displayName.slice(0, 2).toUpperCase()}
                </div>
            )}
            <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors leading-tight truncate">
                    {user.displayName}
                </p>
                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-widest">{user.postCount} stories</p>
            </div>
        </Link>
    );
}

// Empty state CTA - no fake users, just encouragement
function EmptyLeaderboardCTA() {
    return (
        <div className="text-center py-6">
            <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center mb-3 mx-auto">
                <Compass className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-sm font-bold text-neutral-900 mb-1">Start your journey</p>
            <p className="text-[11px] text-neutral-500 max-w-[180px] mx-auto">
                Share stories and earn XP to appear here as a top traveler.
            </p>
        </div>
    );
}

export function CommunitySidebar() {
    const { data: leaderboard, isLoading, isError } = useQuery({
        queryKey: ['community', 'trendingTravelers'],
        queryFn: () => getLeaderboard(5), // Only fetch top 5 for sidebar
        staleTime: 5 * 60 * 1000, // 5 minutes - avoid refetch on tab switches
    });

    // Extract top 5 from leaderboard (already limited by API)
    const topTravelers = leaderboard?.slice(0, 5) ?? [];

    return (
        <aside className="hidden lg:flex flex-col gap-6 sticky top-24">

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6 text-neutral-900 border-b border-neutral-100 pb-4">
                    <Award className="w-5 h-5 text-amber-500" />
                    <h3 className="font-bold font-heading text-lg tracking-tight">Trending Travelers</h3>
                </div>
                <div className="space-y-4">
                    {isLoading ? (
                        // Loading skeleton
                        <>
                            <TravelerSkeleton />
                            <TravelerSkeleton />
                            <TravelerSkeleton />
                        </>
                    ) : isError ? (
                        // Error state - show CTA, no fake users
                        <EmptyLeaderboardCTA />
                    ) : topTravelers.length === 0 ? (
                        // Empty leaderboard - show CTA, no fake users
                        <EmptyLeaderboardCTA />
                    ) : (
                        // Success state - real data from leaderboard
                        topTravelers.map((user, i) => (
                            <TravelerRow key={user.userId} user={user} index={i} />
                        ))
                    )}
                </div>
            </div>

        </aside>
    );
}
