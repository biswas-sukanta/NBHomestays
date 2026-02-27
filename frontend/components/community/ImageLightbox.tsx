'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageLightboxProps {
    images: string[];
    initialIndex: number;
    onClose: () => void;
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
    const [current, setCurrent] = useState(initialIndex);
    const thumbnailRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef<number | null>(null);

    const goNext = () => setCurrent(i => Math.min(i + 1, images.length - 1));
    const goPrev = () => setCurrent(i => Math.max(i - 1, 0));

    // ── Scroll Lock ──────────────────────────────────────────────
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'unset'; };
    }, []);

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

    return createPortal(
        <div
            className="fixed inset-0 z-[9999] flex flex-col bg-black/95 backdrop-blur-sm w-screen h-screen overflow-hidden"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            {/* Tier 1: Header — flex-none, close button in flow */}
            <div className="flex-none flex items-center justify-between px-4 py-3 w-full">
                {/* Counter on the left */}
                <div className="text-white/70 text-sm font-semibold">
                    {current + 1} / {images.length}
                </div>
                {/* Close button on the right — NOT absolutely positioned */}
                <button
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
                    aria-label="Close lightbox"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Tier 2: Image Container — flex-1 min-h-0, zoom-proof */}
            <div
                className="flex-1 min-h-0 w-full flex items-center justify-center p-2 md:p-8 relative"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <img
                    key={current}
                    src={optimized(images[current])}
                    alt={`Image ${current + 1}`}
                    className="max-w-full max-h-full object-contain drop-shadow-2xl select-none rounded-lg animate-in fade-in duration-200"
                />

                {/* Left arrow — absolutely positioned inside Tier 2 */}
                {current > 0 && (
                    <button
                        onClick={goPrev}
                        className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110"
                        aria-label="Previous image"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                )}

                {/* Right arrow — absolutely positioned inside Tier 2 */}
                {current < images.length - 1 && (
                    <button
                        onClick={goNext}
                        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-all hover:scale-110"
                        aria-label="Next image"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Tier 3: Footer — flex-none, thumbnails + injected action bar */}
            <div className="flex-none w-full">
                {/* Thumbnail strip */}
                {images.length > 1 && (
                    <div ref={thumbnailRef} className="flex gap-2 overflow-x-auto py-2 px-4" style={{ scrollbarWidth: 'none' }}>
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

            </div>
        </div>,
        document.body
    );
}
