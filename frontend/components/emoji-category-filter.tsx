'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { label: 'Trending', tag: 'Trending Now', icon: '🔥' },
    { label: 'Workations', tag: 'Workation', icon: '💻' },
    { label: 'Offbeat', tag: 'Explore Offbeat', icon: '🍃' },
    { label: 'Views', tag: 'Mountain View', icon: '🏔️' },
    { label: 'Heritage', tag: 'Heritage', icon: '🏛️' },
    { label: 'Nature', tag: 'Nature & Eco', icon: '🌲' },
    { label: 'Pet Friendly', tag: 'Pet Friendly', icon: '🐾' },
    { label: 'Couples', tag: 'Couples Getaway', icon: '❤️' },
    { label: 'Groups', tag: 'Group Friendly', icon: '👥' },
    { label: 'Premium', tag: 'Premium', icon: '✨' },
];

interface EmojiCategoryFilterProps {
    activeCategory: string;
    onCategoryChange: (category: string) => void;
}

export function EmojiCategoryFilter({ activeCategory, onCategoryChange }: EmojiCategoryFilterProps) {
    return (
        <div className="w-full flex justify-center">
            <div className="flex justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto snap-x hide-scrollbar py-4 px-4 w-full" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {CATEGORIES.map((cat) => {
                    const isSelected = activeCategory === cat.tag;
                    return (
                        <div
                            key={cat.tag}
                            onClick={() => onCategoryChange(cat.tag)}
                            className={cn(
                                "flex flex-col items-center gap-1 cursor-pointer min-w-[60px] opacity-70 hover:opacity-100 transition-opacity snap-center",
                                isSelected ? "opacity-100 border-b-2 border-gray-900 pb-1" : "pb-1.5"
                            )}
                        >
                            <span className="text-2xl">{cat.icon}</span>
                            <span className={cn(
                                "text-xs font-semibold whitespace-nowrap",
                                isSelected ? "text-gray-900" : "text-gray-700"
                            )}>
                                {cat.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
