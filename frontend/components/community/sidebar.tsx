import React from 'react';
import { Award, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getTopContributors, TopContributor } from '@/lib/api/feed';
import Link from 'next/link';

// Hardcoded suggested travelers for backfill when API returns empty
const SUGGESTED_TRAVELERS: TopContributor[] = [
    { id: 'suggested-1', name: 'Mountain Explorer', avatarUrl: '', role: 'TRAVELER', verifiedHost: false, postCount: 42 },
    { id: 'suggested-2', name: 'Himalayan Wanderer', avatarUrl: '', role: 'TRAVELER', verifiedHost: false, postCount: 38 },
    { id: 'suggested-3', name: 'Valley Trekker', avatarUrl: '', role: 'TRAVELER', verifiedHost: false, postCount: 35 },
];

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

// Single traveler row component
function TravelerRow({ user, index, isSuggested = false }: { user: TopContributor; index: number; isSuggested?: boolean }) {
    return (
        <Link href={`/profile/${user.id}`} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-7 text-[11px] font-black text-neutral-400 group-hover:text-neutral-600 transition-colors">
                #{index + 1}
            </div>
            {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent group-hover:ring-emerald-200 transition-all" />
            ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white text-xs font-bold ring-2 ring-transparent group-hover:ring-emerald-200 transition-all">
                    {(user.name || 'NB').slice(0, 2).toUpperCase()}
                </div>
            )}
            <div className="min-w-0">
                <p className="text-sm font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors leading-tight truncate">
                    {user.name}
                    {isSuggested && <span className="ml-1 text-[10px] text-amber-500 font-normal">✨</span>}
                </p>
                <p className="text-[11px] text-neutral-500 font-black uppercase tracking-widest">{user.postCount} stories</p>
            </div>
        </Link>
    );
}

export function CommunitySidebar() {
    const { data: topContributors, isLoading, isError } = useQuery({
        queryKey: ['community', 'trendingTravelers'],
        queryFn: () => getTopContributors(3),
        staleTime: 60000,
    });

    // Determine what to display
    const displayUsers = (() => {
        if (isLoading || isError) return null;
        if (topContributors && topContributors.length > 0) return topContributors;
        // Backfill with suggested travelers when empty
        return SUGGESTED_TRAVELERS;
    })();

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
                        // Error state with backfill
                        <>
                            {SUGGESTED_TRAVELERS.map((user, i) => (
                                <TravelerRow key={user.id} user={user} index={i} isSuggested />
                            ))}
                            <p className="text-[10px] text-neutral-400 text-center mt-2 italic">
                                Showing suggested travelers
                            </p>
                        </>
                    ) : (
                        // Success state (either real data or backfill)
                        <>
                            {displayUsers?.map((user, i) => (
                                <TravelerRow 
                                    key={user.id} 
                                    user={user} 
                                    index={i} 
                                    isSuggested={topContributors?.length === 0} 
                                />
                            ))}
                            {topContributors?.length === 0 && (
                                <p className="text-[10px] text-neutral-400 text-center mt-2 italic">
                                    Showing suggested travelers
                                </p>
                            )}
                        </>
                    )}
                </div>
            </div>

        </aside>
    );
}
