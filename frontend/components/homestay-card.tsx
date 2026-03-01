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
    destination?: {
        name: string;
        district: string;
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
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3';

export const HomestayCard = React.memo(({ homestay, index = 0 }: HomestayCardProps) => {
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05, ease: 'easeOut' }}
            className="w-full sm:w-[280px] shrink-0 snap-start group cursor-pointer"
            data-testid="homestay-card"
        >
            <Link href={`/homestays/${homestay.id}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl">
                {/* Image Container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm group-hover:shadow-lg border border-gray-100 transition-shadow duration-300 bg-gray-50 mb-3">
                    {/* Optimized Image with async decoding and ImageKit scaling */}
                    <OptimizedImage
                        src={images[currentIndex]}
                        alt={homestay.name}
                        width={600}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                        }}
                    />

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
                    <h3 className="text-lg font-semibold text-gray-900 truncate mt-3" data-slot="card-title">
                        {homestay.name}
                    </h3>
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-sm text-gray-500 truncate" data-testid="location-text">
                            {homestay.destination
                                ? `${homestay.destination.name}, ${homestay.destination.district}`
                                : (homestay.locationName || 'North Bengal Hills')}
                        </p>
                        {homestay.host?.isVerifiedHost && (
                            <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full border border-blue-100">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>VERIFIED</span>
                            </div>
                        )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                        <span className="font-semibold text-gray-900">
                            ₹{homestay.pricePerNight.toLocaleString()} <span className="font-normal text-gray-500">/night</span>
                        </span>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

HomestayCard.displayName = 'HomestayCard';
