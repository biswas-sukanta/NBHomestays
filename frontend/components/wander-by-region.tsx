'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Mountain, ChevronRight } from 'lucide-react';

interface StateItem {
    id: string;
    slug: string;
    name: string;
    description: string;
    heroImageName: string;
    destinationCount: number;
    homestayCount: number;
}

export function WanderByRegion() {
    const { data: states, isLoading } = useQuery<StateItem[]>({
        queryKey: ['states'],
        queryFn: () => api.get('/api/states').then(res => res.data)
    });

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="aspect-[4/5] rounded-2xl" />
                ))}
            </div>
        );
    }

    if (!states?.length) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {states.map((state, i) => (
                <motion.div
                    key={state.slug}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                    <Link
                        href={`/state/${state.slug}`}
                        className="group block relative aspect-[4/5] rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 ring-1 ring-black/5"
                    >
                        {/* Background Image */}
                        <Image
                            src={`/states/${state.heroImageName}`}
                            alt={state.name}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />

                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* Content */}
                        <div className="absolute inset-0 flex flex-col justify-end p-5">
                            <h3 className="text-white font-bold text-xl tracking-tight drop-shadow-lg font-heading mb-1">
                                {state.name}
                            </h3>
                            <p className="text-white/70 text-sm line-clamp-2 mb-3 leading-relaxed">
                                {state.description}
                            </p>
                            <div className="flex items-center gap-4 text-white/60 text-xs font-medium">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {state.destinationCount} destinations
                                </span>
                                <span className="flex items-center gap-1">
                                    <Mountain className="w-3 h-3" />
                                    {state.homestayCount} stays
                                </span>
                            </div>

                            {/* Hover Arrow */}
                            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <ChevronRight className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </Link>
                </motion.div>
            ))}
        </div>
    );
}
