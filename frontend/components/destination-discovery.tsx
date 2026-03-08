'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { destinationApi } from '@/lib/api/destinations';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Compass, Map, MapPin, Train, Mountain, Trees, Waves, Tent, Sparkles, ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface Destination {
    id: string;
    slug: string;
    name: string;
    homestayCount?: number | null;
    localImageName: string;
    stateName?: string;
    stateSlug?: string;
}

const TAG_ICONS: Record<string, React.ElementType> = {
    'All': Compass,
    'Hill Station': Mountain,
    'Heritage': Train,
    'Tea Garden': Trees,
    'Nature': Trees,
    'Lakeside': Waves,
    'Trekking': Mountain,
    'High Altitude': Mountain,
    'Offbeat': Tent,
    'Wildlife': Sparkles,
    'Riverside': Waves,
    'Agricultural': Trees,
    'Cultural': Sparkles,
    'Floral': Sparkles,
    'Transit': Train,
};

// Complete static taxonomy for capsule filter pills
const TRAVEL_TAGS: string[] = [
    'All',
    'Hill Station',
    'Heritage',
    'Tea Garden',
    'Nature',
    'Lakeside',
    'Trekking',
    'High Altitude',
    'Offbeat',
    'Wildlife',
    'Riverside',
    'Agricultural',
    'Cultural',
    'Floral',
    'Transit'
];

// Static destination-to-tag mapping (DestinationCardDto does not contain tags)
const destinationTagMap: Record<string, string[]> = {
    'darjeeling': ['Hill Station', 'Heritage', 'Tea Garden'],
    'mirik': ['Lakeside', 'Nature'],
    'kalimpong': ['Hill Station', 'Offbeat'],
    'kurseong': ['Hill Station', 'Tea Garden'],
    'phalut': ['Trekking', 'High Altitude'],
    'sandakphu': ['Trekking', 'High Altitude'],
    'tinchuley': ['Offbeat', 'Nature'],
    'chatakpur': ['Offbeat', 'Nature'],
    'lava': ['Hill Station', 'Offbeat'],
    'lolegaon': ['Hill Station', 'Nature'],
    'rishop': ['Hill Station', 'Offbeat'],
    'gorubathan': ['Offbeat', 'Agricultural'],
    'jaldapara': ['Wildlife'],
    'gorumara': ['Wildlife'],
    'lataguri': ['Wildlife', 'Nature'],
    'murti': ['Riverside', 'Nature'],
    'chapramari': ['Wildlife'],
    'samsing': ['Nature', 'Floral'],
    'suntalekhola': ['Nature', 'Riverside'],
    'rocky-island': ['Riverside', 'Offbeat'],
    'mongpong': ['Offbeat', 'Nature'],
    'sevoke': ['Riverside', 'Cultural'],
    'coronation-bridge': ['Cultural', 'Transit'],
    'mahakal-mandir': ['Cultural', 'Heritage'],
    'dooars': ['Wildlife', 'Nature'],
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
        queryFn: () => (stateSlug ? destinationApi.getStateDestinations(stateSlug) : destinationApi.getDestinations()).then((res: any) => res.data)
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
                        ? `We are constantly scouting the road less traveled for new authentic homestays. Check back soon for curated destinations in ${stateName}.`
                        : "We are constantly scouting the road less traveled for new authentic homestays. Check back soon for curated destinations in this region."}
                />
            </div>
        );
    }

    // Filter destinations by active tag using static destinationTagMap
    const filteredDestinations = activeTag === 'All'
        ? destinations
        : destinations.filter(d => {
            const tags = destinationTagMap[d.slug] || [];
            return tags.includes(activeTag);
        });

    return (
        <div className="space-y-10">
            {/* ── Vibrant Filter Pills ── */}
            <div className="bg-white/80 backdrop-blur-md py-4 -mx-4 px-4">
                <div className="flex flex-row overflow-x-auto snap-x snap-mandatory no-scrollbar md:flex-wrap md:overflow-visible gap-3 pb-2 w-full">
                    {TRAVEL_TAGS.map(tag => {
                        const isActive = activeTag === tag;
                        const TagIcon = TAG_ICONS[tag] || Compass;
                        return (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={cn(
                                    "whitespace-nowrap flex items-center gap-2 px-4 py-2 text-sm rounded-full transition-all duration-300 ease-out font-medium snap-center shrink-0",
                                    isActive
                                        ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105"
                                        : "bg-white text-slate-600 border border-slate-200 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/30"
                                )}
                            >
                                <TagIcon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
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
                                const subtitleParts: string[] = [];
                                if (dest.stateName) subtitleParts.push(dest.stateName);
                                if (dest.homestayCount != null) subtitleParts.push(`${dest.homestayCount} stays`);
                                const subtitle = subtitleParts.length > 0 ? subtitleParts.join(' · ') : 'Coming soon';
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
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 group">
                                            <div className="absolute inset-0 bg-transparent z-20 pointer-events-none" />
                                            <Image
                                                src={`/destinations/${dest.localImageName}`}
                                                alt={dest.name.replace(" All", "")}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            />
                                            {/* Text-protection gradient */}
                                            <div className={`absolute inset-0 bg-gradient-to-t ${tint} via-transparent to-transparent opacity-60`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                                            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                                <h3 className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-lg">
                                                    {dest.name}
                                                </h3>
                                                <p className="text-white/80 text-xs md:text-sm font-medium mt-1 drop-shadow">
                                                    {subtitle}
                                                </p>
                                                {/* Capsule tags on card */}
                                                {(destinationTagMap[dest.slug] || []).slice(0, 2).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="inline-block mt-2 mr-1.5 px-2 py-0.5 text-[10px] font-semibold bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30"
                                                    >
                                                        {tag}
                                                    </span>
                                                ))}
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
