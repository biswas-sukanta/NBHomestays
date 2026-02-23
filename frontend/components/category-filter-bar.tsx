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
            <div className="container mx-auto px-4">
                <div
                    className="flex gap-8 overflow-x-auto py-4 items-center snap-x snap-mandatory scroll-smooth"
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
                                    flex flex-col items-center justify-center gap-2 min-w-[72px] snap-start shrink-0 transition-all duration-200
                                    hover:-translate-y-0.5
                                    ${isSelected ? 'text-primary scale-105' : 'text-muted-foreground hover:text-foreground hover:opacity-100 opacity-80'}
                                `}
                            >
                                <Icon className={`w-6 h-6 transition-transform ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                                <span className={`text-[11px] whitespace-nowrap ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                                    {cat.label}
                                </span>
                                {/* Active Indicator Bar */}
                                {isSelected && (
                                    <div className="absolute -bottom-[17px] w-full h-[3px] bg-primary rounded-t-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
