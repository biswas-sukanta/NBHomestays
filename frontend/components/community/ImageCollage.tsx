'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ImageCollageProps {
    images: string[];
    onImageClick: (index: number) => void;
}

function CollageImg({ src, className, onClick }: { src: string; className?: string; onClick: () => void }) {
    const [loaded, setLoaded] = React.useState(false);
    const optimized = src.includes('ik.imagekit.io') ? `${src}?tr=w-800,q-80` : src;
    return (
        <div className={cn('relative overflow-hidden bg-secondary/30 cursor-pointer', className)} onClick={onClick}>
            {/* Blur-up placeholder */}
            <img src={optimized} alt="" aria-hidden className={cn('absolute inset-0 w-full h-full object-cover blur-xl scale-110 transition-opacity duration-500', loaded ? 'opacity-0' : 'opacity-100')} />
            <img
                src={optimized}
                alt="Post image"
                className={cn('w-full h-full object-cover transition-all duration-500 hover:scale-105', loaded ? 'opacity-100' : 'opacity-0')}
                onLoad={() => setLoaded(true)}
            />
        </div>
    );
}

export function ImageCollage({ images, onImageClick }: ImageCollageProps) {
    if (!images || images.length === 0) return null;

    const count = images.length;
    const maxVisible = 5;
    const extra = count - maxVisible;

    if (count === 1) {
        return (
            <div className="w-full">
                <CollageImg src={images[0]} className="w-full h-80 sm:h-[420px] rounded-none" onClick={() => onImageClick(0)} />
            </div>
        );
    }

    if (count === 2) {
        return (
            <div className="grid grid-cols-2 gap-0.5 w-full">
                {images.map((url, i) => (
                    <CollageImg key={i} src={url} className="h-64 sm:h-80" onClick={() => onImageClick(i)} />
                ))}
            </div>
        );
    }

    if (count === 3) {
        return (
            <div className="grid grid-cols-2 gap-0.5 w-full">
                <CollageImg src={images[0]} className="col-span-2 h-56 sm:h-72" onClick={() => onImageClick(0)} />
                {images.slice(1, 3).map((url, i) => (
                    <CollageImg key={i + 1} src={url} className="h-44 sm:h-56" onClick={() => onImageClick(i + 1)} />
                ))}
            </div>
        );
    }

    if (count === 4) {
        return (
            <div className="flex flex-col gap-0.5 w-full rounded-sm overflow-hidden border border-gray-100">
                <CollageImg src={images[0]} className="w-full h-56 sm:h-72" onClick={() => onImageClick(0)} />
                <div className="grid grid-cols-3 gap-0.5 w-full h-28 sm:h-40">
                    <CollageImg src={images[1]} className="h-full w-full" onClick={() => onImageClick(1)} />
                    <CollageImg src={images[2]} className="h-full w-full" onClick={() => onImageClick(2)} />
                    <CollageImg src={images[3]} className="h-full w-full" onClick={() => onImageClick(3)} />
                </div>
            </div>
        );
    }

    // 5+ images (LinkedIn style 4-visible config)
    const extraForFour = count - 4;
    return (
        <div className="flex flex-col gap-0.5 w-full rounded-sm overflow-hidden border border-gray-100">
            <CollageImg src={images[0]} className="w-full h-56 sm:h-72" onClick={() => onImageClick(0)} />
            <div className="grid grid-cols-3 gap-0.5 w-full h-28 sm:h-40">
                <CollageImg src={images[1]} className="h-full w-full" onClick={() => onImageClick(1)} />
                <CollageImg src={images[2]} className="h-full w-full" onClick={() => onImageClick(2)} />
                <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => onImageClick(3)}>
                    <CollageImg src={images[3]} className="h-full w-full" onClick={() => onImageClick(3)} />
                    {extraForFour > 0 && (
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                            <span className="text-white font-semibold text-2xl tracking-tight">+{extraForFour}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
