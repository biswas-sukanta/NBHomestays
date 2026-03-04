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
    return (
        <div className="w-full flex justify-center">
            <div
                className="flex justify-start md:justify-center gap-2 md:gap-3 overflow-x-auto snap-x hide-scrollbar py-2 px-2 w-full"
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
                                "flex items-center gap-1.5 cursor-pointer px-4 py-2.5 rounded-full transition-all duration-300 ease-out snap-center border whitespace-nowrap",
                                isSelected
                                    ? "bg-gradient-to-r from-amber-500 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105 border-transparent"
                                    : "border-gray-200 hover:border-amber-300/60 hover:bg-amber-50/50 hover:text-amber-600"
                            )}
                        >
                            <Icon className={cn(
                                "w-5 h-5 transition-colors",
                                isSelected ? "text-white" : cat.color
                            )} />
                            <span className={cn(
                                "text-sm font-semibold tracking-wide",
                                isSelected ? "text-white" : "text-gray-700"
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
