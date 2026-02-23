'use client';

import React, { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestayCarousel } from '@/components/homestay-carousel';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import api from '@/lib/api';
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
        <Link href={`/search?tag=${encodeURIComponent(dest.name)}`} className="block w-[260px] sm:w-[280px] shrink-0 snap-start group outline-none overflow-hidden rounded-2xl relative shadow-sm hover:shadow-lg transition-all">
            <div className="w-full aspect-[4/3] bg-gray-100 relative z-0">
                <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                    <h3 className="text-xl font-bold text-white drop-shadow-md">{dest.name}</h3>
                </div>
            </div>
        </Link>
    );
}

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const query = searchParams?.get('query') || '';
    const tag = searchParams?.get('tag') || '';

    const [searchTerm, setSearchTerm] = useState(query);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    // Dynamic View Grid
    const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);

    // Swimlane default states
    const [trending, setTrending] = useState<HomestaySummary[]>([]);
    const [offbeat, setOffbeat] = useState<HomestaySummary[]>([]);
    const [budgetFriendly, setBudgetFriendly] = useState<HomestaySummary[]>([]);

    // Infinite Scroll States
    const [allHomestays, setAllHomestays] = useState<HomestaySummary[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isFetchingPage, setIsFetchingPage] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Sync input box when URL query changes
    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    // Initial Data Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            try {
                if (query || tag) {
                    // Standard search execution
                    const endpoint = query
                        ? `/api/homestays/search?q=${encodeURIComponent(query)}&page=0&size=50`
                        : `/api/homestays/search?tag=${encodeURIComponent(tag)}&page=0&size=50`;

                    const res = await api.get(endpoint);
                    setSearchGrid(res.data);
                } else {
                    // Default Storefront Light Theme Swimlanes
                    const [res1, res2, res3] = await Promise.all([
                        api.get('/api/homestays/search?tag=Trending Now&page=0&size=6'),
                        api.get('/api/homestays/search?tag=Explore Offbeat&page=0&size=6'),
                        api.get('/api/homestays/search?tag=Budget Friendly&page=0&size=6'),
                    ]);
                    setTrending(res1.data);
                    setOffbeat(res2.data);
                    setBudgetFriendly(res3.data);
                }
            } catch (err) {
                console.error("Failed to fetch discovery feeds", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialData();
        // Reset infinite scroll whenever query/tag changes
        setAllHomestays([]);
        setPage(0);
        setHasMore(true);
    }, [query, tag]);

    // Infinite Scroll Fetcher
    const fetchNextPage = useCallback(async () => {
        if (!hasMore || isFetchingPage) return;

        // Only trigger infinite scroll if we are on the Storefront base view
        if (query || tag) return;

        setIsFetchingPage(true);
        try {
            const res = await api.get(`/api/homestays/search?page=${page}&size=12`);
            const newData = res.data;

            if (newData.length === 0) {
                setHasMore(false);
            } else {
                setAllHomestays(prev => [...prev, ...newData]);
                setPage(prev => prev + 1);
                if (newData.length < 12) setHasMore(false);
            }
        } catch (error) {
            console.error('Failed to fetch next page', error);
        } finally {
            setIsFetchingPage(false);
        }
    }, [hasMore, isFetchingPage, page, query, tag]);

    // Intersection Observer Hook for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        const target = observerTarget.current;
        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [fetchNextPage]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
        } else {
            router.push('/search');
        }
    };

    const isStorefront = !query && !tag;

    return (
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
            {/* ── Minimal Light Theme Search Banner ── */}
            <div className="relative mb-8">
                <div className="flex flex-col items-center justify-center text-center max-w-3xl mx-auto pt-4 pb-6 px-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2 w-full"
                    >
                        <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">
                            {isStorefront ? 'Discover' : 'Results'}
                        </p>
                        <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                            {query ? `"${query}"` : tag ? tag : 'Explore North Bengal'}
                        </h1>
                    </motion.div>

                    {/* Search bar */}
                    <motion.form
                        onSubmit={handleSearch}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mt-8 w-full flex gap-2"
                    >
                        <div className="flex-1 flex items-center gap-3 bg-white border border-gray-200 shadow-sm px-4 py-3.5 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                            <Search className="w-5 h-5 text-gray-400 flex-none" />
                            <input
                                type="text"
                                placeholder="Where do you want to go?"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-base font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-8 py-3.5 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
                        >
                            Search
                        </button>
                    </motion.form>
                </div>
            </div>

            {/* ── Ultra-Compact Category Filter Bar ── */}
            <CategoryFilterBar />

            {/* ── Dynamic Layout ── */}
            <div className="py-8">
                {isInitialLoading ? (
                    <div className="w-full space-y-12">
                        <div className="flex gap-4 overflow-hidden pt-4 pb-8">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex flex-col space-y-3 w-[260px] sm:w-[280px] shrink-0">
                                    <Skeleton className="relative w-full aspect-[4/3] rounded-2xl bg-gray-100" />
                                    <Skeleton className="h-5 w-3/4 bg-gray-100" />
                                    <Skeleton className="h-4 w-1/2 bg-gray-100" />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : isStorefront ? (
                    /* AIRBNB LIGHT THEME SWIMLANES */
                    <div className="space-y-16">
                        {/* Top Destinations Section */}
                        <section>
                            <div className="mb-4 text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight">📍 Top Destinations</h2>
                                <p className="text-gray-500 text-base">Unwind in the most sought-after hills.</p>
                            </div>
                            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                {DESTINATIONS.map(d => <DestinationCard key={d.name} dest={d} />)}
                            </div>
                        </section>

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

                        {/* Infinite Scroll Grid: All Homestays */}
                        <div className="pt-8 border-t border-gray-100">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-12 mb-6 tracking-tight text-left">All Homestays</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {allHomestays.map((h, i) => (
                                    <div key={h.id} className="h-full flex justify-start">
                                        <HomestayCard homestay={h} index={i % 12} />
                                    </div>
                                ))}
                            </div>

                            {/* Sentinel and Loading States */}
                            <div ref={observerTarget} className="w-full py-12 flex justify-center items-center">
                                {isFetchingPage && (
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
                                    </div>
                                )}
                                {!hasMore && allHomestays.length > 0 && (
                                    <p className="text-gray-500 font-medium text-sm">You have viewed all extraordinary stays.</p>
                                )}
                            </div>
                        </div>

                    </div>
                ) : (
                    /* FLAT GRID RESULTS */
                    <div className="w-full">
                        {searchGrid.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {searchGrid.map((h, i) => (
                                    <div key={h.id} className="h-full flex justify-start">
                                        <HomestayCard homestay={h} index={i} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 bg-gray-50 rounded-3xl border border-gray-200 border-dashed">
                                <span className="text-5xl mb-4 block">🏡</span>
                                <h3 className="text-2xl font-bold mb-2 text-gray-900">No stays found</h3>
                                <p className="text-gray-500 mb-6 max-w-md mx-auto">We couldn't find any properties matching your current filters. Try changing your destination or vibe.</p>
                                <button
                                    onClick={() => router.push('/search')}
                                    className="px-6 py-2.5 rounded-full border border-gray-300 bg-white text-gray-900 font-bold hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center text-gray-900 font-medium pt-24">Loading Stays...</div>}>
            <SearchResults />
        </Suspense>
    );
}
