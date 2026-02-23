'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestayCarousel } from '@/components/homestay-carousel';
import { HomestaySummary, HomestayCard } from '@/components/homestay-card';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// --- Destination Card Component ---
const DESTINATIONS = [
    { name: 'Darjeeling', image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kalimpong', image: 'https://images.unsplash.com/photo-1626621341517-bbf3e99c0b2c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kurseong', image: 'https://plus.unsplash.com/premium_photo-1697729606869-e58f00db11ee?auto=format&fit=crop&q=80&w=800' },
    { name: 'Mirik', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800' },
    { name: 'Sittong', image: 'https://images.unsplash.com/photo-1681285312384-cbca6f2d5930?auto=format&fit=crop&q=80&w=800' },
];

function DestinationCard({ dest }: { dest: { name: string; image: string } }) {
    return (
        <Link href={`/explore?tag=${encodeURIComponent(dest.name)}`} className="block w-[200px] shrink-0 snap-start group outline-none overflow-hidden rounded-2xl relative">
            <div className="w-full aspect-square bg-gray-800 relative z-0">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                    <h3 className="text-xl font-bold text-white drop-shadow-md text-center">{dest.name}</h3>
                </div>
            </div>
        </Link>
    );
}

function ExploreContent() {
    const searchParams = useSearchParams();
    const currentTag = searchParams?.get('tag');

    const [loading, setLoading] = useState(true);

    // Swimlane States
    const [trending, setTrending] = useState<HomestaySummary[]>([]);
    const [offbeat, setOffbeat] = useState<HomestaySummary[]>([]);
    const [budgetFriendly, setBudgetFriendly] = useState<HomestaySummary[]>([]);
    const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);

    useEffect(() => {
        const fetchFeeds = async () => {
            setLoading(true);
            try {
                if (currentTag) {
                    // If a specific tag/destination is clicked, fetch up to 30 items
                    const res = await api.get(`/api/homestays/search?tag=${encodeURIComponent(currentTag)}&page=0&size=30`);
                    setSearchGrid(res.data);
                } else {
                    // Fire 3 endpoints concurrently, strictly limited to 6 items utilizing Spring Boot parameters
                    const [res1, res2, res3] = await Promise.all([
                        api.get('/api/homestays/search?tag=Trending Now&size=6'),
                        api.get('/api/homestays/search?tag=Explore Offbeat&size=6'),
                        api.get('/api/homestays/search?tag=Budget Friendly&size=6'),
                    ]);
                    setTrending(res1.data);
                    setOffbeat(res2.data);
                    setBudgetFriendly(res3.data);
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 gap-y-12">
                                {searchGrid.map((h, i) => (
                                    <div key={h.id} className="h-full flex justify-center">
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
                    <div className="space-y-14">

                        {/* Top Destinations Section */}
                        <section>
                            <div className="mb-2">
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">📍 Top Destinations</h2>
                                <p className="text-gray-400 text-sm mb-6">Discover stays in the most sought-after hills.</p>
                            </div>
                            <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {DESTINATIONS.map(d => <DestinationCard key={d.name} dest={d} />)}
                            </div>
                        </section>

                        <HomestayCarousel
                            title="🔥 Trending Now"
                            homestays={trending}
                            description="Our most booked and highly rated properties."
                        />
                        <HomestayCarousel
                            title="🍃 Explore Offbeat"
                            homestays={offbeat}
                            description="Get away from the crowds and reconnect with nature."
                        />
                        <HomestayCarousel
                            title="🎒 Budget Friendly"
                            homestays={budgetFriendly}
                            description="Incredible experiential stays under ₹2000/night."
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
