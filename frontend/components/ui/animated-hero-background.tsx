import React, { ReactNode } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AnimatedHeroBackgroundProps {
    imageUrl: string;
    children?: ReactNode;
    className?: string; // used for outer wrapper (e.g., setting height)
    overlayClassName?: string; // override standard gradient overlay if needed
}

export function AnimatedHeroBackground({
    imageUrl,
    children,
    className = "min-h-[60vh] md:min-h-[70vh]",
    overlayClassName = "bg-gradient-to-t from-black/80 via-black/40 to-transparent"
}: AnimatedHeroBackgroundProps) {
    return (
        <div className={cn("relative w-full overflow-hidden select-none", className)}>
            {/* ── Ken Burns background ── */}
            <div className="absolute inset-0 h-full w-full animate-ken-burns" aria-hidden="true">
                <Image
                    src={imageUrl}
                    alt="Hero background"
                    fill
                    priority
                    quality={100}
                    sizes="100vw"
                    className="object-cover"
                />
            </div>

            {/* ── Layered overlays for editorial depth ── */}
            <div className={cn("absolute inset-0", overlayClassName)} />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/10" />

            {/* ── Content ── */}
            {children && (
                <div className="relative z-10 h-full w-full">
                    {children}
                </div>
            )}
        </div>
    );
}
