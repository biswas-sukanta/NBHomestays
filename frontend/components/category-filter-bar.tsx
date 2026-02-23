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
        <div className="sticky top-[64px] z-40 bg-[#0f172a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f172a]/80 border-b border-gray-800 shadow-sm w-full">
            <div className="container mx-auto">
                <div
                    className="flex gap-4 overflow-x-auto snap-x hide-scrollbar py-4 px-2 items-center scroll-smooth"
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
                                    flex flex-col items-center justify-center min-w-[80px] cursor-pointer transition-opacity gap-2
                                    ${isSelected ? 'opacity-100 border-b-2 border-white pb-1' : 'opacity-60 hover:opacity-100'}
                                `}
                            >
                                <Icon className={`w-6 h-6 ${isSelected ? 'stroke-[2.5px] text-white' : 'stroke-2 text-gray-400 hover:text-white'}`} />
                                <span className={`text-sm font-medium whitespace-nowrap ${isSelected ? 'text-white' : 'text-gray-400 hover:text-white'}`}>
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
