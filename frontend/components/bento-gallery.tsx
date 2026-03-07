'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

const FALLBACK = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1965&auto=format&fit=crop';

interface BentoGalleryProps {
    mediaUrls: string[];
    name: string;
    locationName?: string;
    editorialLead?: string;
    className?: string;
}

export function BentoGallery({ mediaUrls, name, locationName, editorialLead, className }: BentoGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

    // Ensure we always have at least 5 slots (fill with fallback)
    const photos = [...mediaUrls];
    while (photos.length < 5) photos.push(FALLBACK);
    const totalPhotos = mediaUrls.length || 5;
    const displayPhotos = photos.slice(0, 5);

    const openLightbox = (i: number) => setLightboxIndex(i);
    const closeLightbox = () => setLightboxIndex(null);

    const prev = () => setLightboxIndex((i) =>
        i !== null ? (i - 1 + displayPhotos.length) % displayPhotos.length : null
    );
    const next = () => setLightboxIndex((i) =>
        i !== null ? (i + 1) % displayPhotos.length : null
    );

    // Keyboard navigation
    React.useEffect(() => {
        if (lightboxIndex === null) return;
        document.body.style.overflow = 'hidden';
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = 'unset';
        };
    }, [lightboxIndex]);

    return (
        <>
            {/* ── Desktop Bento Grid ── */}
            <div
                className={cn(
                    'hidden md:grid rounded-2xl overflow-hidden',
                    'grid-cols-4 grid-rows-2 gap-1.5 h-[520px]',
                    className
                )}
            >
                {/* Hero image — spans 2 cols, 2 rows */}
                <button
                    className="col-span-2 row-span-2 relative overflow-hidden group focus:outline-none"
                    onClick={() => openLightbox(0)}
                    aria-label={`View photo 1 of ${name}`}
                >
                    <OptimizedImage
                        src={displayPhotos[0]}
                        alt={`${name} — main photo`}
                        width={1200}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    {/* Gradient overlay always visible for editorial look */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 transform transition-transform duration-500 translate-y-2 group-hover:translate-y-0 text-left">
                        <h2 className="text-white text-3xl md:text-5xl font-extrabold tracking-tight drop-shadow-lg mb-2">{name}</h2>
                        {editorialLead && (
                            <p className="text-white/90 text-sm md:text-base font-medium italic drop-shadow-md mb-2 max-w-[90%] line-clamp-2">{editorialLead}</p>
                        )}
                        {locationName && (
                            <p className="text-white/70 text-xs font-semibold tracking-wider uppercase drop-shadow-md flex items-center gap-1.5">
                                📍 {locationName}
                            </p>
                        )}
                    </div>
                </button>

                {/* 4 thumbnails */}
                {displayPhotos.slice(1, 5).map((url, idx) => (
                    <button
                        key={idx}
                        className="relative overflow-hidden group focus:outline-none"
                        onClick={() => openLightbox(idx + 1)}
                        aria-label={`View photo ${idx + 2} of ${name}`}
                    >
                        <OptimizedImage
                            src={url}
                            alt={`${name} — photo ${idx + 2}`}
                            width={600}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                        {/* "Show all photos" button on last tile */}
                        {idx === 3 && (
                            <div className="absolute inset-0 flex items-end p-3 pointer-events-none">
                                <span className="glass text-sm font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md">
                                    <Images className="w-4 h-4" />
                                    {totalPhotos > 5 ? `Show all ${totalPhotos} photos` : 'Show all photos'}
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Mobile: snap-scroll carousel with counter ── */}
            <div className="md:hidden relative">
                <div className="flex overflow-x-auto snap-x snap-mandatory gap-0 h-72 scrollbar-hide" id="mobile-gallery-scroll">
                    {displayPhotos.map((url, idx) => (
                        <button
                            key={idx}
                            className="flex-none w-full snap-center overflow-hidden focus:outline-none relative"
                            onClick={() => openLightbox(idx)}
                        >
                            <OptimizedImage
                                src={url}
                                alt={`${name} — photo ${idx + 1}`}
                                width={800}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
                {/* Edge fade hints */}
                <div className="absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-black/15 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-black/15 to-transparent pointer-events-none" />
                {/* Image counter dots */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {displayPhotos.map((_, i) => (
                        <span
                            key={i}
                            className={cn(
                                'rounded-full transition-all duration-300',
                                i === 0 ? 'bg-white w-5 h-1.5' : 'bg-white/50 w-1.5 h-1.5'
                            )}
                        />
                    ))}
                </div>
            </div>

            {/* ── Premium Lightbox ── */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        key="lightbox"
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 z-10 bg-white/10 backdrop-blur-md rounded-full p-2.5 text-white hover:bg-white/20 transition-colors"
                            onClick={closeLightbox}
                            aria-label="Close gallery"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        {/* Image Counter */}
                        <div className="absolute top-5 left-1/2 -translate-x-1/2 z-10 text-white/70 text-sm font-medium tracking-wider">
                            {lightboxIndex + 1} / {displayPhotos.length}
                        </div>

                        {/* Prev */}
                        <button
                            className="absolute left-4 z-10 bg-white/10 backdrop-blur-md rounded-full p-3 text-white hover:bg-white/20 transition-colors"
                            onClick={(e) => { e.stopPropagation(); prev(); }}
                            aria-label="Previous photo"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>

                        {/* Image */}
                        <motion.img
                            key={lightboxIndex}
                            src={displayPhotos[lightboxIndex]}
                            alt={`${name} — photo ${lightboxIndex + 1}`}
                            className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Next */}
                        <button
                            className="absolute right-4 z-10 bg-white/10 backdrop-blur-md rounded-full p-3 text-white hover:bg-white/20 transition-colors"
                            onClick={(e) => { e.stopPropagation(); next(); }}
                            aria-label="Next photo"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>

                        {/* Dot indicators */}
                        <div className="absolute bottom-6 flex gap-2">
                            {displayPhotos.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                                    className={cn(
                                        'rounded-full transition-all duration-200',
                                        i === lightboxIndex ? 'bg-white w-6 h-2' : 'bg-white/40 w-2 h-2'
                                    )}
                                    aria-label={`Photo ${i + 1}`}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
