'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Flame,
    Wifi,
    Tent,
    TreePine,
    Coffee,
    Camera,
    PawPrint,
    Heart,
    Users,
    Star
} from 'lucide-react';

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

export function CategoryFilterBar() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTag = searchParams?.get('tag');

    const handleCategoryClick = (tag: string) => {
        const params = new URLSearchParams(searchParams?.toString() || '');
        if (currentTag === tag) {
            params.delete('tag'); // Toggle off
        } else {
            params.set('tag', tag); // Toggle on
        }
        router.push(`/search?${params.toString()}`);
    };

    return (
        <div className="w-full border-b border-gray-200 bg-white sticky top-[64px] z-40 flex justify-center px-4">
            <div className="flex justify-center gap-6 md:gap-10 overflow-x-auto snap-x hide-scrollbar py-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const isSelected = currentTag === cat.tag;
                    return (
                        <div
                            key={cat.tag}
                            onClick={() => handleCategoryClick(cat.tag)}
                            className={`
                                    flex flex-col items-center gap-1 cursor-pointer min-w-[60px] opacity-70 hover:opacity-100 transition-opacity
                                    ${isSelected ? 'opacity-100 border-b-2 border-gray-900 pb-1' : 'pb-1.5'}
                                `}
                        >
                            <span className="text-xl">{cat.icon}</span>
                            <span className={`text-xs font-semibold whitespace-nowrap ${isSelected ? 'text-gray-900' : 'text-gray-700'}`}>
                                {cat.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
