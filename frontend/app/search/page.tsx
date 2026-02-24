'use client';

import React, { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestaySwimlane } from '@/components/homestay-swimlane';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import { Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import Link from 'next/link';
import { SharedPageBanner } from '@/components/shared-page-banner';

// --- Destination Component ---
const DESTINATIONS = [
    { name: 'Darjeeling', image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kalimpong', image: 'https://images.unsplash.com/photo-1626621341517-bbf3e99c0b2c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kurseong', image: 'https://plus.unsplash.com/premium_photo-1697729606869-e58f00db11ee?auto=format&fit=crop&q=80&w=800' },
    { name: 'Mirik', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800' },
    { name: 'Sittong', image: 'https://images.unsplash.com/photo-1681285312384-cbca6f2d5930?auto=format&fit=crop&q=80&w=800' },
];

function DestinationCard({ dest, isActive }: { dest: { name: string; image: string }, isActive: boolean }) {
    return (
        <Link href={`/search?tag=${encodeURIComponent(dest.name)}`} data-active={isActive ? 'true' : undefined} className={`block w-[260px] sm:w-[280px] shrink-0 snap-start group outline-none overflow-hidden rounded-2xl relative shadow-sm hover:shadow-lg transition-all ${isActive ? 'ring-4 ring-[#004d00]/80 ring-offset-2' : ''}`}>
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

    // Dynamic Top Grid
    const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);

    // Swimlanes
    const [trendingStays, setTrendingStays] = useState<HomestaySummary[]>([]);
    const [offbeatStays, setOffbeatStays] = useState<HomestaySummary[]>([]);
    const [featuredStays, setFeaturedStays] = useState<HomestaySummary[]>([]);

    // Infinite Scroll Integration
    const [allStays, setAllStays] = useState<HomestaySummary[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loading, setLoading] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Sync input box when URL query changes
    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    // Fast Initial Fetch
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsInitialLoading(true);
            try {
                if (query || tag) {
                    const endpoint = query
                        ? `/api/homestays/search?q=${encodeURIComponent(query)}&page=0&size=50`
                        : `/api/homestays/search?tag=${encodeURIComponent(tag)}&page=0&size=50`;

                    const res = await api.get(endpoint);
                    // Handle Page<HomestayDto.Response> structure
                    setSearchGrid(res.data.content || []);
                } else {
                    const [res1, res2, res3] = await Promise.all([
                        api.get('/api/homestays/search?tag=' + encodeURIComponent('Trending Now') + '&page=0&size=6'),
                        api.get('/api/homestays/search?tag=' + encodeURIComponent('Explore Offbeat') + '&page=0&size=6'),
                        api.get('/api/homestays/search?isFeatured=true&page=0&size=8')
                    ]);
                    setTrendingStays(res1.data.content || []);
                    setOffbeatStays(res2.data.content || []);
                    setFeaturedStays(res3.data.content || []);
                }
            } catch (err) {
                console.error("Failed to fetch layout feeds", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        fetchInitialData();
        // Reset infinite scroll engine
        setAllStays([]);
        setPage(0);
        setHasMore(true);
    }, [query, tag]);

    // Paged "All Homestays" Loader
    const fetchNextPage = useCallback(async () => {
        if (!hasMore || loading) return;

        // Prevent generic grid loading if querying a specific tag or term
        if (query || tag) return;

        setLoading(true);
        try {
            const res = await api.get(`/api/homestays/search?page=${page}&size=12`);
            const newData = res.data; // Mapped to Spring Page<>

            const fetchedContent = newData.content || [];

            setAllStays(prev => [...prev, ...fetchedContent]);

            if (newData.last || fetchedContent.length === 0) {
                setHasMore(false);
            } else {
                setPage(prev => prev + 1);
            }
        } catch (error) {
            console.error('Failed to resolve paginated payload', error);
        } finally {
            setLoading(false);
        }
    }, [hasMore, loading, page, query, tag]);

    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        // Instead of a one-time bind, we poll slightly or just ensure it binds when ref exists
        const target = observerTarget.current;
        if (target) {
            observer.observe(target);
        }

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [fetchNextPage, isInitialLoading, query, tag]);

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
        <div className="min-h-screen bg-white text-gray-900 pb-20">
            {/* STEP 1: Global Brand Green Banner */}
            <SharedPageBanner
                title={query ? `"${query}"` : tag ? tag : 'Discover North Bengal'}
            >
                <motion.form
                    onSubmit={handleSearch}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row gap-2 bg-white rounded-2xl sm:rounded-full p-2 sm:p-2 shadow-xl relative z-10"
                >
                    <div className="flex-1 flex items-center gap-3 px-4 py-2 sm:py-0 w-full sm:w-auto">
                        <Search className="w-6 h-6 text-gray-400 flex-none" />
                        <input
                            type="text"
                            placeholder="Where do you want to go?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none text-lg font-medium"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-3.5 bg-[#004d00] text-white font-bold rounded-xl sm:rounded-full hover:bg-[#003300] transition-colors shadow-sm"
                    >
                        Search
                    </button>
                </motion.form>
            </SharedPageBanner>

            {/* STEP 2: Sticky Edge-to-Edge Category Bar */}
            <CategoryFilterBar />

            {/* STEP 3: Bounded Core UI Layout Area */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12 md:gap-16">
                {isInitialLoading ? (
                    <div className="flex gap-4 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex flex-col space-y-3 w-[280px] shrink-0">
                                <Skeleton className="relative w-full aspect-[4/3] rounded-2xl bg-gray-100" />
                                <Skeleton className="h-5 w-3/4 bg-gray-100" />
                                <Skeleton className="h-4 w-1/2 bg-gray-100" />
                            </div>
                        ))}
                    </div>
                ) : isStorefront ? (
                    <>
                        <section>
                            <div className="mb-6 text-left">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight">Top Destinations</h2>
                                <p className="text-gray-500 text-base">Unwind in the most sought-after hills.</p>
                            </div>
                            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6">
                                {DESTINATIONS.map(d => <DestinationCard key={d.name} dest={d} isActive={tag === d.name} />)}
                            </div>
                        </section>

                        <HomestaySwimlane
                            title="Trending Now"
                            emoji="🔥"
                            homestays={trendingStays}
                        />
                        <HomestaySwimlane
                            title="Featured Escapes"
                            emoji="⭐"
                            homestays={featuredStays}
                        />
                        <HomestaySwimlane
                            title="Explore Offbeat"
                            emoji="🌿"
                            homestays={offbeatStays}
                        />

                        {/* STEP 4: Proper Infinite Paginated Grid */}
                        <div className="border-t border-gray-100 pt-16">
                            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-8">All Homestays</h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {allStays.map((h, i) => (
                                    <HomestayCard key={`${h.id}-${i}`} homestay={h} index={i % 12} />
                                ))}
                            </div>

                            {/* Scroll Listener Node */}
                            <div id="load-more-trigger" ref={observerTarget} className="w-full py-12 flex justify-center items-center h-24">
                                {loading && (
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
                                    </div>
                                )}
                                {!hasMore && allStays.length > 0 && (
                                    <p className="text-gray-500 font-medium text-sm">You have reached the end of the line.</p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Search Term Direct Results */
                    <div className="w-full">
                        {searchGrid.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {searchGrid.map((h, i) => (
                                    <HomestayCard key={h.id} homestay={h} index={i} />
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
            </main>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-32 text-center font-medium">Loading Stays...</div>}>
            <SearchResults />
        </Suspense>
    );
}
