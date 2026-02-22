'use client';

import * as React from 'react';
import Link from 'next/link';
import { MapPin, Star, Scale } from 'lucide-react';
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
    const vibeClass =
        vibeScore >= 4.5 ? 'vibe-high' :
            vibeScore >= 3.5 ? 'vibe-mid' : 'vibe-low';

    const tripBoardItem = {
        id: homestay.id,
        name: homestay.name,
        imageUrl: homestay.photoUrls?.[0] || FALLBACK_IMAGE,
        locationName: 'North Bengal Hills',
        pricePerNight: homestay.pricePerNight,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.08, ease: 'easeOut' }}
            className="h-full"
        >
            <Link href={`/homestays/${homestay.id}`} className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                {/* Card wrapper */}
                <div className="
                    relative bg-white rounded-2xl overflow-hidden h-full flex flex-col
                    border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.06)]
                    transition-all duration-400
                    group-hover:shadow-[0_12px_40px_rgba(0,0,0,0.14)]
                    group-hover:-translate-y-1.5
                ">
                    {/* ── Image zone ── */}
                    <div className="relative h-60 overflow-hidden bg-gray-100">
                        <img
                            src={homestay.photoUrls?.[0] || FALLBACK_IMAGE}
                            alt={homestay.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                        />
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                        {/* Top badges row */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                            {/* Compare toggle */}
                            <Button
                                variant="secondary"
                                size="icon"
                                className={cn(
                                    'h-8 w-8 rounded-full shadow-md transition-all duration-200',
                                    isSelected
                                        ? 'bg-primary text-white hover:bg-primary/90 opacity-100'
                                        : 'glass opacity-0 group-hover:opacity-100 text-gray-700'
                                )}
                                onClick={handleCompare}
                                title="Add to Compare"
                                aria-label="Compare this homestay"
                            >
                                <Scale className="w-3.5 h-3.5" />
                            </Button>

                            {/* Vibe score badge */}
                            <div className={cn(
                                'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold shadow-md',
                                vibeClass
                            )}>
                                <Star className="w-3 h-3 fill-current" />
                                {vibeScore.toFixed(1)}
                            </div>
                        </div>

                        {/* Heart/Save — bottom-right on image */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <TripBoardButton item={tripBoardItem} size="sm" />
                        </div>

                        {/* Price — bottom-left on image */}
                        <div className="absolute bottom-3 left-3">
                            <span className="glass text-gray-900 text-sm font-bold px-2.5 py-1 rounded-full shadow-md">
                                ₹{homestay.pricePerNight.toLocaleString()}
                                <span className="font-normal text-gray-600"> /night</span>
                            </span>
                        </div>
                    </div>

                    {/* ── Content zone ── */}
                    <div className="p-4 flex flex-col flex-grow">
                        {/* Location micro-label */}
                        <div className="flex items-center gap-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase mb-1">
                            <MapPin className="w-3 h-3" />
                            North Bengal Hills
                        </div>

                        {/* Name */}
                        <h3 className="text-[1.05rem] font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200 mb-2">
                            {homestay.name}
                        </h3>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed flex-grow">
                            {homestay.description}
                        </p>

                        {/* Amenity pills (top 3) */}
                        {Object.keys(homestay.amenities || {}).filter(k => homestay.amenities[k]).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3">
                                {Object.keys(homestay.amenities).filter(k => homestay.amenities[k]).slice(0, 3).map((a) => (
                                    <span key={a} className="text-[0.7rem] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium capitalize">
                                        {a.replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* CTA hint */}
                        <div className="mt-3 flex items-center justify-end">
                            <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1">
                                View Stay →
                            </span>
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
