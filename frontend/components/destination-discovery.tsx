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
    tags?: string[]; // Backend-provided tags (may include emoji prefixes)
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

const VIBE_EMOJI: Record<string, string> = {
    'Hill Station': '⛰️',
    'Tea Garden': '🍃',
    'Nature': '🌿',
    'Lakeside': '🌊',
    'Trekking': '🥾',
    'High Altitude': '🏔️',
    'Offbeat': '🧭',
    'Wildlife': '🦌',
    'Riverside': '🏞️',
    'Agricultural': '🌾',
    'Cultural': '🏛️',
    'Floral': '🌸',
    'Transit': '🚉',
    'Heritage': '🏛️',
};

// Normalize backend tags to the filter taxonomy.
// Examples:
// - "🏔️ High-Altitude" -> "High Altitude"
// - "🥾 Trekking" -> "Trekking"
function normalizeTag(tag: string): string {
    const stripped = tag
        // Remove emoji and ZWJ/VS16
        .replace(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]/gu, '')
        // Convert hyphens to spaces
        .replace(/-/g, ' ')
        // Normalize whitespace
        .replace(/\s+/g, ' ')
        .trim();

    // Canonicalize known backend variants
    if (stripped === 'High Altitude') return 'High Altitude';

    return stripped;
}

// Get normalized tags from a destination, with fallback
function getNormalizedTags(dest: Destination): string[] {
    if (!dest.tags || dest.tags.length === 0) {
        console.warn(`[DestinationDiscovery] No tags for destination: ${dest.slug}, using fallback`);
        return ['Nature']; // Fallback tag
    }
    // Filter out "All" tag and normalize remaining tags
    return dest.tags
        .map(normalizeTag)
        .filter(tag => tag && tag !== 'All');
}

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
    const [activeTag, setActiveTag] = useState('All');
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

    // Filter destinations by active tag using backend-provided tags
    const filteredDestinations = activeTag === 'All'
        ? destinations
        : destinations.filter(d => {
            const normalizedTags = getNormalizedTags(d);
            return normalizedTags.includes(activeTag);
        });

    return (
        <div className="space-y-10">
            {/* ── Vibrant Filter Pills ── */}
            <div className="bg-white/80 backdrop-blur-md py-4 -mx-4 px-4">
                <div className="flex flex-row overflow-x-auto snap-x snap-mandatory no-scrollbar md:flex-wrap md:overflow-visible gap-3 pb-2 w-full">
                    {TRAVEL_TAGS.map(tag => {
                        const isActive = activeTag === tag;
                        const TagIcon = TAG_ICONS[tag] || Compass;
                        const tagEmoji = VIBE_EMOJI[tag];
                        return (
                            <button
                                key={tag}
                                onClick={() => setActiveTag(tag)}
                                className={cn(
                                    "whitespace-nowrap flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all duration-200 ease-out font-medium snap-center shrink-0",
                                    isActive
                                        ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                                        : "bg-white text-slate-600 border-neutral-300 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/30"
                                )}
                            >
                                <TagIcon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
                                {tagEmoji ? <span className="text-base leading-none">{tagEmoji}</span> : null}
                                {tag}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Curated Destination Cards (max 8) ── */}
            {filteredDestinations.length === 0 && activeTag !== 'All' ? (
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
                                const region = dest.stateName || '';
                                const tags = getNormalizedTags(dest).slice(0, 2);
                                const staysLine = dest.homestayCount != null ? `${dest.homestayCount} stays` : '';
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
                                        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-500 group">
                                            <div className="absolute inset-0 bg-transparent z-20 pointer-events-none" />
                                            <Image
                                                src={`/destinations/${dest.localImageName}`}
                                                alt={dest.name.replace(" All", "")}
                                                fill
                                                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                                className="w-full h-full object-cover group-hover:scale-[1.06] transition-transform duration-700"
                                            />
                                            {/* Text-protection gradient */}
                                            <div className={`absolute inset-0 bg-gradient-to-t ${tint} via-transparent to-transparent opacity-60`} />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />

                                            <div className="absolute inset-0 p-4 flex flex-col justify-end">
                                                <h3 className="text-white font-bold text-lg md:text-xl leading-tight drop-shadow-lg">
                                                    {dest.name}
                                                </h3>
                                                {(region || staysLine) && (
                                                    <div className="text-white/85 text-xs md:text-sm font-semibold mt-1 drop-shadow">
                                                        {region}{region && staysLine ? ' · ' : ''}{staysLine.replace('🏡 ', '')}
                                                    </div>
                                                )}

                                                {tags.length > 0 && (
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        {tags.map((tag) => (
                                                            <span
                                                                key={tag}
                                                                className="rounded-full px-3 py-1 text-xs bg-white/90 backdrop-blur text-neutral-900 font-semibold"
                                                            >
                                                                {VIBE_EMOJI[tag] ? `${VIBE_EMOJI[tag]} ` : ''}{tag}
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
