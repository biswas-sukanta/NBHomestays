'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

const FALLBACK = 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?q=80&w=1965&auto=format&fit=crop';

interface BentoGalleryProps {
    photoUrls: string[];
    name: string;
    className?: string;
}

export function BentoGallery({ photoUrls, name, className }: BentoGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);

    // Ensure we always have at least 5 slots (fill with fallback)
    const photos = [...photoUrls];
    while (photos.length < 5) photos.push(FALLBACK);
    const displayPhotos = photos.slice(0, 5);

    const openLightbox = (i: number) => setLightboxIndex(i);
    const closeLightbox = () => setLightboxIndex(null);

    const prev = () => setLightboxIndex((i) =>
        i !== null ? (i - 1 + displayPhotos.length) % displayPhotos.length : null
    );
    const next = () => setLightboxIndex((i) =>
        i !== null ? (i + 1) % displayPhotos.length : null
    );

    // Respond to arrow keys
    React.useEffect(() => {
        if (lightboxIndex === null) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
            if (e.key === 'Escape') closeLightbox();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightboxIndex]);

    return (
        <>
            {/* ── Bento Grid ── */}
            <div
                className={cn(
                    'hidden md:grid rounded-2xl overflow-hidden',
                    'grid-cols-4 grid-rows-2 gap-1.5 h-[480px]',
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300" />
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
                                    Show all photos
                                </span>
                            </div>
                        )}
                    </button>
                ))}
            </div>

            {/* ── Mobile: snap-scroll carousel ── */}
            <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory gap-2 rounded-xl h-72 scrollbar-hide">
                {displayPhotos.map((url, idx) => (
                    <button
                        key={idx}
                        className="flex-none w-[90vw] snap-center rounded-xl overflow-hidden focus:outline-none"
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

            {/* ── Lightbox ── */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        key="lightbox"
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 z-10 glass-dark rounded-full p-2 text-white"
                            onClick={closeLightbox}
                            aria-label="Close gallery"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Prev */}
                        <button
                            className="absolute left-4 z-10 glass-dark rounded-full p-3 text-white disabled:opacity-30"
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
                            className="max-h-[90vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            transition={{ duration: 0.25 }}
                            onClick={(e) => e.stopPropagation()}
                        />

                        {/* Next */}
                        <button
                            className="absolute right-4 z-10 glass-dark rounded-full p-3 text-white"
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
