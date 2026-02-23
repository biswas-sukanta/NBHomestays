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
        <div className="sticky top-[64px] z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm w-full">
            <div className="container mx-auto">
                <div
                    className="flex gap-6 overflow-x-auto snap-x hide-scrollbar py-2 mb-8 border-b border-gray-100 items-center scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
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
        </div>
    );
}
