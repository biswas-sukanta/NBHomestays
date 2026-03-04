'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    Flame, Laptop, Leaf, Mountain, Landmark, Trees, PawPrint, Heart, Users, Sparkles, Zap, Coffee,
} from 'lucide-react';

const CATEGORIES = [
    { label: 'Trending', tag: 'Trending Now', icon: Flame, color: 'text-orange-500' },
    { label: 'Workations', tag: 'Workation', icon: Laptop, color: 'text-blue-500' },
    { label: 'Offbeat', tag: 'Explore Offbeat', icon: Leaf, color: 'text-emerald-500' },
    { label: 'Views', tag: 'Mountain View', icon: Mountain, color: 'text-indigo-500' },
    { label: 'Heritage', tag: 'Heritage', icon: Landmark, color: 'text-amber-600' },
    { label: 'Nature', tag: 'Nature & Eco', icon: Trees, color: 'text-green-600' },
    { label: 'Off-the-grid', tag: 'Off Grid', icon: Zap, color: 'text-yellow-500' },
    { label: 'Cozy Retreats', tag: 'Cozy', icon: Coffee, color: 'text-orange-600' },
    { label: 'Pet Friendly', tag: 'Pet Friendly', icon: PawPrint, color: 'text-orange-400' },
    { label: 'Couples', tag: 'Couples Getaway', icon: Heart, color: 'text-rose-500' },
    { label: 'Groups', tag: 'Group Friendly', icon: Users, color: 'text-violet-500' },
    { label: 'Premium', tag: 'Premium', icon: Sparkles, color: 'text-amber-500' },
];

interface EmojiCategoryFilterProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function EmojiCategoryFilter({ activeCategory, onCategoryChange }: EmojiCategoryFilterProps) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [startX, setStartX] = React.useState(0);
    const [scrollLeft, setScrollLeft] = React.useState(0);

    const onMouseDown = (e: React.MouseEvent) => {
        if (!scrollRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollRef.current.offsetLeft);
        setScrollLeft(scrollRef.current.scrollLeft);
    };

    const onMouseLeave = () => setIsDragging(false);
    const onMouseUp = () => setIsDragging(false);

    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDragging || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX) * 2; // scroll speed multiplier
        scrollRef.current.scrollLeft = scrollLeft - walk;
    };

    return (
        <div className="relative w-full max-w-[100vw]">
            {/* Scroll Affordance Fades */}
            <div className="absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-white/90 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-white/90 to-transparent z-10 pointer-events-none" />

            <div
                ref={scrollRef}
                onMouseDown={onMouseDown}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                className={cn(
                    "flex justify-start gap-3 overflow-x-auto snap-x hide-scrollbar py-2 px-6 md:px-12 w-full select-none",
                    isDragging ? "cursor-grabbing snap-none" : "cursor-grab"
                )}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.tag;
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.tag}
                            onClick={() => onCategoryChange(cat.tag)}
                            className={cn(
                                "flex flex-col items-center justify-center gap-2 px-6 py-4 min-w-[110px] rounded-2xl transition-all duration-300 ease-out snap-center border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                                isSelected
                                    ? "bg-gradient-to-t from-amber-500 to-yellow-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] scale-105 border-transparent"
                                    : "bg-white border-gray-100 hover:border-amber-300/60 hover:bg-amber-50/50 hover:text-amber-600 shadow-sm hover:shadow-md"
                            )}
                            aria-label={`Filter by ${cat.label}`}
                            tabIndex={0}
                        >
                            <Icon className={cn(
                                "w-8 h-8 transition-colors duration-300",
                                isSelected ? "text-white" : cat.color
                            )} />
                            <span className={cn(
                                "text-sm font-medium tracking-wide whitespace-nowrap",
                                isSelected ? "text-white" : "text-slate-700"
                            )}>
                                {cat.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
