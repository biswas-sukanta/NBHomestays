'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Mountain, ChevronRight, Compass, Flower2, TreePine } from 'lucide-react';

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
};

const fallbackStyle = { gradient: 'from-slate-900/60 via-slate-800/30', accent: 'bg-slate-500', icon: Mountain };

export function WanderByRegion() {
    const { data: states, isLoading } = useQuery<StateItem[]>({
        queryKey: ['states'],
        queryFn: () => api.get('/api/states').then(res => res.data)
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[280px] lg:auto-rows-[320px]">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className={`rounded-3xl ${i === 0 ? 'col-span-2 row-span-2' : ''}`} />
                ))}
            </div>
        );
    }

    if (!states?.length) return null;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 auto-rows-[260px] lg:auto-rows-[300px]">
            {states.map((state, i) => {
                const style = STATE_STYLES[state.slug] || fallbackStyle;
                const Icon = style.icon;
                // First card spans 2 cols + 2 rows for bento hero effect
                const isHero = i === 0;

                return (
                    <motion.div
                        key={state.slug}
                        initial={{ opacity: 0, y: 28 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1, duration: 0.5 }}
                        className={isHero ? 'col-span-2 row-span-2' : ''}
                    >
                        <Link
                            href={`/state/${state.slug}`}
                            className="group block relative w-full h-full rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 ring-1 ring-white/10 hover:ring-amber-400/40 hover:shadow-[0_0_30px_rgba(218,165,32,0.15)]"
                        >
                            {/* Background Image */}
                            <Image
                                src={`/states/thumb-${state.slug}.webp`}
                                alt={state.name}
                                fill
                                sizes={isHero ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
                                className="object-cover group-hover:scale-110 transition-transform duration-700"
                            />

                            {/* Color-tinted gradient overlay */}
                            <div className={`absolute inset-0 bg-gradient-to-t ${style.gradient} to-transparent`} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                            {/* State Icon Badge */}
                            <div className="absolute top-4 left-4 z-10">
                                <div className={`${style.accent} rounded-2xl p-2.5 shadow-lg backdrop-blur-sm`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-end p-5 lg:p-6">
                                <h3 className={`text-white font-extrabold tracking-tight drop-shadow-lg font-heading mb-1.5 ${isHero ? 'text-3xl lg:text-4xl' : 'text-xl lg:text-2xl'}`}>
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
