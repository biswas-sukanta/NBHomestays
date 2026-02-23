'use client';

import * as React from 'react';
import { HomestaySummary, HomestayCard } from './homestay-card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface HomestayCarouselProps {
    title: string;
    description?: string;
    homestays: HomestaySummary[];
    viewAllLink?: string;
}

export function HomestayCarousel({ title, description, homestays, viewAllLink }: HomestayCarouselProps) {
    if (!homestays || homestays.length === 0) return null;

    return (
        <section className="py-8">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="flex items-end justify-between mb-6">
                    <div className="mb-2">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">{title}</h2>
                        {description && <p className="text-muted-foreground text-base mt-1">{description}</p>}
                    </div>
                    {viewAllLink && (
                        <Link href={viewAllLink} className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline">
                            See all <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Horizontal Scrolling Swimlane */}
                {/* 
                    Using 'scrollbar-hide' requires the plugin plugin('tailwind-scrollbar-hide') or custom css, 
                    since NextJS doesn't have it by default, we apply native style for hiding scrollbar 
                */}
                <div
                    className="flex gap-5 overflow-x-auto pb-6 snap-x snap-mandatory focus:outline-none scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {homestays.map((homestay, index) => (
                        <div
                            key={homestay.id}
                            className="min-w-[85vw] sm:min-w-[340px] md:min-w-[360px] lg:min-w-[380px] shrink-0 snap-start"
                        >
                            <HomestayCard homestay={homestay} index={index} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
