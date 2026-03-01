'use client';

import React, { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { CategoryFilterBar } from '@/components/category-filter-bar';
import { HomestaySwimlane } from '@/components/homestay-swimlane';
import { DestinationDiscovery } from '@/components/destination-discovery';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import type L from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SharedPageBanner } from '@/components/shared-page-banner';
import dynamic from 'next/dynamic';
import { LayoutGrid, Map as MapIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CarouselWrapper } from '@/components/ui/carousel-wrapper';

const HomestayMapView = dynamic(() => import('@/components/HomestayMapView'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-secondary/10 animate-pulse rounded-2xl flex items-center justify-center text-muted-foreground">Loading Discovery Map...</div>
});

// --- Destination Component ---
const DESTINATIONS = [
    { name: 'Darjeeling', image: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kalimpong', image: 'https://images.unsplash.com/photo-1626621341517-bbf3e99c0b2c?auto=format&fit=crop&q=80&w=800' },
    { name: 'Kurseong', image: 'https://plus.unsplash.com/premium_photo-1697729606869-e58f00db11ee?auto=format&fit=crop&q=80&w=800' },
    { name: 'Mirik', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=800' },
    { name: 'Sittong', image: 'https://images.unsplash.com/photo-1681285312384-cbca6f2d5930?auto=format&fit=crop&q=80&w=800' },
];

const DestinationCard = React.memo(({ dest, isActive }: { dest: { name: string; image: string }, isActive: boolean }) => {
    return (
        <Link href={`/search?tag=${encodeURIComponent(dest.name)}`} data-active={isActive ? 'true' : undefined} className={`block w-[260px] sm:w-[280px] shrink-0 snap-start group outline-none overflow-hidden rounded-2xl relative shadow-sm hover:shadow-lg transition-all ${isActive ? 'ring-4 ring-[#004d00]/80 ring-offset-2' : ''}`}>
            <div className="w-full aspect-[4/3] bg-gray-100 relative z-0">
                <Image src={dest.image} alt={dest.name} fill sizes="(max-width: 640px) 260px, 280px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                    <h3 className="text-xl font-bold text-white drop-shadow-md">{dest.name}</h3>
                </div>
            </div>
        </Link>
    );
});

DestinationCard.displayName = 'DestinationCard';

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const query = searchParams?.get('query') || '';
    const tag = searchParams?.get('tag') || '';

    const [searchTerm, setSearchTerm] = useState(query);

    // Dynamic Search/Tag Results (imperative — user-driven)
    const [searchGrid, setSearchGrid] = useState<HomestaySummary[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);

    const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
    const [mapBounds, setMapBounds] = useState<{ minLat: number, maxLat: number, minLng: number, maxLng: number } | null>(null);

    const isStorefront = !query && !tag;

    // Sync input box when URL query changes
    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    // ══════════════════════════════════════════════════════════
    //  CACHED QUERIES (Storefront Mode) — Stale-While-Revalidate
    // ══════════════════════════════════════════════════════════

    // Swimlane: Trending Now
    const { data: trendingStays = [] } = useQuery<HomestaySummary[]>({
        queryKey: ['swimlane', 'Trending Now'],
        queryFn: () => api.get('/api/homestays/search?tag=' + encodeURIComponent('Trending Now') + '&page=0&size=6').then(res => res.data.content || []),
        enabled: isStorefront,
    });

    // Swimlane: Explore Offbeat
    const { data: offbeatStays = [] } = useQuery<HomestaySummary[]>({
        queryKey: ['swimlane', 'Explore Offbeat'],
        queryFn: () => api.get('/api/homestays/search?tag=' + encodeURIComponent('Explore Offbeat') + '&page=0&size=6').then(res => res.data.content || []),
        enabled: isStorefront,
    });

    // Swimlane: Featured Escapes
    const { data: featuredStays = [] } = useQuery<HomestaySummary[]>({
        queryKey: ['swimlane', 'featured'],
        queryFn: () => api.get('/api/homestays/search?isFeatured=true&page=0&size=8').then(res => res.data.content || []),
        enabled: isStorefront,
    });

    // All Homestays: Infinite Scroll with caching
    const {
        data: allHomestaysData,
        fetchNextPage: fetchNextAllPage,
        hasNextPage: hasMoreAll,
        isFetchingNextPage: loadingAll,
        isLoading: isAllInitialLoading,
    } = useInfiniteQuery({
        queryKey: ['allHomestays'],
        queryFn: async ({ pageParam = 0 }) => {
            const res = await api.get(`/api/homestays/search?page=${pageParam}&size=12`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: any, allPages: any[]) => {
            if (lastPage.last || (lastPage.content || []).length === 0) return undefined;
            return allPages.length;
        },
        enabled: isStorefront,
    });

    // Flatten infinite query pages into a single array
    const allStays = allHomestaysData?.pages.flatMap((page: any) => page.content || []) || [];

    // Infinite scroll observer
    const observerTarget = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isStorefront) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMoreAll && !loadingAll) {
                    fetchNextAllPage();
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
    }, [fetchNextAllPage, hasMoreAll, loadingAll, isStorefront]);

    // ══════════════════════════════════════════════════════════
    //  IMPERATIVE FETCHES (Search/Tag/Map Mode)
    // ══════════════════════════════════════════════════════════

    // Fetch search/tag results
    useEffect(() => {
        if (!query && !tag) return;

        const fetchSearchResults = async () => {
            setSearchLoading(true);
            try {
                const endpoint = query
                    ? `/api/homestays/search?q=${encodeURIComponent(query)}&page=0&size=50`
                    : `/api/homestays/search?tag=${encodeURIComponent(tag)}&page=0&size=50`;
                const res = await api.get(endpoint);
                setSearchGrid(res.data.content || []);
            } catch (err) {
                console.error("Failed to fetch search results", err);
            } finally {
                setSearchLoading(false);
            }
        };

        fetchSearchResults();
        setMapBounds(null);
    }, [query, tag]);

    // Handle Map Movement
    const handleMapChange = useCallback(async (bounds: L.LatLngBounds) => {
        const newBounds = {
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
            minLng: bounds.getWest(),
            maxLng: bounds.getEast()
        };
        setMapBounds(newBounds);

        try {
            const queryPart = query ? `&q=${encodeURIComponent(query)}` : '';
            const tagPart = tag ? `&tag=${encodeURIComponent(tag)}` : '';
            const res = await api.get(`/api/homestays/search?minLat=${newBounds.minLat}&maxLat=${newBounds.maxLat}&minLng=${newBounds.minLng}&maxLng=${newBounds.maxLng}${queryPart}${tagPart}&size=100`);

            const homestaysInArea = res.data.content || [];
            if (query || tag) {
                setSearchGrid(homestaysInArea);
            }
        } catch (err) {
            console.error("Map search failed", err);
        }
    }, [query, tag]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
        } else {
            router.push('/search');
        }
    };

    const isLoading = isStorefront ? isAllInitialLoading : searchLoading;

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
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between py-2">
                    <CategoryFilterBar />
                </div>
            </div>

            {/* STEP 3: Bounded Core UI Layout Area */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-12 md:gap-16">
                {isLoading && allStays.length === 0 && !trendingStays.length ? (
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
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                <div className="text-left">
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1 tracking-tight italic">Destination Discovery</h2>
                                    <p className="text-gray-500 text-base">Unwind in the most sought-after hills of North Bengal.</p>
                                </div>
                            </div>
                            <DestinationDiscovery />
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
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight italic relative">
                                    All Homestays
                                    <span className="absolute -bottom-1 left-0 w-12 h-1 bg-[#004d00] rounded-full"></span>
                                </h2>

                                <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50 shadow-sm self-end sm:self-auto">
                                    <button
                                        onClick={() => setViewType('grid')}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                            viewType === 'grid'
                                                ? "bg-white text-[#004d00] shadow-md scale-105"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                        )}
                                    >
                                        <LayoutGrid className={cn("w-4 h-4", viewType === 'grid' ? "animate-pulse" : "")} />
                                        Grid
                                    </button>
                                    <button
                                        onClick={() => setViewType('map')}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                            viewType === 'map'
                                                ? "bg-white text-[#004d00] shadow-md scale-105"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                        )}
                                    >
                                        <MapIcon className={cn("w-4 h-4", viewType === 'map' ? "animate-pulse" : "")} />
                                        Map
                                    </button>
                                </div>
                            </div>

                            {viewType === 'map' ? (
                                <div className="h-[600px] w-full mb-12">
                                    <ErrorBoundary name="Discovery Map" fallback={<div className="h-[600px] w-full bg-red-50 rounded-2xl flex items-center justify-center text-red-600 font-medium border border-red-100 italic">Map failed to initialize. Please refresh or try again later.</div>}>
                                        <HomestayMapView homestays={allStays} onMapChange={handleMapChange} />
                                    </ErrorBoundary>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {allStays.map((h, i) => (
                                        <HomestayCard key={`${h.id}-${i}`} homestay={h} index={i % 12} />
                                    ))}
                                </div>
                            )}

                            {/* Scroll Listener Node */}
                            <div id="load-more-trigger" ref={observerTarget} className="w-full py-12 flex justify-center items-center h-24">
                                {loadingAll && (
                                    <div className="flex space-x-2">
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
                                    </div>
                                )}
                                {!hasMoreAll && allStays.length > 0 && (
                                    <p className="text-gray-500 font-medium text-sm">You have reached the end of the line.</p>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    /* Search Term Direct Results */
                    <div className="w-full">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                            <h2 className="text-2xl font-bold italic relative">
                                Search Results
                                <span className="absolute -bottom-1 left-0 w-12 h-1 bg-[#004d00] rounded-full"></span>
                            </h2>
                            <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50 shadow-sm self-end sm:self-auto">
                                <button
                                    onClick={() => setViewType('grid')}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                        viewType === 'grid'
                                            ? "bg-white text-[#004d00] shadow-md scale-105"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                    )}
                                >
                                    <LayoutGrid className={cn("w-4 h-4", viewType === 'grid' ? "animate-pulse" : "")} />
                                    Grid
                                </button>
                                <button
                                    onClick={() => setViewType('map')}
                                    className={cn(
                                        "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                        viewType === 'map'
                                            ? "bg-white text-[#004d00] shadow-md scale-105"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                    )}
                                >
                                    <MapIcon className={cn("w-4 h-4", viewType === 'map' ? "animate-pulse" : "")} />
                                    Map
                                </button>
                            </div>
                        </div>

                        {viewType === 'map' ? (
                            <div className="h-[600px] w-full mb-12">
                                <ErrorBoundary name="Search Results Map">
                                    <HomestayMapView homestays={searchGrid} onMapChange={handleMapChange} />
                                </ErrorBoundary>
                            </div>
                        ) : searchGrid.length > 0 ? (
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
