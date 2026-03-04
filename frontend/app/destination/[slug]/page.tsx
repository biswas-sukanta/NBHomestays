'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { SharedPageBanner } from '@/components/shared-page-banner'; // Assuming this exists for hero
import { HomestayCard } from '@/components/homestay-card';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { MapPin, Info, LayoutGrid, Map as MapIcon } from 'lucide-react';
import { AnimatedHeroBackground } from '@/components/ui/animated-hero-background';
import { EmptyState } from '@/components/ui/empty-state';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';

const HomestayMapView = dynamic(() => import('@/components/HomestayMapView'), {
    ssr: false,
    loading: () => <div className="h-[600px] w-full bg-secondary/10 animate-pulse rounded-2xl flex items-center justify-center text-muted-foreground">Loading Discovery Map...</div>
});

export default function DestinationPage() {
    const { slug } = useParams();
    const [viewType, setViewType] = useState<'grid' | 'map'>('grid');
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const { data: destination, isLoading: destLoading } = useQuery({
        queryKey: ['destination', slug],
        queryFn: () => api.get(`/api/destinations/${slug}`).then(res => res.data)
    });

    const { data: homestaysPage, isLoading: homestaysLoading } = useQuery({
        queryKey: ['destination-homestays', slug],
        queryFn: async () => {
            const res = await api.get(`/api/destinations/${slug}/homestays`);
            // Safely extract the array whether it's wrapped in a Page object or not
            return res.data.content ? res.data.content : res.data;
        }
    });

    if (destLoading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB]">
                <div className="h-[60vh] bg-secondary/10 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <Skeleton className="h-12 w-64 mb-6" />
                    <Skeleton className="h-6 w-full mb-2" />
                    <Skeleton className="h-6 w-3/4 mb-12" />
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!destination) return <div className="p-20 text-center">Destination not found</div>;

    const homestays = Array.isArray(homestaysPage) ? homestaysPage : [];

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
                        {destination.tags.map((tag: string) => (
                            <span key={tag} className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-600 shadow-sm">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

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

                {homestaysLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-3xl" />)}
                    </div>
                ) : homestays.length > 0 ? (
                    viewType === 'map' ? (
                        <div className="flex flex-col lg:flex-row gap-6 h-[800px]">
                            <div className="w-full lg:w-[55%] h-[400px] lg:h-full rounded-2xl overflow-hidden shadow-lg border border-stone-200/60 order-1 lg:order-none z-10 sticky top-[120px]">
                                <HomestayMapView
                                    homestays={homestays}
                                    hoveredHomestayId={hoveredId}
                                />
                            </div>
                            <div className="w-full lg:w-[45%] h-full overflow-y-auto pr-2 hide-scrollbar order-2 lg:order-none">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-12">
                                    {homestays.map((homestay: any) => (
                                        <div key={homestay.id} className="w-full">
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
