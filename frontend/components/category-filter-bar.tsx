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
    { label: 'Trending', tag: 'Trending Now', icon: Flame },
    { label: 'Workations', tag: 'Workation', icon: Wifi },
    { label: 'Offbeat', tag: 'Explore Offbeat', icon: Tent },
    { label: 'Views', tag: 'Mountain View', icon: TreePine },
    { label: 'Heritage', tag: 'Heritage', icon: Coffee },
    { label: 'Nature', tag: 'Nature & Eco', icon: Camera },
    { label: 'Pet Friendly', tag: 'Pet Friendly', icon: PawPrint },
    { label: 'Couples', tag: 'Couples Getaway', icon: Heart },
    { label: 'Groups', tag: 'Group Friendly', icon: Users },
    { label: 'Premium', tag: 'Premium', icon: Star },
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
                    className="flex justify-center gap-4 md:gap-8 overflow-x-auto snap-x hide-scrollbar py-3 px-4 items-center scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        const isSelected = currentTag === cat.tag;
                        return (
                            <button
                                key={cat.tag}
                                onClick={() => handleCategoryClick(cat.tag)}
                                className={`
                                    flex flex-col items-center justify-center min-w-[64px] cursor-pointer transition-colors gap-1.5
                                    ${isSelected ? 'border-b-2 border-gray-900 pb-1' : 'hover:opacity-100 pb-1.5'}
                                `}
                            >
                                <Icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5px] text-gray-900' : 'stroke-2 text-gray-500 group-hover:text-gray-800'}`} />
                                <span className={`text-xs font-semibold whitespace-nowrap ${isSelected ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-800'}`}>
                                    {cat.label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
