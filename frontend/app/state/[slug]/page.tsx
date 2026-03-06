'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { MapPin, Home, ArrowRight, LayoutGrid, Map as MapIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { AnimatedHeroBackground } from '@/components/ui/animated-hero-background';
import { HomestayCard } from '@/components/homestay-card';
import { Skeleton } from '@/components/ui/skeleton';
import { DestinationDiscovery } from '@/components/destination-discovery';
import { EmojiCategoryFilter } from '@/components/emoji-category-filter';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeader } from '@/components/ui/section-header';

const HomestayMapView = dynamic(() => import('@/components/HomestayMapView'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-secondary/10 animate-pulse rounded-2xl flex items-center justify-center text-muted-foreground">Loading Discovery Map...</div>
});

interface DestinationItem {
    id: string;
    slug: string;
    name: string;
    district: string;
    heroTitle: string;
    description: string;
    localImageName: string;
    tags: string[];
    stateName: string;
    stateSlug: string;
}

interface StateItem {
    id: string;
    slug: string;
    name: string;
    description: string;
    heroImageName: string;
    destinationCount: number;
    homestayCount: number;
}

export default function StatePage() {
    const { slug } = useParams();

    const { data: state, isLoading: stateLoading } = useQuery<StateItem>({
        queryKey: ['state', slug],
        queryFn: () => api.get(`/states/${slug}`).then(res => res.data)
    });

    const [activeCategory, setActiveCategory] = useState('');
    const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<any>(null);

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(prev => prev === cat ? '' : cat);
    };

    const { data: homestaysData, isLoading: homestaysLoading } = useQuery({
        queryKey: ['state-homestays', slug, activeCategory, mapBounds ? 'bounded' : 'all'],
        queryFn: async () => {
            const tagParam = activeCategory ? `&tag=${encodeURIComponent(activeCategory)}` : '';
            let boundsParam = '';
            if (mapBounds) {
                boundsParam = `&minLat=${mapBounds.getSouth()}&maxLat=${mapBounds.getNorth()}&minLng=${mapBounds.getWest()}&maxLng=${mapBounds.getEast()}`;
            }
            // Fetch homestays from all destinations in this state using the search endpoint
            const res = await api.get(`/homestays/search?stateSlug=${slug}${tagParam}${boundsParam}&size=60`);
            return res.data.content ? res.data.content : res.data;
        },
        enabled: !!state
    });

    // Loading skeleton
    if (stateLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB]">
                <div className="h-[60vh] bg-secondary/10 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <Skeleton className="h-10 w-64 mb-4" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-12" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="aspect-[3/4] rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!state) return <div className="p-20 text-center text-muted-foreground">State not found</div>;

    const homestays = Array.isArray(homestaysData) ? homestaysData : [];

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            {/* ── Animated Hero ── */}
            <AnimatedHeroBackground
                imageUrl={`/states/hero-${state.slug}.${state.slug === 'arunachal-pradesh' ? 'png' : 'webp'}`}
                className="h-[60vh] w-full"
            >
                <div className="flex flex-col items-center justify-center text-center p-4 h-full">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-4xl"
                    >
                        <span className="inline-block px-4 py-1 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30 text-sm font-medium mb-4">
                            Explore {state.name}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl tracking-tight font-heading">
                            {state.name}
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light drop-shadow">
                            {state.description}
                        </p>
                        <div className="flex items-center justify-center gap-6 mt-6 text-white/70 text-sm font-medium">
                            <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4" />
                                {state.destinationCount} destinations
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Home className="w-4 h-4" />
                                {state.homestayCount} stays
                            </span>
                        </div>
                    </motion.div>
                </div>
            </AnimatedHeroBackground>

            {/* ── Destinations Grid ── */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <SectionHeader
                    pillText="EXPLORE DESTINATIONS"
                    title={`Destinations in ${state.name}`}
                    subtitle={`Discover the unique vibe of ${state.name}'s most beautiful regions.`}
                />

                <DestinationDiscovery stateSlug={slug as string} stateName={state.name} />
            </section>

            {/* ── Homestays in this State ── */}
            <section className="max-w-7xl mx-auto px-4 pb-16">
                <SectionHeader
                    pillText="FEATURED STAYS"
                    title={`Homestays in ${state.name}`}
                    subtitle="Handpicked properties curated for comfort, views, and authentic local hospitality."
                />

                {state.homestayCount > 0 && (
                    <div className="mb-8">
                        <EmojiCategoryFilter
                            activeCategory={activeCategory}
                            onCategoryChange={handleCategoryChange}
                        />
                    </div>
                )}

                {homestaysLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : homestays.length > 0 ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 hidden sm:block">{homestays.length} Stays Found</h3>
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

                        {viewType === 'map' ? (
                            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-0 lg:h-[calc(100vh-72px)] lg:-mx-8">
                                {/* Left: Map (Fullscreen on mobile, relative split on desktop) */}
                                <div className="fixed inset-0 z-[40] lg:relative lg:z-auto w-full lg:h-full overflow-hidden border-r border-stone-200">
                                    <HomestayMapView
                                        homestays={homestays}
                                        hoveredHomestayId={hoveredId}
                                        onMapChange={setMapBounds}
                                    />

                                    {/* Mobile Bottom Sheet Overlay for Cards */}
                                    <div className="absolute lg:hidden bottom-0 inset-x-0 z-[50] pb-[80px] pt-12 bg-gradient-to-t from-black/60 to-transparent pointer-events-none flex flex-col justify-end">
                                        <div className="pointer-events-auto w-full overflow-x-auto snap-x snap-mandatory flex gap-4 px-4 pb-4 hide-scrollbar">
                                            {homestays.map((homestay: any) => (
                                                <div key={homestay.id} className="w-[85vw] max-w-[320px] shrink-0 snap-center">
                                                    <HomestayCard
                                                        homestay={homestay}
                                                        onMouseEnter={() => setHoveredId(homestay.id)}
                                                        onMouseLeave={() => setHoveredId(null)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Desktop Listings Rail (Hidden on mobile map) */}
                                <div className="hidden lg:flex w-full h-full flex-col bg-white overflow-hidden">
                                    <div className="flex-1 overflow-y-auto px-4 py-6 hide-scrollbar flex flex-col gap-6">
                                        {homestays.map((homestay: any) => (
                                            <div key={homestay.id} className="w-full transition-all duration-300">
                                                <HomestayCard
                                                    homestay={homestay}
                                                    onMouseEnter={() => setHoveredId(homestay.id)}
                                                    onMouseLeave={() => setHoveredId(null)}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                {homestays.map((homestay: any) => (
                                    <HomestayCard key={homestay.id} homestay={homestay} />
                                ))}
                            </div>
                        )}
                    </>
                ) : (
                    <EmptyState
                        icon={<Home className="w-12 h-12 text-muted-foreground" />}
                        title={activeCategory ? "No homestays found matching your vibe" : "No homestays found in this region yet"}
                        description={activeCategory
                            ? "Try selecting a different filter or clearing the current one."
                            : `We are constantly expanding our network. Check back soon for new, curated properties in ${state.name}.`
                        }
                    />
                )}
            </section>

            {/* ── Back to Regions CTA ── */}
            <section className="max-w-7xl mx-auto px-4 pb-16 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-primary font-semibold hover:underline underline-offset-4 transition-all"
                >
                    <ArrowRight className="w-4 h-4 rotate-180" />
                    Explore other regions
                </Link>
            </section>
        </div>
    );
}
