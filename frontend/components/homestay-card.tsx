'use client';

import * as React from 'react';
import Link from 'next/link';
import { Star, Scale, ChevronLeft, ChevronRight, CheckCircle2, UtensilsCrossed } from 'lucide-react';
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
    mealConfig?: {
        defaultMealPlan?: string;
        mealsIncludedPerDay?: number;
        mealPricePerGuest?: number | null;
        dietTypes?: string[];
        extras?: { code: string; title: string; price: number; unit: string }[];
    };
}
interface HomestayCardProps {
    homestay: HomestaySummary;
    index?: number;
    featured?: boolean;
    isHighlighted?: boolean;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=1000&ixlib=rb-4.0.3';

export const HomestayCard = React.memo(({ homestay, index = 0, featured = false, isHighlighted = false, onMouseEnter, onMouseLeave }: HomestayCardProps) => {
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
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <Link href={`/homestays/${homestay.id}`} className={cn(
                "block relative w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border bg-stone-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-300",
                isHighlighted ? "border-[#004d00] shadow-2xl ring-2 ring-[#004d00]/20 scale-[1.02] z-50" : "border-stone-200/60"
            )}>
                {/* Optimized Image with async decoding and ImageKit scaling */}
                <OptimizedImage
                    src={images[currentIndex]}
                    alt={homestay.name}
                    width={featured ? 900 : 600}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-200 ease-out"
                    onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                />

                {/* Bottom-anchored gradient for text protection (40% height) */}
                <div className="absolute inset-x-0 bottom-0 h-[40%] bg-[linear-gradient(transparent,rgba(0,0,0,0.65))] pointer-events-none" />

                {/* Premium Navigation Arrows */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={prevImage}
                            className={cn(
                                'absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md hidden group-hover:flex items-center justify-center text-gray-800 transition-all duration-300 transform pointer-events-auto',
                                currentIndex === 0 && 'pointer-events-none opacity-50'
                            )}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={nextImage}
                            className={cn(
                                'absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 shadow-md hidden group-hover:flex items-center justify-center text-gray-800 transition-all duration-300 transform pointer-events-auto',
                                currentIndex === images.length - 1 && 'pointer-events-none opacity-50'
                            )}
                            aria-label="Next image"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {/* Indicator Dots */}
                        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-20 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                            {images.map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        'w-[5px] h-[5px] rounded-full transition-all duration-300',
                                        i === currentIndex ? 'bg-white opacity-100 scale-125' : 'bg-white opacity-60'
                                    )}
                                />
                            ))}
                        </div>
                    </>
                )}

                {/* Top Overlay Row */}
                <div className="absolute top-3 inset-x-3 flex justify-between items-start z-10 pointer-events-none">
                    <div className="flex flex-col gap-1.5 items-start">
                        {featuredBadge && (
                            <span className="px-2.5 py-1 bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px] text-white text-[10px] font-bold uppercase tracking-wider rounded-full pointer-events-auto">
                                {featuredBadge}
                            </span>
                        )}
                        <div className="bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px] px-2.5 py-1 rounded-full flex items-center gap-1.5 pointer-events-auto shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
                            <Star className="w-3.5 h-3.5 fill-white text-white" />
                            <span className="text-xs font-bold text-white tracking-wide">{vibeScore.toFixed(1)}</span>
                        </div>
                    </div>

                    <div className="bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px] px-3 py-1.5 rounded-2xl pointer-events-auto flex flex-col items-end leading-tight shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-white/10">
                        <span className="font-bold text-white text-[13px] tracking-tight">
                            ₹{homestay.pricePerNight.toLocaleString()}
                        </span>
                        <span className="font-medium text-white/80 text-[10px]">/night</span>
                        {/* Meal indicator */}
                        {homestay.mealConfig && homestay.mealConfig.mealsIncludedPerDay != null && homestay.mealConfig.mealsIncludedPerDay > 0 && (
                            <span className="flex items-center gap-0.5 text-[9px] text-emerald-300 font-semibold mt-0.5" data-testid="meal-indicator">
                                <UtensilsCrossed className="w-2.5 h-2.5" />
                                {(!homestay.mealConfig.mealPricePerGuest)
                                    ? `incl. ${homestay.mealConfig.mealsIncludedPerDay} meals`
                                    : `+₹${homestay.mealConfig.mealPricePerGuest}/guest/day`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Absolute Text Container (Bottom Left) */}
                <div className="absolute bottom-[12px] left-[14px] right-[60px] flex flex-col z-10 pointer-events-none">
                    <div className="flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase text-white/90 drop-shadow-sm">
                        <span className="truncate">
                            {homestay.destination
                                ? `${homestay.destination.name} • ${homestay.destination.stateName || homestay.destination.district}`
                                : (homestay.locationName || 'Eastern Himalayas')}
                        </span>
                        {homestay.host?.isVerifiedHost && (
                            <CheckCircle2 className="w-3 h-3 text-blue-400 drop-shadow-md shrink-0" />
                        )}
                    </div>
                    <h3 className="text-[15px] font-semibold text-white line-clamp-2 drop-shadow-md leading-[1.25] mt-1 pr-2" data-slot="card-title">
                        {homestay.name.replace(/\s+All$/i, '')}
                    </h3>
                </div>

                {/* Absolute Action Icons (Bottom Right) */}
                <div className="absolute bottom-[12px] right-[14px] flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto z-20">
                    <TripBoardButton item={tripBoardItem} size="sm" />
                    <Button
                        variant="secondary"
                        size="icon"
                        className={cn(
                            'h-8 w-8 rounded-full shadow-lg transition-all duration-200 border border-white/20',
                            isSelected
                                ? 'bg-primary text-white hover:bg-primary/90 border-transparent'
                                : 'bg-[rgba(0,0,0,0.45)] backdrop-blur-[6px] text-white hover:bg-black/60'
                        )}
                        onClick={handleCompare}
                        title="Add to Compare"
                        aria-label="Compare this homestay"
                    >
                        <Scale className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </Link>
        </motion.div>
    );
});

HomestayCard.displayName = 'HomestayCard';
