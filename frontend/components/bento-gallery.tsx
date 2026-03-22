'use client';

import * as React from 'react';
import { X, ChevronLeft, ChevronRight, Images } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface BentoGalleryProps {
    mediaUrls: string[];
    name: string;
    locationName?: string;
    editorialLead?: string;
    tags?: string[];
    className?: string;
}

export function BentoGallery({ mediaUrls, name, locationName, editorialLead, tags, className }: BentoGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
    const [hiddenUrls, setHiddenUrls] = React.useState<string[]>([]);

    const validImages = React.useMemo(() => {
        const uniqueUrls = Array.from(
            new Set(
                mediaUrls.filter((img): img is string => Boolean(img && img.startsWith('http')))
            )
        );

        return uniqueUrls.filter((url) => !hiddenUrls.includes(url));
    }, [hiddenUrls, mediaUrls]);

    const previewImages = validImages.slice(0, 5);
    const hasGallery = validImages.length > 0;
    const hasSingleImage = validImages.length === 1;

    const closeLightbox = () => setLightboxIndex(null);
    const openLightbox = (index: number) => setLightboxIndex(index);
    const prev = () => setLightboxIndex((index) => (
        index !== null ? (index - 1 + validImages.length) % validImages.length : null
    ));
    const next = () => setLightboxIndex((index) => (
        index !== null ? (index + 1) % validImages.length : null
    ));

    const handleImageError = React.useCallback((url: string) => (
        e: React.SyntheticEvent<HTMLImageElement>
    ) => {
        e.currentTarget.style.display = 'none';
        setHiddenUrls((current) => (current.includes(url) ? current : [...current, url]));
        setLightboxIndex((current) => {
            if (current === null) {
                return current;
            }

            if (validImages[current] === url) {
                return null;
            }

            return current;
        });
    }, [validImages]);

    React.useEffect(() => {
        if (lightboxIndex === null) {
            return;
        }

        document.body.style.overflow = 'hidden';
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                prev();
            }
            if (e.key === 'ArrowRight') {
                next();
            }
            if (e.key === 'Escape') {
                closeLightbox();
            }
        };

        window.addEventListener('keydown', handler);
        return () => {
            window.removeEventListener('keydown', handler);
            document.body.style.overflow = 'unset';
        };
    }, [lightboxIndex]);

    if (!hasGallery) {
        return null;
    }

    return (
        <>
            <div id="gallery" className={cn('space-y-3', className)}>
                {hasSingleImage ? (
                    <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
                        <button
                            type="button"
                            className="relative block aspect-[16/9] w-full overflow-hidden focus:outline-none"
                            onClick={() => openLightbox(0)}
                            aria-label={`View photo 1 of ${name}`}
                        >
                            <OptimizedImage
                                src={validImages[0]}
                                alt={`${name} main photo`}
                                width={1440}
                                className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                                onError={handleImageError(validImages[0])}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-6 text-left md:p-8">
                                <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">{name}</h2>
                                {locationName && (
                                    <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                                        {locationName}
                                    </p>
                                )}
                                {tags && tags.length > 0 && (
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {tags.slice(0, 4).map((tag) => (
                                            <span key={tag} className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                )}
                                {editorialLead && (
                                    <p className="mt-4 max-w-3xl text-sm font-medium italic text-white/85 md:text-base">
                                        {editorialLead}
                                    </p>
                                )}
                            </div>
                        </button>
                        <button
                            type="button"
                            className="absolute right-4 top-4 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/70"
                            onClick={() => openLightbox(0)}
                        >
                            View all photos
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="hidden md:block">
                            <div className="relative overflow-hidden rounded-[30px] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="relative block aspect-[16/9] w-full overflow-hidden focus:outline-none"
                                        onClick={() => openLightbox(0)}
                                        aria-label={`View photo 1 of ${name}`}
                                    >
                                        <OptimizedImage
                                            src={validImages[0]}
                                            alt={`${name} main photo`}
                                            width={1440}
                                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-[1.03]"
                                            onError={handleImageError(validImages[0])}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute inset-x-0 bottom-0 p-6 text-left md:p-8">
                                            <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-5xl">{name}</h2>
                                            {locationName && (
                                                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                                                    {locationName}
                                                </p>
                                            )}
                                            {tags && tags.length > 0 && (
                                                <div className="mt-4 flex max-w-2xl flex-wrap gap-2">
                                                    {tags.slice(0, 5).map((tag) => (
                                                        <span key={tag} className="rounded-full border border-white/20 bg-black/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                            {editorialLead && (
                                                <p className="mt-4 max-w-2xl text-sm font-medium italic text-white/85 md:text-base">
                                                    {editorialLead}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        className="absolute right-4 top-4 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/70"
                                        onClick={() => openLightbox(0)}
                                    >
                                        <span className="flex items-center gap-2">
                                            <Images className="h-4 w-4" />
                                            View all photos
                                        </span>
                                    </button>
                                    {previewImages.length > 1 && (
                                        <div className="absolute bottom-6 right-6 hidden w-[300px] grid-cols-2 gap-2 lg:grid">
                                            {previewImages.slice(1, 5).map((url, index) => (
                                            <button
                                                key={url}
                                                type="button"
                                                className="group relative overflow-hidden rounded-[20px] border border-white/15 bg-black/10 shadow-[0_16px_30px_rgba(0,0,0,0.22)] backdrop-blur focus:outline-none"
                                                onClick={() => openLightbox(index + 1)}
                                                aria-label={`View photo ${index + 2} of ${name}`}
                                            >
                                                <div className="aspect-[4/3] overflow-hidden">
                                                    <OptimizedImage
                                                        src={url}
                                                        alt={`${name} photo ${index + 2}`}
                                                        width={720}
                                                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                        onError={handleImageError(url)}
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />
                                                </div>
                                                {index === Math.min(previewImages.length - 2, 3) && validImages.length > previewImages.length && (
                                                    <div className="absolute inset-x-0 bottom-0 p-3 text-left text-sm font-semibold text-white">
                                                        +{validImages.length - previewImages.length} more photos
                                                    </div>
                                                )}
                                            </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="relative md:hidden">
                            <div className="flex h-80 snap-x snap-mandatory overflow-x-auto scrollbar-hide">
                                {validImages.map((url, index) => (
                                    <button
                                        key={url}
                                        type="button"
                                        className="relative block h-full w-full flex-none snap-center overflow-hidden focus:outline-none"
                                        onClick={() => openLightbox(index)}
                                    >
                                        <OptimizedImage
                                            src={url}
                                            alt={`${name} photo ${index + 1}`}
                                            width={960}
                                            className="h-full w-full object-cover"
                                            onError={handleImageError(url)}
                                        />
                                        {index === 0 && (
                                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-5 text-left">
                                                <h2 className="text-2xl font-extrabold tracking-tight text-white">{name}</h2>
                                                {locationName && (
                                                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                                                        {locationName}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                            <button
                                type="button"
                                className="absolute bottom-4 right-4 rounded-full bg-black/55 px-4 py-2 text-sm font-semibold text-white backdrop-blur"
                                onClick={() => openLightbox(0)}
                            >
                                View all photos
                            </button>
                        </div>
                    </>
                )}
            </div>

            <AnimatePresence>
                {lightboxIndex !== null && validImages[lightboxIndex] && (
                    <motion.div
                        key="lightbox"
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeLightbox}
                    >
                        <button
                            type="button"
                            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2.5 text-white backdrop-blur transition hover:bg-white/20"
                            onClick={closeLightbox}
                            aria-label="Close gallery"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="absolute top-5 left-1/2 z-10 -translate-x-1/2 text-sm font-medium tracking-wider text-white/75">
                            {lightboxIndex + 1} / {validImages.length}
                        </div>

                        {validImages.length > 1 && (
                            <button
                                type="button"
                                className="absolute left-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prev();
                                }}
                                aria-label="Previous photo"
                            >
                                <ChevronLeft className="h-6 w-6" />
                            </button>
                        )}

                        <motion.img
                            key={validImages[lightboxIndex]}
                            src={validImages[lightboxIndex]}
                            alt={`${name} photo ${lightboxIndex + 1}`}
                            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            onClick={(e) => e.stopPropagation()}
                            onError={handleImageError(validImages[lightboxIndex])}
                        />

                        {validImages.length > 1 && (
                            <button
                                type="button"
                                className="absolute right-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    next();
                                }}
                                aria-label="Next photo"
                            >
                                <ChevronRight className="h-6 w-6" />
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
