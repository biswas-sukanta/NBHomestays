'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { MapPin, Home, ArrowRight } from 'lucide-react';
import { AnimatedHeroBackground } from '@/components/ui/animated-hero-background';
import { HomestayCard } from '@/components/homestay-card';
import { Skeleton } from '@/components/ui/skeleton';
import { DestinationDiscovery } from '@/components/destination-discovery';
import { EmojiCategoryFilter } from '@/components/emoji-category-filter';

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
        queryFn: () => api.get(`/api/states/${slug}`).then(res => res.data)
    });

    const [activeCategory, setActiveCategory] = useState('');
    const handleCategoryChange = (cat: string) => {
        setActiveCategory(prev => prev === cat ? '' : cat);
    };

    const { data: homestaysData, isLoading: homestaysLoading } = useQuery({
        queryKey: ['state-homestays', slug, activeCategory],
        queryFn: async () => {
            const tagParam = activeCategory ? `&tag=${encodeURIComponent(activeCategory)}` : '';
            // Fetch homestays from all destinations in this state using the search endpoint
            const res = await api.get(`/api/homestays/search?stateSlug=${slug}${tagParam}&size=12`);
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
                imageUrl={`/states/hero-${state.slug}.webp`}
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
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-10"
                >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
                        Explore Destinations
                    </span>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-heading">
                        Destinations in {state.name}
                    </h2>
                </motion.div>

                <DestinationDiscovery stateSlug={slug as string} />
            </section>

            {/* ── Homestays in this State ── */}
            <section className="max-w-7xl mx-auto px-4 pb-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-10"
                >
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-3 bg-primary/8 px-3 py-1 rounded-full">
                        Featured Stays
                    </span>
                    <h2 className="text-3xl font-extrabold text-foreground tracking-tight font-heading">
                        Homestays in {state.name}
                    </h2>
                </motion.div>

                <div className="mb-8">
                    <EmojiCategoryFilter
                        activeCategory={activeCategory}
                        onCategoryChange={handleCategoryChange}
                    />
                </div>

                {homestaysLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : homestays.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {homestays.map((homestay: any) => (
                            <HomestayCard key={homestay.id} homestay={homestay} />
                        ))}
                    </div>
                ) : (
                    <div className="bg-white border rounded-3xl p-12 text-center max-w-3xl mx-auto shadow-sm">
                        <Home className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-foreground mb-2">
                            {activeCategory ? "No homestays found matching your vibe" : "No homestays found in this region yet"}
                        </h3>
                        <p className="text-muted-foreground">
                            {activeCategory
                                ? "Try selecting a different filter or clearing the current one."
                                : `We are constantly expanding our network. Check back soon for new, curated properties in ${state.name}.`
                            }
                        </p>
                    </div>
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
