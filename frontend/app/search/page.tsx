'use client';

import React, { useEffect, useState, Suspense, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { EmojiCategoryFilter } from '@/components/emoji-category-filter';
import { HomestaySwimlane } from '@/components/homestay-swimlane';
import { DestinationDiscovery } from '@/components/destination-discovery';
import { HomestayCard, HomestaySummary } from '@/components/homestay-card';
import type L from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { SharedPageBanner } from '@/components/shared-page-banner';
import dynamic from 'next/dynamic';
import { LayoutGrid, Map as MapIcon, Search, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { homestayApi } from '@/lib/api/homestays';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CarouselWrapper } from '@/components/ui/carousel-wrapper';
import { EmptyState } from '@/components/ui/empty-state';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { queryKeys } from '@/lib/queryKeys';

const HomestayMapView = dynamic(() => import('@/components/HomestayMapView'), {
    ssr: false,
    loading: () => (
        <div className="h-full min-h-[500px] w-full bg-secondary/10 flex items-center justify-center overflow-hidden lg:rounded-2xl border border-stone-200 relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-muted-foreground/60 drop-shadow-sm">
                <MapIcon className="w-10 h-10 animate-pulse" />
                <span className="font-bold tracking-tight text-sm uppercase">Loading Map...</span>
            </div>
            {/* Fake Controls Skeleton */}
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex flex-col gap-0 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden lg:hidden opacity-50">
                <div className="w-11 h-11 border-b border-gray-100 bg-gray-50"></div>
                <div className="w-11 h-11 border-b border-gray-100 bg-gray-50"></div>
                <div className="w-11 h-11 bg-gray-50"></div>
            </div>
        </div>
    )
});


const VIBE_CARDS = [
    { label: 'Mountain View', tag: 'Mountain View', image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=600' },
    { label: 'Nature & Eco', tag: 'Nature & Eco', image: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=600' },
    { label: 'Tea Garden', tag: 'Tea Garden', image: 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?auto=format&fit=crop&q=80&w=600' },
    { label: 'Heritage', tag: 'Heritage', image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=600' },
    { label: 'Offbeat', tag: 'Explore Offbeat', image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=600' },
];

function VibeCardsSection({ onCategoryChange, activeCategory }: { onCategoryChange: (c: string) => void, activeCategory: string }) {
    return (
        <section className="mb-10 border-b border-stone-200/60 pb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tighter leading-[1.1] text-slate-900 mb-6">Find Your Vibe</h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar md:grid md:grid-cols-5 md:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {VIBE_CARDS.map(vibe => {
                    const isActive = activeCategory === vibe.tag;
                    return (
                        <button
                            key={vibe.tag}
                            onClick={() => onCategoryChange(vibe.tag)}
                            className={cn(
                                "relative w-[200px] md:w-full md:aspect-[4/5] h-[250px] md:h-auto rounded-2xl overflow-hidden shrink-0 snap-start group text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
                                isActive ? "ring-4 ring-amber-500 ring-offset-2" : ""
                            )}
                        >
                            <Image
                                src={vibe.image}
                                alt={vibe.label}
                                fill
                                sizes="(max-width: 768px) 200px, 20vw"
                                className="object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-4">
                                <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md">{vibe.label}</h3>
                            </div>
                        </button>
                    );
                })}
            </div>
        </section>
    );
}

function ExploreByRegionSection() {
    const REGIONS = [
        { name: 'West Bengal', slug: 'west-bengal', image: '/states/thumb-west-bengal.webp' },
        { name: 'Sikkim', slug: 'sikkim', image: '/states/thumb-sikkim.webp' },
        { name: 'Assam', slug: 'assam', image: '/states/thumb-assam.webp' },
        { name: 'Meghalaya', slug: 'meghalaya', image: '/states/thumb-meghalaya.webp' },
        { name: 'Arunachal Pradesh', slug: 'arunachal-pradesh', image: '/states/thumb-arunachal-pradesh.png' },
    ];

    return (
        <section className="mb-4 border-b border-stone-200/60 pb-12">
            <h2 className="font-serif text-3xl md:text-4xl font-medium tracking-tighter leading-[1.1] text-slate-900 mb-6">Explore by Region</h2>
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar md:grid md:grid-cols-5 md:overflow-visible" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {REGIONS.map(region => (
                    <Link
                        key={region.slug}
                        href={`/state/${region.slug}`}
                        className="relative w-[240px] md:w-full aspect-[4/5] rounded-2xl overflow-hidden shrink-0 snap-center group shadow-md hover:shadow-xl transition-all duration-500"
                    >
                        <Image
                            src={region.image}
                            alt={region.name}
                            fill
                            sizes="(max-width: 768px) 240px, 20vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-4">
                            <h3 className="text-white font-bold text-lg leading-tight drop-shadow-md tracking-tight">{region.name}</h3>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

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
            <div className="w-full aspect-[4/3] bg-stone-100 relative z-0">
                <Image src={dest.image} alt={dest.name} fill sizes="(max-width: 640px) 260px, 280px" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]" loading="lazy" />
                <div className="absolute inset-0 bg-stone-900/20 group-hover:bg-stone-900/10 transition-colors z-10" />
                <div className="absolute inset-x-0 bottom-0 p-4 z-20">
                    <h3 className="text-xl font-bold text-white drop-shadow-md tracking-tight">{dest.name}</h3>
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

    const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
    const [mapBounds, setMapBounds] = useState<{ minLat: number, maxLat: number, minLng: number, maxLng: number } | null>(null);
    const [activeHomestayId, setActiveHomestayId] = useState<string | null>(null);
    const [selectedHomestayId, setSelectedHomestayId] = useState<string | null>(null);

    const isStorefront = !query && !tag;

    const handleCategoryChange = (newCategory: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '');
        if (tag === newCategory) {
            params.delete('tag');
        } else {
            params.set('tag', newCategory);
        }
        router.push(`/search?${params.toString()}`);
    };

    // Sync input box when URL query changes
    useEffect(() => {
        setSearchTerm(query);
    }, [query]);

    const searchQuery = useQuery<HomestaySummary[]>({
        queryKey: queryKeys.homestays.search({
            query,
            tag,
            page: 0,
            size: 50,
        }),
        queryFn: async () => {
            const endpoint = query
                ? `q=${encodeURIComponent(query)}&page=0&size=50`
                : `tag=${encodeURIComponent(tag)}&page=0&size=50`;
            const res = await homestayApi.search(endpoint);
            return res.data.content || [];
        },
        enabled: !!query || !!tag,
        placeholderData: keepPreviousData,
        staleTime: 1000 * 60 * 2,
    });

    const boundsQuery = useQuery<HomestaySummary[]>({
        queryKey: queryKeys.homestays.bounds({
            bounds: mapBounds,
            query,
            tag,
        }),
        queryFn: async () => {
            if (!mapBounds) return [];
            const queryPart = query ? `&q=${encodeURIComponent(query)}` : '';
            const tagPart = tag ? `&tag=${encodeURIComponent(tag)}` : '';
            const res = await homestayApi.search(
                `minLat=${mapBounds.minLat}&maxLat=${mapBounds.maxLat}&minLng=${mapBounds.minLng}&maxLng=${mapBounds.maxLng}${queryPart}${tagPart}&size=100`
            );
            return res.data.content || [];
        },
        enabled: !!mapBounds,
        staleTime: 1000 * 30,
    });

    // ══════════════════════════════════════════════════════════
    //  CACHED QUERIES (Storefront Mode) — Stale-While-Revalidate
    // ══════════════════════════════════════════════════════════

    // Swimlane: Trending Now
    const { data: trendingStays = [] } = useQuery<HomestaySummary[]>({
        queryKey: queryKeys.homestays.swimlane('Trending Now'),
        queryFn: () => homestayApi.search('tag=' + encodeURIComponent('Trending Now') + '&page=0&size=6').then(res => res.data.content || []),
        enabled: isStorefront,
        staleTime: 1000 * 60 * 30,
    });

    // Swimlane: Explore Offbeat
    const { data: offbeatStays = [] } = useQuery<HomestaySummary[]>({
        queryKey: queryKeys.homestays.swimlane('Explore Offbeat'),
        queryFn: () => homestayApi.search('tag=' + encodeURIComponent('Explore Offbeat') + '&page=0&size=6').then(res => res.data.content || []),
        enabled: isStorefront,
        staleTime: 1000 * 60 * 30,
    });

    // Swimlane: Featured Escapes
    const { data: featuredStays = [] } = useQuery<HomestaySummary[]>({
        queryKey: queryKeys.homestays.featured,
        queryFn: () => homestayApi.search('isFeatured=true&page=0&size=8').then(res => res.data.content || []),
        enabled: isStorefront,
        staleTime: 1000 * 60 * 30,
    });

    // All Homestays: Infinite Scroll with caching
    const {
        data: allHomestaysData,
        fetchNextPage: fetchNextAllPage,
        hasNextPage: hasMoreAll,
        isFetchingNextPage: loadingAll,
        isLoading: isAllInitialLoading,
    } = useInfiniteQuery({
        queryKey: queryKeys.homestays.all,
        queryFn: async ({ pageParam = 0 }) => {
            const res = await homestayApi.search(`page=${pageParam}&size=12`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage: any, allPages: any[]) => {
            if (lastPage.last || (lastPage.content || []).length === 0) return undefined;
            return allPages.length;
        },
        enabled: isStorefront,
        staleTime: 1000 * 60 * 30,
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

    // Handle Map Movement
    const handleMapChange = useCallback((bounds: L.LatLngBounds) => {
        const newBounds = {
            minLat: bounds.getSouth(),
            maxLat: bounds.getNorth(),
            minLng: bounds.getWest(),
            maxLng: bounds.getEast()
        };
        setMapBounds(newBounds);
    }, [query, tag]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            router.push(`/search?query=${encodeURIComponent(searchTerm)}`);
        } else {
            router.push('/search');
        }
    };

    const effectiveSearchResults = mapBounds ? (boundsQuery.data ?? []) : (searchQuery.data ?? []);

    const isLoading = isStorefront
        ? isAllInitialLoading
        : (mapBounds ? boundsQuery.isFetching : searchQuery.isFetching);

    return (
        <div className="min-h-screen bg-[#FAF9F6] text-slate-900 pb-20">
            {/* STEP 1: Global Brand Green Banner */}
            <SharedPageBanner
                title={query ? `"${query}"` : tag ? tag : 'Discover Offbeat Stays Across the Eastern Himalayas'}
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
                        className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold rounded-xl sm:rounded-full hover:bg-slate-800 transition-colors shadow-md hover:shadow-lg"
                    >
                        Search
                    </button>
                </motion.form>
            </SharedPageBanner>

            {/* STEP 2: Sticky Edge-to-Edge Category Bar */}
            <div className="sticky top-0 z-[900] bg-[#FAF9F6]/80 backdrop-blur-md border-b border-stone-200/60 px-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between py-1.5">
                    <EmojiCategoryFilter
                        activeCategory={tag}
                        onCategoryChange={handleCategoryChange}
                    />
                </div>
            </div>

            {/* STEP 3: Bounded Core UI Layout Area */}
            <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col gap-8">
                {isLoading && allStays.length === 0 && !trendingStays.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className={cn("flex flex-col space-y-3", i === 0 ? 'md:col-span-2' : '')}>
                                <Skeleton className="relative w-full aspect-[4/3] rounded-2xl bg-stone-200/60" />
                                <Skeleton className="h-5 w-3/4 bg-stone-200/60" />
                                <Skeleton className="h-4 w-1/2 bg-stone-200/60" />
                            </div>
                        ))}
                    </div>
                ) : isStorefront ? (
                    <>
                        <VibeCardsSection onCategoryChange={handleCategoryChange} activeCategory={tag} />

                        <ExploreByRegionSection />

                        <section className="mb-12 border-b border-stone-200/60 pb-12">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                                <div className="text-left">
                                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter leading-[1.1] text-slate-900 mb-2">Top Destinations Across Our Regions</h2>
                                    <p className="text-slate-500 text-base font-medium">Explore the hills, one town at a time.</p>
                                </div>
                            </div>
                            <DestinationDiscovery />
                        </section>

                        <HomestaySwimlane
                            title="Trending Now"
                            subtitle="Places travelers are loving this week"
                            homestays={trendingStays}
                        />
                        <HomestaySwimlane
                            title="Featured Escapes"
                            subtitle="Handpicked escapes curated by travelers"
                            homestays={featuredStays}
                        />
                        <HomestaySwimlane
                            title="Explore Offbeat"
                            subtitle="Hidden gems away from tourist crowds"
                            homestays={offbeatStays}
                        />

                        <div className="border-t border-stone-200/60 pt-24 pb-12 mt-16 mb-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                                <div className="max-w-4xl">
                                    <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter leading-[1.1] text-slate-900 relative inline-block">
                                        Browse All Verified Homestays Across Our Regions
                                        <span className="absolute -bottom-3 left-0 w-20 h-1 bg-gradient-to-r from-amber-500 to-amber-400 rounded-full"></span>
                                    </h2>
                                    <p className="text-slate-500 text-lg md:text-xl font-medium mt-6">Handpicked escapes curated by travelers.</p>
                                </div>

                                <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50 shadow-sm self-end sm:self-auto">
                                    <button
                                        onClick={() => setViewType('grid')}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                            viewType === 'grid'
                                                ? "bg-white text-blue-600 shadow-md shadow-blue-500/20 scale-105"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                        )}
                                    >
                                        <LayoutGrid className="w-4 h-4" />
                                        Grid
                                    </button>
                                    <button
                                        onClick={() => setViewType('map')}
                                        className={cn(
                                            "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300",
                                            viewType === 'map'
                                                ? "bg-white text-blue-600 shadow-md shadow-blue-500/20 scale-105"
                                                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
                                        )}
                                    >
                                        <MapIcon className="w-4 h-4" />
                                        Map
                                    </button>
                                </div>
                            </div>

                            {viewType === 'map' ? (
                                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-8 lg:mb-12 relative w-full items-start">
                                    {/* Left: Map (Fullscreen on mobile, Sticky split on desktop) */}
                                    <div className="fixed inset-0 z-[40] lg:sticky lg:top-[80px] lg:z-auto w-full lg:h-[calc(100vh-80px)] overflow-hidden lg:rounded-2xl border border-stone-200">
                                        <ErrorBoundary name="Discovery Map" fallback={<div className="h-full w-full bg-red-50 flex items-center justify-center text-red-600 font-medium italic">Map failed to initialize. Please refresh or try again later.</div>}>
                                            <HomestayMapView
                                                homestays={allStays}
                                                onMapChange={handleMapChange}
                                                hoveredHomestayId={activeHomestayId}
                                                selectedHomestayId={selectedHomestayId}
                                                setSelectedHomestayId={setSelectedHomestayId}
                                            />
                                        </ErrorBoundary>

                                        {/* Mobile Floating Preview Card (Airbnb Style) */}
                                        <AnimatePresence>
                                            {selectedHomestayId && (
                                                <div className="absolute lg:hidden bottom-8 inset-x-0 z-[700] flex justify-center px-4 pointer-events-none">
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 100 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0, y: 100 }}
                                                        drag="x"
                                                        dragConstraints={{ left: 0, right: 0 }}
                                                        onDragEnd={(_, info) => {
                                                            const threshold = 50;
                                                            if (info.offset.x < -threshold) {
                                                                // Swipe Left -> Next
                                                                const currentIndex = allStays.findIndex(h => h.id === selectedHomestayId);
                                                                if (currentIndex < allStays.length - 1) {
                                                                    setSelectedHomestayId(allStays[currentIndex + 1].id);
                                                                }
                                                            } else if (info.offset.x > threshold) {
                                                                // Swipe Right -> Prev
                                                                const currentIndex = allStays.findIndex(h => h.id === selectedHomestayId);
                                                                if (currentIndex > 0) {
                                                                    setSelectedHomestayId(allStays[currentIndex - 1].id);
                                                                }
                                                            }
                                                        }}
                                                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                                        className="pointer-events-auto w-full max-w-[340px] bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.25)] overflow-hidden border border-gray-100 relative group active:scale-95 transition-transform"
                                                    >
                                                        {allStays.find(h => h.id === selectedHomestayId) && (() => {
                                                            const h = allStays.find(h => h.id === selectedHomestayId);
                                                            return (
                                                                <Link href={`/homestays/${h.id}`} className="flex h-[110px]">
                                                                    <div className="w-[110px] h-full shrink-0 relative bg-gray-100">
                                                                        <Image
                                                                            src={h.media?.[0]?.url || '/images/hero_background.jpg'}
                                                                            alt={h.name}
                                                                            fill
                                                                            className="object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                                                        <div>
                                                                            <div className="flex justify-between items-start gap-2">
                                                                                <h3 className="font-bold text-sm text-gray-900 line-clamp-1 tracking-tight">{h.name}</h3>
                                                                                <div className="flex items-center gap-1 shrink-0 text-xs font-bold">
                                                                                    <Star className="w-3 h-3 fill-gray-900" />
                                                                                    {(h.vibeScore || 4.5).toFixed(1)}
                                                                                </div>
                                                                            </div>
                                                                            <p className="text-[11px] text-gray-500 mt-0.5 truncate uppercase tracking-wider font-semibold">
                                                                                {h.locationName || 'Eastern Himalayas'}
                                                                            </p>
                                                                        </div>
                                                                        <div className="flex items-end justify-between">
                                                                            <div className="text-gray-900 font-black text-sm">
                                                                                ₹{h.pricePerNight.toLocaleString()} <span className="text-[10px] font-normal text-gray-500">/ night</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.preventDefault();
                                                                            e.stopPropagation();
                                                                            setSelectedHomestayId(null);
                                                                        }}
                                                                        className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-md border border-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 z-50 transition-colors"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                </Link>
                                                            );
                                                        })()}
                                                    </motion.div>
                                                </div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Right: Desktop Listings Rail (Native window scrollable) */}
                                    <div className="hidden lg:flex w-full flex-col bg-transparent">
                                        <div className="flex-1 flex flex-col gap-6 pb-20">
                                            {allStays.map((homestay: any) => (
                                                <div
                                                    key={homestay.id}
                                                    className="w-full transition-all duration-300"
                                                    onMouseEnter={() => setActiveHomestayId(homestay.id)}
                                                    onMouseLeave={() => setActiveHomestayId(null)}
                                                >
                                                    <HomestayCard homestay={homestay} isHighlighted={activeHomestayId === homestay.id} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : allStays.length > 0 ? (
                                <div className="space-y-8">
                                    {/* Zone 1: Cinematic Hero Card */}
                                    {allStays[0] && (
                                        <Link href={`/homestays/${allStays[0].id}`} className="block group rounded-2xl overflow-hidden relative focus:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                                            <div className="relative w-full aspect-[4/3] md:aspect-[16/9] bg-gray-100">
                                                <OptimizedImage
                                                    src={allStays[0].media?.[0]?.url || '/images/hero_background.jpg'}
                                                    alt={allStays[0].name}
                                                    width={1400}
                                                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                                <div className="absolute inset-x-0 bottom-0 p-6 md:p-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                                                    <div>
                                                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold text-white uppercase tracking-wider mb-3">
                                                            Editor&apos;s Pick
                                                        </span>
                                                        <h3 className="text-2xl md:text-4xl font-serif font-medium text-white tracking-tighter leading-tight">
                                                            {allStays[0].name.replace(/\s+All$/i, '')}
                                                        </h3>
                                                        <p className="text-white/80 text-sm md:text-base mt-1">
                                                            {allStays[0].destination ? `${allStays[0].destination.name}, ${allStays[0].destination.district}` : (allStays[0].locationName || 'North Bengal Hills')}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 shrink-0">
                                                        <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                                                            <Star className="w-4 h-4 fill-white text-white" />
                                                            <span className="text-sm font-bold text-white">{(allStays[0].vibeScore || 4.5).toFixed(1)}</span>
                                                        </div>
                                                        <span className="text-white font-bold text-lg md:text-xl">
                                                            From ₹{allStays[0].pricePerNight.toLocaleString()} <span className="font-normal text-white/70 text-sm">/night</span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    {/* Zone 2: Secondary 3-Card Row */}
                                    {allStays.length > 1 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                            {allStays.slice(1, 4).map((h, i) => (
                                                <HomestayCard key={h.id} homestay={h} index={i + 1} />
                                            ))}
                                        </div>
                                    )}

                                    {/* Zone 3: Uniform Grid (remaining cards) */}
                                    {allStays.length > 4 && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {allStays.slice(4).map((h, i) => (
                                                <HomestayCard key={`${h.id}-${i + 4}`} homestay={h} index={(i + 4) % 12} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : !loadingAll && (
                                <div className="w-full max-w-3xl mx-auto mt-6">
                                    <EmptyState
                                        icon={<MapIcon className="w-8 h-8 text-muted-foreground" />}
                                        title="No homestays found"
                                        description="We are constantly adding new properties. Check back soon for more stays."
                                    />
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
                            <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl font-medium tracking-tighter leading-none text-slate-900 relative">
                                Search Results
                                <span className="absolute -bottom-1 left-0 w-16 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full"></span>
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
                                    <LayoutGrid className="w-4 h-4" />
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
                                    <MapIcon className="w-4 h-4" />
                                    Map
                                </button>
                            </div>
                        </div>

                        {viewType === 'map' ? (
                            <div className="h-[calc(100vh-80px)] w-full mb-12 rounded-2xl overflow-hidden border border-stone-200">
                                <ErrorBoundary name="Search Results Map">
                                    <HomestayMapView
                                        homestays={effectiveSearchResults}
                                        onMapChange={handleMapChange}
                                        hoveredHomestayId={activeHomestayId}
                                    />
                                </ErrorBoundary>
                            </div>
                        ) : effectiveSearchResults.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {effectiveSearchResults.map((h, i) => {
                                    const isFeatured = i % 12 === 0;
                                    return (
                                        <div
                                            key={h.id}
                                            className={cn(isFeatured ? 'md:col-span-2' : '')}
                                            onMouseEnter={() => setActiveHomestayId(h.id)}
                                            onMouseLeave={() => setActiveHomestayId(null)}
                                        >
                                            <HomestayCard
                                                homestay={h}
                                                index={i}
                                                featured={isFeatured}
                                                isHighlighted={activeHomestayId === h.id}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="w-full max-w-3xl mx-auto mt-6 flex flex-col items-center">
                                <EmptyState
                                    icon={<Search className="w-8 h-8 text-muted-foreground" />}
                                    title="No stays found"
                                    description="We couldn't find any properties matching your current filters. Try changing your destination or vibe."
                                />
                                <button
                                    onClick={() => router.push('/search')}
                                    className="mt-6 px-6 py-2.5 rounded-full border border-gray-300 bg-white text-gray-900 font-bold hover:bg-gray-50 transition-colors shadow-sm"
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
