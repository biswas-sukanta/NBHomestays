'use client';

import React, { useRef, useState, useEffect, ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselWrapperProps {
    children: ReactNode;
    className?: string; // Additional classes for the outer container
}

export function CarouselWrapper({ children, className = '' }: CarouselWrapperProps) {
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
        <div className={`relative group ${className}`}>
            {/* Left Desktop Arrow - Hidden on mobile, hidden if at start */}
            <div className={`absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden md:block transition-opacity duration-300 ${canScrollLeft ? 'opacity-0 group-hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={() => scroll('left')}
                    className="p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl text-gray-700 hover:text-[#004d00] hover:scale-105 hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#004d00] focus:ring-offset-1"
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
            </div>

            {/* The Scrollable Horizontal Container */}
            <div
                ref={scrollContainerRef}
                onScroll={checkScroll}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-6 relative w-full"
            >
                {children}
            </div>

            {/* Right Desktop Arrow - Hidden on mobile, hidden if at end */}
            <div className={`absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden md:block transition-opacity duration-300 ${canScrollRight ? 'opacity-0 group-hover:opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <button
                    onClick={() => scroll('right')}
                    className="p-2.5 rounded-full bg-white/90 backdrop-blur-md border border-gray-100 shadow-xl text-gray-700 hover:text-[#004d00] hover:scale-105 hover:bg-white transition-all focus:outline-none focus:ring-2 focus:ring-[#004d00] focus:ring-offset-1"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
}
