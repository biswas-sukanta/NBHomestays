'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass } from 'lucide-react';
import { CarouselWrapper } from '@/components/ui/carousel-wrapper';

interface Destination {
    id: string;
    slug: string;
    name: string;
    localImageName: string;
    tags: string[];
}

export function DestinationDiscovery() {
    const router = useRouter();
    const [activeTag, setActiveTag] = useState('🌟 All');

    const { data: destinations, isLoading } = useQuery<Destination[]>({
        queryKey: ['destinations'],
        queryFn: () => api.get('/api/destinations').then(res => res.data)
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex flex-nowrap overflow-hidden md:flex-wrap md:overflow-visible gap-2 pb-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-10 w-24 rounded-full shrink-0 md:shrink" />)}
                </div>
                <div className="flex gap-6 overflow-hidden pb-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="w-32 md:w-40 aspect-[3/4] rounded-[999px]" />)}
                </div>
            </div>
        );
    }

    const allTags = Array.from(new Set(destinations?.flatMap(d => d.tags) || []));
    const filteredDestinations = activeTag === '🌟 All'
        ? destinations
        : destinations?.filter(d => d.tags.includes(activeTag));

    return (
        <div className="space-y-8">
            {/* Horizontal Sticky Filter Row */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md py-4 -mx-4 px-4 mask-fade-edges">
                <div className="flex flex-nowrap overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible gap-2 pb-2">
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => setActiveTag(tag)}
                            className={cn(
                                "whitespace-nowrap px-6 py-2 rounded-full border transition-all text-sm font-medium",
                                activeTag === tag
                                    ? "bg-[#004d00] text-white border-[#004d00] shadow-md scale-105"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-[#004d00]/30 hover:bg-gray-50"
                            )}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Zostel-style Grid/Carousel */}
            <CarouselWrapper>
                <AnimatePresence mode='popLayout'>
                    {filteredDestinations?.map((dest) => (
                        <motion.div
                            key={dest.slug}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                            onClick={() => router.push(`/destination/${dest.slug}`)}
                            className="group cursor-pointer snap-start shrink-0 w-32 md:w-40 mr-4"
                        >
                            <div className="relative aspect-[3/4] rounded-[999px] overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ring-1 ring-black/5">
                                <img
                                    src={`/destinations/${dest.localImageName}`}
                                    alt={dest.name}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80 flex flex-col items-center justify-end pb-8">
                                    <h3 className="text-white font-bold text-base md:text-lg tracking-tight drop-shadow-md text-center">
                                        {dest.name}
                                    </h3>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {!filteredDestinations?.length && (
                    <div className="flex-1 py-12 text-center text-gray-400">
                        <Compass className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No destinations found for this filter</p>
                    </div>
                )}
            </CarouselWrapper>
        </div>
    );
}
