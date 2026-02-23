'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestayCarousel } from '@/components/homestay-carousel';
import { HomestaySummary, HomestayCard } from '@/components/homestay-card';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

function ExploreContent() {
    const searchParams = useSearchParams();
    const currentTag = searchParams?.get('tag');

    const [loading, setLoading] = useState(true);

    // Swimlane States
    const [topDestinations, setTopDestinations] = useState<HomestaySummary[]>([]);
    const [trending, setTrending] = useState<HomestaySummary[]>([]);
    const [offbeat, setOffbeat] = useState<HomestaySummary[]>([]);
    const [budgetFriendly, setBudgetFriendly] = useState<HomestaySummary[]>([]);
    const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);

    useEffect(() => {
        const fetchFeeds = async () => {
            setLoading(true);
            try {
                if (currentTag) {
                    const res = await api.get(`/api/homestays/search?tag=${encodeURIComponent(currentTag)}`);
                    setSearchGrid(res.data);
                } else {
                    // Fire multiple endpoints concurrently mapping correctly via tags
                    const [res1, res2, res3, res4] = await Promise.all([
                        api.get('/api/homestays/search?tag=Heritage'), // Map to Top Destinations logic later
                        api.get('/api/homestays/search?tag=Trending Now'),
                        api.get('/api/homestays/search?tag=Explore Offbeat'),
                        api.get('/api/homestays/search?tag=Budget Friendly'),
                    ]);
                    setTopDestinations(res1.data);
                    setTrending(res2.data);
                    setOffbeat(res3.data);
                    setBudgetFriendly(res4.data);
                }
            } catch (err) {
                console.error("Failed to fetch feeds:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchFeeds();
    }, [currentTag]);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            {/* ── Global Category Filter ── */}
            <CategoryFilterBar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="w-full">
                        <div className="flex gap-6 overflow-hidden pt-4 pb-8">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex flex-col space-y-3 w-[280px] shrink-0">
                                    <Skeleton className="relative w-full aspect-[4/3] rounded-2xl bg-gray-800" />
                                    <Skeleton className="h-5 w-3/4 bg-gray-800" />
                                    <Skeleton className="h-4 w-1/2 bg-gray-800" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : currentTag ? (
                    /* TAG SELECTED: Grid Feed View */
                    <div className="w-full">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-3xl font-extrabold tracking-tight">
                                {currentTag}
                            </h2>
                            <span className="text-gray-400">{searchGrid.length} stays found</span>
                        </div>

                        {searchGrid.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {searchGrid.map((h, i) => (
                                    <div key={h.id} className="h-full">
                                        <HomestayCard homestay={h} index={i} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-[#111] rounded-2xl border border-gray-800 border-dashed">
                                <h3 className="text-xl font-bold mb-2">No stays found for this vibe</h3>
                                <p className="text-gray-400">Try selecting a different category or exploring our trending stays.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    /* NO TAG: Swimlane Layout */
                    <div className="space-y-12">
                        <HomestayCarousel
                            title="📍 Top Destinations"
                            homestays={topDestinations}
                        />
                        <HomestayCarousel
                            title="🔥 Trending Now"
                            homestays={trending}
                        />
                        <HomestayCarousel
                            title="🍃 Explore Offbeat"
                            homestays={offbeat}
                        />
                        <HomestayCarousel
                            title="🎒 Budget Friendly"
                            homestays={budgetFriendly}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ExplorePage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading Explore...</div>}>
            <ExploreContent />
        </Suspense>
    );
}
