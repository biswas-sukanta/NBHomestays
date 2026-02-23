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
        <div className="sticky top-[64px] z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm w-full">
            <div className="container mx-auto">
                <div
                    className="flex gap-4 overflow-x-auto snap-x hide-scrollbar py-4 px-6 items-center scroll-smooth"
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
                                    flex flex-col items-center justify-center min-w-[80px] cursor-pointer transition-opacity
                                    ${isSelected ? 'opacity-100 border-b-2 border-black pb-2' : 'opacity-60 hover:opacity-100 pb-[10px]'}
                                `}
                            >
                                <Icon className={`w-6 h-6 mb-2 ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                <span className={`text-sm whitespace-nowrap ${isSelected ? 'font-bold' : 'font-semibold text-gray-700'}`}>
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
