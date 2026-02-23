'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompareStore } from '@/store/useCompareStore';
import { TripBoardButton } from '@/components/trip-board-button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface HomestaySummary {
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    latitude: number;
    longitude: number;
    amenities: Record<string, boolean>;
    photoUrls: string[];
    vibeScore: number;
    status: string;
}

interface HomestayCardProps {
    homestay: HomestaySummary;
    index?: number;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3';

export function HomestayCard({ homestay, index = 0 }: HomestayCardProps) {
    const { addToCompare, selectedIds } = useCompareStore();
    const isSelected = selectedIds.includes(homestay.id);

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCompare(homestay.id);
    };

    const vibeScore = homestay.vibeScore || 4.5;

    const tripBoardItem = {
        id: homestay.id,
        name: homestay.name,
        imageUrl: homestay.photoUrls?.[0] || FALLBACK_IMAGE,
        locationName: 'North Bengal Hills',
        pricePerNight: homestay.pricePerNight,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
            className="w-[280px] shrink-0 snap-start group cursor-pointer"
            data-testid="homestay-card"
        >
            <Link href={`/homestays/${homestay.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg shadow-black/50 group-hover:shadow-xl group-hover:shadow-black/70 transition-all duration-300 bg-gray-800 mb-3">
                    <img
                        src={homestay.photoUrls?.[0] || FALLBACK_IMAGE}
                        alt={homestay.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />

                    {/* Gradient overlay just at top/bottom edges for icons if needed */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    {/* Top Left - Compare */}
                    <div className="absolute top-3 left-3 z-10">
                        <Button
                            variant="secondary"
                            size="icon"
                            className={cn(
                                'h-8 w-8 rounded-full shadow-md transition-all duration-200',
                                isSelected
                                    ? 'bg-primary text-white hover:bg-primary/90 opacity-100'
                                    : 'bg-white/90 opacity-0 group-hover:opacity-100 text-gray-700 hover:bg-white'
                            )}
                            onClick={handleCompare}
                            title="Add to Compare"
                            aria-label="Compare this homestay"
                        >
                            <Scale className="w-3.5 h-3.5" />
                        </Button>
                    </div>

                    {/* Top Right - Rating Pill */}
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur shadow-sm px-2 py-1 rounded-full flex items-center gap-1 z-10 transition-transform duration-200 group-hover:-translate-y-0.5">
                        <Star className="w-3.5 h-3.5 fill-gray-900 text-gray-900" />
                        <span className="text-xs font-bold text-gray-900">{vibeScore.toFixed(1)}</span>
                    </div>

                    {/* Bottom Right - Heart/Save */}
                    <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <TripBoardButton item={tripBoardItem} size="sm" />
                    </div>
                </div>

                {/* Text Data */}
                <div className="px-1 relative">
                    <h3 className="text-lg font-semibold text-gray-100 truncate mt-3">
                        {homestay.name}
                    </h3>
                    <p className="text-sm text-gray-400 truncate mb-1">
                        North Bengal Hills
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                        <span className="font-semibold text-white">
                            ₹{homestay.pricePerNight.toLocaleString()} <span className="font-normal text-gray-400">/night</span>
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
