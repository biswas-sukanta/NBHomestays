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

    const testId = `carousel-${title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

    return (
        <section data-testid={testId}>
            <div className="w-full">
                {/* Header */}
                <div className="flex items-end justify-between mb-2">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">{title}</h2>
                        {description && <p className="text-gray-400 text-sm mb-6">{description}</p>}
                    </div>
                    {viewAllLink && (
                        <Link href={viewAllLink} className="text-primary font-semibold text-sm flex items-center gap-1 hover:underline shrink-0 ml-4 mb-2">
                            See all <ArrowRight className="w-4 h-4" />
                        </Link>
                    )}
                </div>

                {/* Horizontal Scrolling Swimlane */}
                <div
                    className="flex gap-6 overflow-x-auto snap-x hide-scrollbar"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {homestays.map((homestay, index) => (
                        <HomestayCard key={homestay.id} homestay={homestay} index={index} />
                    ))}
                </div>
            </div>
        </section>
    );
}
