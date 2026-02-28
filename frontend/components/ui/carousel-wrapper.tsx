'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselWrapperProps {
    children: ReactNode;
    headerLeft?: ReactNode; // Title/Description to be placed on the left
    className?: string; // Additional classes for the outer container
}

export function CarouselWrapper({ children, headerLeft, className = '' }: CarouselWrapperProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            // Use a small buffer (e.g., 2px) to account for browser subpixel rounding
            setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
        }
    };

    useEffect(() => {
        checkScroll();
        // Add a ResizeObserver to handle layout changes
        const currentRef = scrollContainerRef.current;
        if (currentRef) {
            const resizeObserver = new ResizeObserver(() => checkScroll());
            resizeObserver.observe(currentRef);
            return () => resizeObserver.disconnect();
        }
    }, [children]);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            const { clientWidth } = scrollContainerRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className={`w-full ${className}`}>
            {/* Header with Title and Navigation */}
            <div className="flex items-end justify-between mb-6">
                <div className="flex-1">
                    {headerLeft}
                </div>

                {/* Desktop Navigation Controls */}
                <div className="hidden md:flex items-center gap-2 mb-1">
                    <button
                        onClick={() => scroll('left')}
                        disabled={!canScrollLeft}
                        className={cn(
                            "p-2 rounded-full border border-gray-200 transition-all duration-200",
                            canScrollLeft
                                ? "bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-900 shadow-sm active:scale-95"
                                : "bg-gray-50 text-gray-300 cursor-not-allowed"
                        )}
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        disabled={!canScrollRight}
                        className={cn(
                            "p-2 rounded-full border border-gray-200 transition-all duration-200",
                            canScrollRight
                                ? "bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-900 shadow-sm active:scale-95"
                                : "bg-gray-50 text-gray-300 cursor-not-allowed"
                        )}
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* The Scrollable Horizontal Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 relative w-full"
            >
                {children}
            </div>
        </div>
    );
}

// Helper for conditional classes if not imported
function cn(...classes: string[]) {
    return classes.filter(Boolean).join(' ');
}
