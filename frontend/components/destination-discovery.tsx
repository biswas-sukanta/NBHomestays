'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Map, Train, Mountain, Trees, Waves, Tent, Sparkles, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Destination {
    id: string;
    slug: string;
    name: string;
    localImageName: string;
    tags: string[];
}

const TAG_ICONS: Record<string, React.ElementType> = {
    'Heritage': Train,
    'Mountain View': Mountain,
    'Nature & Eco': Trees,
    'Riverside': Waves,
    'Offbeat': Tent,
    'Trending Now': Sparkles,
};

const CARD_TINTS = [
    'from-emerald-900/40',
    'from-amber-900/40',
    'from-indigo-900/40',
    'from-rose-900/40',
    'from-teal-900/40',
    'from-violet-900/40',
    'from-orange-900/40',
    'from-cyan-900/40',
];

export function DestinationDiscovery({ stateSlug, stateName }: { stateSlug?: string; stateName?: string }) {
    const router = useRouter();
    const pathname = usePathname();
    const isHome = pathname === '/';
    const [activeTag, setActiveTag] = useState('🌟 All');
    const [visibleCount, setVisibleCount] = useState(8);

    const { data: destinations, isLoading } = useQuery<Destination[]>({
        queryKey: ['destinations', stateSlug],
        queryFn: () => api.get(stateSlug ? `/api/states/${stateSlug}/destinations` : '/api/destinations').then(res => res.data)
    });

    if (isLoading) {
        return (
            <div className="space-y-8">
                <div className="flex flex-nowrap overflow-hidden md:flex-wrap md:overflow-visible gap-3 pb-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-12 w-28 rounded-full shrink-0 md:shrink" />)}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => <Skeleton key={i} className="aspect-[4/3] rounded-2xl" />)}
                </div>
            </div>
        );
    }

    if (!destinations || destinations.length === 0) {
        return (
            <div className="w-full max-w-3xl mx-auto mt-6">
                <EmptyState
                    icon={<Map className="w-8 h-8 text-muted-foreground" />}
                    title="No destinations found in this region yet"
                    description={stateName
                        ? `We are constantly exploring new places. Check back soon for curated destinations in ${stateName}.`
                        : "We are constantly exploring new places. Check back soon for curated destinations in this region."}
                />
            </div>
        );
    }

    const allTags = Array.from(new Set(destinations?.flatMap(d => d.tags) || []));
    const filteredDestinations = activeTag === '🌟 All'
        ? destinations
        : destinations?.filter(d => d.tags.includes(activeTag));

    return (
        <div className="space-y-10">
            {/* ── Vibrant Filter Pills ── */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md py-4 -mx-4 px-4">
                <div className="flex flex-nowrap overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible gap-3 pb-2">
                    {allTags.map(tag => {
                        const isActive = activeTag === tag;
                        const TagIcon = TAG_ICONS[tag] || Compass;
                        return (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={cn(
                                    "whitespace-nowrap flex items-center gap-2 px-7 py-3.5 rounded-full border-2 transition-all text-base font-bold",
                                    isActive
                                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-[0_0_20px_rgba(218,165,32,0.4)] scale-105"
                                        : "bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-800"
                                )}
                            >
                                <TagIcon className={cn("w-5 h-5", isActive ? "text-white" : "text-gray-500")} />
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Curated Destination Cards (max 8) ── */}
            {!filteredDestinations?.length ? (
                <div className="w-full max-w-3xl mx-auto mt-6">
                    <EmptyState
                        icon={<Map className="w-8 h-8 text-muted-foreground" />}
                        title="No destinations found for this filter"
                        description="Try selecting a different category to explore more places."
                    />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <AnimatePresence mode='popLayout'>
                            {filteredDestinations.slice(0, isHome ? 8 : visibleCount).map((dest, idx) => {
                                const tint = CARD_TINTS[idx % CARD_TINTS.length];
                                return (
                                    <motion.div
                                        key={dest.slug}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.3 }}
                                        onClick={() => router.push(`/destination/${dest.slug}`)}
                                        className="group cursor-pointer"
                                    >
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-500 ring-1 ring-black/5 group-hover:ring-amber-400/30 group-hover:shadow-[0_4px_20px_rgba(218,165,32,0.15)]">
                                            <Image
                                                src={`/destinations/${dest.localImageName}`}
                                                alt={dest.name.replace(" All", "")}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Text-protection gradient */}
                                            <div className={`absolute inset-0 bg-gradient-to-t ${tint} via-transparent to-transparent`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

                                            <div className="absolute inset-0 flex flex-col items-start justify-end p-5">
                                                <h3 className="text-white font-extrabold text-lg md:text-xl tracking-tight drop-shadow-lg leading-tight">
                                                    {dest.name.replace(" All", "")}
                                                </h3>
                                                {dest.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                                        {dest.tags.slice(0, 2).map(t => (
                                                            <span key={t} className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-sm text-white/90 px-2 py-0.5 rounded-full">
                                                                {t}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* View all link for Homepage */}
                    {isHome && filteredDestinations.length > 8 && (
                        <div className="flex justify-center mt-10">
                            <Link
                                href="/search"
                                className="group inline-flex items-center gap-2 text-base font-bold text-gray-700 hover:text-amber-600 transition-colors duration-200"
                            >
                                View all {filteredDestinations.length}+ destinations
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                            </Link>
                        </div>
                    )}

                    {/* Load More button for Explore / Search Page */}
                    {!isHome && filteredDestinations.length > visibleCount && (
                        <div className="flex justify-center mt-10">
                            <button
                                onClick={() => setVisibleCount(prev => prev + 8)}
                                className="group inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm text-sm font-bold text-gray-700 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all duration-300"
                            >
                                Load More Destinations
                                <ArrowRight className="w-4 h-4 group-hover:translate-y-1 transition-transform duration-200 rotate-90" />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
