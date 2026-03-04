'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, Scale, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompareStore } from '@/store/useCompareStore';
import { TripBoardButton } from '@/components/trip-board-button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/optimized-image';

export interface HomestaySummary {
    id: string;
    name: string;
    description: string;
    pricePerNight: number;
    latitude: number;
    longitude: number;
    amenities: Record<string, boolean>;
    media?: { url: string; fileId?: string }[];
    vibeScore: number;
    status: string;
    locationName?: string;
    tags?: string[];
    destination?: {
        name: string;
        district: string;
        stateName?: string;
    };
    host?: {
        id: string;
        name: string;
        avatarUrl?: string;
        isVerifiedHost?: boolean;
    };
}

interface HomestayCardProps {
    homestay: HomestaySummary;
    index?: number;
    featured?: boolean;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3';

export const HomestayCard = React.memo(({ homestay, index = 0, featured = false }: HomestayCardProps) => {
    const { addToCompare, selectedIds } = useCompareStore();
    const isSelected = selectedIds.includes(homestay.id);
    const [currentIndex, setCurrentIndex] = React.useState(0);

    // Extract images from new media
    const images = React.useMemo(() => {
        if (homestay.media && homestay.media.length > 0) {
            return homestay.media.map(m => m.url);
        }
        return [FALLBACK_IMAGE];
    }, [homestay.media]);

    const handleCompare = (e: React.MouseEvent) => {
        e.preventDefault();
        addToCompare(homestay.id);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.preventDefault();
        if (currentIndex < images.length - 1) setCurrentIndex(prev => prev + 1);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.preventDefault();
        if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
    };

    const vibeScore = homestay.vibeScore || 4.5;

    const tripBoardItem = {
        id: homestay.id,
        name: homestay.name,
        imageUrl: homestay.media?.[0]?.url || FALLBACK_IMAGE,
        locationName: homestay.locationName || 'North Bengal Hills',
        pricePerNight: homestay.pricePerNight,
    };

    // Curator vibe notes based on tags or pricing fallback
    const featuredBadge = homestay.tags?.find(t => ['Curated', 'Offbeat', 'Community Pick', 'Heritage'].includes(t))
        || (featured ? (homestay.pricePerNight > 5000 ? "Editor's Pick" : "Curated") : null);

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
            className="w-full group cursor-pointer"
            data-testid="homestay-card"
        >
            <Link href={`/homestays/${homestay.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                {/* Image Container */}
                <div className={cn(
                    "relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-2xl border border-stone-200/60 transition-all duration-700 bg-stone-50 mb-2"
                )}>
                    {/* Optimized Image with async decoding and ImageKit scaling */}
                    <OptimizedImage
                        src={images[currentIndex]}
                        alt={homestay.name}
                        width={featured ? 900 : 600}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-[1200ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
                        onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                    />

                    {/* Bottom-anchored gradient for text protection — preserves cinematic brightness with warmer tones */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-stone-900/80 via-stone-900/20 to-transparent" />

                    {/* Premium Navigation Arrows */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={prevImage}
                                className={cn(
                                    'absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md hidden group-hover:flex items-center justify-center text-gray-800 transition-all duration-300 transform',
                                    currentIndex === 0 && 'pointer-events-none opacity-50'
                                )}
                                aria-label="Previous image"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextImage}
                                className={cn(
                                    'absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md hidden group-hover:flex items-center justify-center text-gray-800 transition-all duration-300 transform',
                                    currentIndex === images.length - 1 && 'pointer-events-none opacity-50'
                                )}
                                aria-label="Next image"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Indicator Dots */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {images.map((_, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            'w-1.5 h-1.5 rounded-full transition-all duration-300',
                                            i === currentIndex ? 'bg-white scale-125' : 'bg-white/50'
                                        )}
                                    />
                                ))}
                            </div>
                        </>
                    )}

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

                {/* Text Data - Editorial Hierarchy */}
                <div className="px-1 relative mt-3">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-[9px] font-bold tracking-[0.25em] uppercase text-stone-500 truncate mb-0.5">
                            {homestay.destination
                                ? `${homestay.destination.name} • ${homestay.destination.stateName || homestay.destination.district}`
                                : (homestay.locationName || 'Eastern Himalayas')}
                        </p>
                        {homestay.host?.isVerifiedHost && (
                            <div className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50/80 px-1.5 py-0.5 rounded-sm">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>VERIFIED</span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2">
                        <h3 className="text-lg md:text-[19px] font-serif font-medium text-slate-900 truncate flex-1 leading-tight" data-slot="card-title">
                            {homestay.name.replace(/\s+All$/i, '')}
                        </h3>
                    </div>

                    <div className="mt-2.5 flex items-end justify-between">
                        <div className="flex-1">
                            {featuredBadge && (
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-sm">
                                    {featuredBadge}
                                </span>
                            )}
                        </div>
                        <span className="font-medium text-slate-900 leading-none">
                            ₹{homestay.pricePerNight.toLocaleString()} <span className="font-normal text-slate-500 text-sm">/night</span>
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

HomestayCard.displayName = 'HomestayCard';
