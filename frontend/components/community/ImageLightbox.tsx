'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
    footer?: React.ReactNode;
}

export function ImageLightbox({ images, initialIndex, onClose, footer }: ImageLightboxProps) {
    const [current, setCurrent] = useState(initialIndex);
    const thumbnailRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    const goNext = () => setCurrent(i => Math.min(i + 1, images.length - 1));
    const goPrev = () => setCurrent(i => Math.max(i - 1, 0));

    // Keyboard navigation
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Scroll active thumbnail into view
    useEffect(() => {
        const container = thumbnailRef.current;
        if (!container) return;
        const thumb = container.children[current] as HTMLElement;
        if (thumb) thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [current]);

    // Touch swipe support
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx > 60) goPrev();
        else if (dx < -60) goNext();
        touchStartX.current = null;
    };

    const optimized = (src: string) => src.includes('ik.imagekit.io') ? `${src}?tr=w-1600,q-85` : src;
    const thumb = (src: string) => src.includes('ik.imagekit.io') ? `${src}?tr=w-160,h-120,cm-extract` : src;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-between pt-4 overflow-hidden"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Close button */}
            <div className="w-full flex justify-end px-4 sm:px-8 pb-2 shrink-0">
                <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Main image */}
            <div
                className="relative flex-1 w-full flex items-center justify-center px-12 sm:px-20 overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    key={current}
                    src={optimized(images[current])}
                    alt={`Image ${current + 1}`}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-2xl animate-in fade-in duration-200"
                />

                {/* Left arrow */}
                {current > 0 && (
                    <button
                        onClick={goPrev}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Right arrow */}
                {current < images.length - 1 && (
                    <button
                        onClick={goNext}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}

                {/* Counter */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
                    {current + 1} / {images.length}
                </div>
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
                <div ref={thumbnailRef} className="flex gap-2 overflow-x-auto py-3 px-4 shrink-0 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {images.map((url, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={cn(
                                'w-16 h-12 sm:w-20 sm:h-14 flex-none rounded-lg overflow-hidden transition-all duration-200',
                                i === current ? 'ring-2 ring-white scale-110 shadow-lg' : 'opacity-50 hover:opacity-80'
                            )}
                        >
                            <img src={thumb(url)} alt="" className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}

            {/* Injected Footer (e.g. Post Action Bar) */}
            {footer && (
                <div className="w-full shrink-0 mt-auto">
                    {footer}
                </div>
            )}
        </div>
    );
}
