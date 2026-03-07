'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { destinationApi } from '@/lib/api/destinations';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Mountain, ChevronRight, Compass, Flower2, TreePine, Sunrise } from 'lucide-react';

interface StateItem {
    id: string;
    slug: string;
    name: string;
    description: string;
    heroImageName: string;
    destinationCount: number;
    homestayCount: number;
}

// Per-state color tints and icons
const STATE_STYLES: Record<string, { gradient: string; accent: string; icon: React.ElementType }> = {
    'west-bengal': { gradient: 'from-emerald-900/60 via-emerald-800/30', accent: 'bg-emerald-500', icon: Compass },
    'sikkim': { gradient: 'from-amber-900/60 via-amber-800/30', accent: 'bg-amber-500', icon: Mountain },
    'meghalaya': { gradient: 'from-indigo-900/60 via-indigo-800/30', accent: 'bg-indigo-500', icon: Flower2 },
    'assam': { gradient: 'from-rose-900/60 via-rose-800/30', accent: 'bg-rose-500', icon: TreePine },
    'arunachal-pradesh': { gradient: 'from-[#8B0000]/60 via-[#CD5C5C]/30', accent: 'bg-[#8B0000]', icon: Sunrise },
};

const fallbackStyle = { gradient: 'from-slate-900/60 via-slate-800/30', accent: 'bg-slate-500', icon: Mountain };

export function WanderByRegion() {
    const { data: states, isLoading } = useQuery<StateItem[]>({
        queryKey: ['states'],
        queryFn: () => destinationApi.getStates().then(res => res.data)
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 auto-rows-[280px] lg:auto-rows-[320px]">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className={`rounded-3xl ${i === 0 ? 'col-span-2 md:col-span-1 md:row-span-2' : ''}`} />
                ))}
            </div>
        );
    }

    if (!states?.length) return null;

    return (
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 hide-scrollbar md:grid md:grid-cols-3 md:grid-rows-2 md:gap-6 md:min-h-[600px] lg:min-h-[700px] md:overflow-visible">
            {states.map((state, i) => {
                const style = STATE_STYLES[state.slug] || fallbackStyle;
                const Icon = style.icon;
                // First card spans 1 col + 2 rows for bento hero effect in the 3x2 grid
                const isHero = i === 0;

                return (
                    <motion.div
                        key={state.slug}
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={`${isHero ? 'md:col-span-1 md:row-span-2' : ''} relative overflow-hidden rounded-2xl w-[85vw] flex-shrink-0 snap-center md:w-full md:h-full md:flex-shrink-1`}
                    >
                        <Link
                            href={`/state/${state.slug}`}
                            className="group block relative w-full h-[280px] md:h-full rounded-3xl overflow-hidden shadow-lg hover:shadow-[0_0_40px_rgba(218,165,32,0.35)] transition-all duration-500 ring-1 ring-white/10 hover:ring-4 hover:ring-amber-400/60"
                        >
                            {/* Background Image */}
                            <Image
                                src={`/states/thumb-${state.slug}.${state.slug === 'arunachal-pradesh' ? 'png' : 'webp'}`}
                                alt={state.name}
                                fill
                                sizes={isHero ? '(max-width: 640px) 100vw, 33vw' : '(max-width: 640px) 100vw, 25vw'}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />

                            {/* Color-tinted gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t ${style.gradient} to-transparent`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                            {/* State Icon Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <div className={`${style.accent} rounded-2xl p-3 shadow-lg backdrop-blur-sm group-hover:shadow-[0_0_20px_rgba(218,165,32,0.5)] group-hover:scale-110 transition-all duration-500`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6">
                                <h3 className={`text-white font-medium tracking-tight drop-shadow-lg font-serif mb-2 ${isHero ? 'text-4xl lg:text-5xl' : 'text-2xl lg:text-3xl'}`}>
                                    {state.name}
                                </h3>
                                <p className={`text-white/70 line-clamp-2 mb-3 leading-relaxed ${isHero ? 'text-base' : 'text-sm'}`}>
                                    {state.description}
                                </p>
                                <div className="flex items-center gap-4 text-white/60 text-xs font-semibold">
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {state.destinationCount} destinations
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Mountain className="w-3.5 h-3.5" />
                                        {state.homestayCount} stays
                                    </span>
                                </div>
                            </div>

                            {/* Hover Arrow */}
                            <div className="absolute top-4 right-4 bg-white/15 backdrop-blur-md rounded-full p-2.5 opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
                                <ChevronRight className="w-4 h-4 text-white" />
                            </div>
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}
