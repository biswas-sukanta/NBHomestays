'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SharedPageBanner } from '@/components/shared-page-banner'; // Assuming this exists for hero
import { HomestayCard } from '@/components/homestay-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { MapPin, Info, LayoutGrid, Map as MapIcon, SlidersHorizontal } from 'lucide-react';
import { AnimatedHeroBackground } from '@/components/ui/animated-hero-background';
import { EmptyState } from '@/components/ui/empty-state';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { EmojiCategoryFilter } from '@/components/emoji-category-filter';

const HomestayMapView = dynamic(() => import('@/components/HomestayMapView'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-secondary/10 animate-pulse rounded-2xl flex items-center justify-center text-muted-foreground">Loading Discovery Map...</div>
});

export default function DestinationPage() {
    const { slug } = useParams();
    const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [hoveredMarkerId, setHoveredMarkerId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState('');
    const { ref, inView } = useInView();

    const { data: destination, isLoading: destLoading } = useQuery({
        queryKey: ['destination', slug],
        queryFn: () => api.get(`/api/destinations/${slug}`).then(res => res.data)
    });

    const {
        data: infiniteData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading: homestaysLoading
    } = useInfiniteQuery({
        queryKey: ['destination-homestays', slug, activeCategory],
        queryFn: async ({ pageParam = 0 }) => {
            const tagParam = activeCategory ? `&tag=${encodeURIComponent(activeCategory)}` : '';
            const res = await api.get(`/api/destinations/${slug}/homestays?page=${pageParam}&size=10${tagParam}`);
            return res.data;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            if (lastPage.last || !lastPage.content) return undefined;
            return lastPage.number + 1;
        }
    });

    React.useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, hasNextPage, fetchNextPage]);

    const homestays = React.useMemo(() => {
        if (!infiniteData?.pages) return [];
        return infiniteData.pages.flatMap(page => {
            if (page && Array.isArray(page.content)) return page.content;
            if (Array.isArray(page)) return page;
            return [];
        });
    }, [infiniteData]);

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(prev => prev === cat ? '' : cat);
    };

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* Edge-to-Edge Hero Banner */}
            <AnimatedHeroBackground
                imageUrl={`/destinations/${destination.localImageName}`}
                className="h-[70vh] w-full"
                overlayClassName="bg-black/40"
            >
                <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-sm font-medium mb-4">
                            Explore {destination.district}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl italic tracking-tight font-heading">
                            {destination.heroTitle}
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light drop-shadow">
                            {destination.description}
                        </p>
                    </motion.div>
                </div>
            </AnimatedHeroBackground>

            <div className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-gray-100 pb-8">
                    <div>
                        <div className="flex items-center gap-2 text-[#004d00] font-medium mb-2">
                            <MapPin className="w-4 h-4" />
                            <span>{destination.name}, {destination.district}</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Available Homestays</h2>
                    </div>
                    <div className="flex flex-wrap gap-2 md:max-w-[50%]">
                        {destination?.tags?.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 hidden sm:block">
                        {homestays.length} stays in {destination.name}
                    </h3>
                    <div className="flex bg-gray-100/50 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50 shadow-sm ml-auto">
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

                {homestaysLoading && !infiniteData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)}
                    </div>
                ) : homestays.length > 0 ? (
                    viewType === 'map' ? (
                        <div className="flex flex-col lg:flex-row gap-0 h-[calc(100vh-100px)] -mx-4 lg:-mx-8">
                            {/* Left: Map (1.5fr) */}
                            <div className="w-full lg:w-[60%] h-[400px] lg:h-full overflow-hidden border-r border-stone-200 relative">
                                <HomestayMapView
                                    homestays={homestays}
                                    hoveredHomestayId={hoveredId || hoveredMarkerId}
                                    onMarkerHover={setHoveredMarkerId}
                                    onMarkerLeave={() => setHoveredMarkerId(null)}
                                />
                            </div>

                            {/* Right: Listings (1fr) */}
                            <div className="w-full lg:w-[40%] h-full flex flex-col bg-white">
                                {/* Sticky Filter Bar */}
                                <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-bottom border-stone-100 px-6 py-4">
                                    <div className="flex items-center gap-3 mb-2">
                                        <SlidersHorizontal className="w-4 h-4 text-stone-400" />
                                        <span className="text-xs font-bold uppercase tracking-widest text-stone-500">Filters</span>
                                    </div>
                                    <EmojiCategoryFilter
                                        activeCategory={activeCategory}
                                        onCategoryChange={handleCategoryChange}
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-6 hide-scrollbar flex flex-col gap-6">
                                    {homestays.map((homestay: any) => (
                                        <div key={homestay.id} className="w-full transition-all duration-300">
                                            <HomestayCard
                                                homestay={homestay}
                                                isHighlighted={hoveredMarkerId === homestay.id}
                                                onMouseEnter={() => setHoveredId(homestay.id)}
                                                onMouseLeave={() => setHoveredId(null)}
                                            />
                                        </div>
                                    ))}

                                    {/* Infinite Scroll Anchor */}
                                    <div ref={ref} className="h-10 flex items-center justify-center">
                                        {isFetchingNextPage && (
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.15s]" />
                                                <div className="w-1.5 h-1.5 rounded-full bg-stone-300 animate-bounce [animation-delay:-0.3s]" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {homestays.map((homestay: any) => (
                                <HomestayCard key={homestay.id} homestay={homestay} />
                            ))}
                        </div>
                    )
                ) : (
                    <div className="w-full max-w-3xl mx-auto mt-6">
                        <EmptyState
                            icon={<MapPin className="w-8 h-8 text-muted-foreground" />}
                            title={`No listings yet in ${destination.name}`}
                            description="Be the first to host a stay here!"
                        />
                    </div>
                )}
            </div>
        </div >
    );
}
